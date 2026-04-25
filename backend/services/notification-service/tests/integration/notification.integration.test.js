/**
 * notification.integration.test.js
 *
 * Coverage of notification-service: CRUD on user notifications, internal
 * webhook from sibling services, auth gating. Resend (email) and the HTTP
 * eventing layer are mocked.
 */

process.env.JWT_ACCESS_SECRET = 'test-access-secret-notification';
process.env.NODE_ENV = 'test';
process.env.SERVICE_NAME = 'notification-service-test';
process.env.INTERNAL_SERVICE_SECRET = 'test-internal-secret';

jest.mock('../../src/utils/resendClient', () => ({
    sendEmailNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/utils/kafkaProducer', () => ({
    emitEvent: jest.fn().mockResolvedValue([]),
    connectProducer: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { setupTestDB } = require('../helpers/testDb');

const Notification = require('../../src/models/Notification');

beforeAll(setupTestDB.start);
afterAll(setupTestDB.stop);
beforeEach(setupTestDB.clear);

const signToken = ({ userId, role = 'worker', email = 'user@test.com' }) =>
    jwt.sign(
        { sub: userId.toString(), userId: userId.toString(), email, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
    );

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const newId = () => new mongoose.Types.ObjectId().toString();

describe('GET /health', () => {
    it('returns 200', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ status: 'ok' });
    });
});

describe('POST /api/notifications (internal write — no auth)', () => {
    it('creates a notification with required fields', async () => {
        const userId = newId();
        const res = await request(app).post('/api/notifications').send({
            userId,
            type: 'system',
            title: 'Welcome',
            body: 'Thanks for joining',
        });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            userId,
            type: 'system',
            title: 'Welcome',
            isRead: false,
        });
    });

    it('rejects missing userId/title/body with 400', async () => {
        const res = await request(app).post('/api/notifications').send({ title: 'x' });
        expect(res.status).toBe(400);
    });

    it('defaults type to system when omitted', async () => {
        const res = await request(app).post('/api/notifications').send({
            userId: newId(),
            title: 'Hi',
            body: 'Body',
        });
        expect(res.status).toBe(201);
        expect(res.body.type).toBe('system');
    });
});

describe('GET /api/notifications (auth required, scoped to caller)', () => {
    it('returns 401 unauthenticated', async () => {
        const res = await request(app).get('/api/notifications');
        expect(res.status).toBe(401);
    });

    it('returns only the caller\'s notifications, not anyone else\'s', async () => {
        const userA = newId();
        const userB = newId();

        await Notification.create({ userId: userA, title: 'A1', body: 'b' });
        await Notification.create({ userId: userA, title: 'A2', body: 'b' });
        await Notification.create({ userId: userB, title: 'B1', body: 'b' });

        const res = await request(app)
            .get('/api/notifications')
            .set(auth(signToken({ userId: userA })));
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body.every((n) => n.userId === userA)).toBe(true);
    });

    it('respects limit param', async () => {
        const userId = newId();
        await Notification.create([
            { userId, title: '1', body: 'b' },
            { userId, title: '2', body: 'b' },
            { userId, title: '3', body: 'b' },
        ]);
        const res = await request(app)
            .get('/api/notifications?limit=2')
            .set(auth(signToken({ userId })));
        expect(res.body).toHaveLength(2);
    });
});

describe('GET /api/notifications/unread-count', () => {
    it('returns the count of unread notifications for the caller', async () => {
        const userId = newId();
        await Notification.create([
            { userId, title: 'a', body: 'b', isRead: false },
            { userId, title: 'c', body: 'd', isRead: false },
            { userId, title: 'e', body: 'f', isRead: true },
        ]);
        const res = await request(app)
            .get('/api/notifications/unread-count')
            .set(auth(signToken({ userId })));
        expect(res.status).toBe(200);
        expect(res.body.unreadCount).toBe(2);
    });
});

describe('PATCH /api/notifications/:id/read', () => {
    it('marks a single notification as read', async () => {
        const userId = newId();
        const n = await Notification.create({ userId, title: 'x', body: 'y' });
        const res = await request(app)
            .patch(`/api/notifications/${n._id}/read`)
            .set(auth(signToken({ userId })));
        expect(res.status).toBe(200);
        expect(res.body.isRead).toBe(true);
    });

    it('returns 404 for unknown id', async () => {
        const res = await request(app)
            .patch(`/api/notifications/${newId()}/read`)
            .set(auth(signToken({ userId: newId() })));
        expect(res.status).toBe(404);
    });
});

describe('PATCH /api/notifications/read-all', () => {
    it('marks every unread notification of the caller as read', async () => {
        const userId = newId();
        await Notification.create([
            { userId, title: '1', body: 'b' },
            { userId, title: '2', body: 'b' },
            { userId, title: '3', body: 'b', isRead: true },
        ]);
        const res = await request(app)
            .patch('/api/notifications/read-all')
            .set(auth(signToken({ userId })));
        expect(res.status).toBe(200);
        const remaining = await Notification.countDocuments({ userId, isRead: false });
        expect(remaining).toBe(0);
    });

    it('does not flip another user\'s unread notifications', async () => {
        const userA = newId();
        const userB = newId();
        await Notification.create([
            { userId: userA, title: 'A', body: 'b' },
            { userId: userB, title: 'B', body: 'b' },
        ]);
        await request(app)
            .patch('/api/notifications/read-all')
            .set(auth(signToken({ userId: userA })))
            .expect(200);

        const bUnread = await Notification.findOne({ userId: userB });
        expect(bUnread.isRead).toBe(false);
    });
});

describe('DELETE /api/notifications/:id', () => {
    it('removes a notification', async () => {
        const userId = newId();
        const n = await Notification.create({ userId, title: 'x', body: 'y' });
        const res = await request(app)
            .delete(`/api/notifications/${n._id}`)
            .set(auth(signToken({ userId })));
        expect([200, 204]).toContain(res.status);
        expect(await Notification.findById(n._id)).toBeNull();
    });
});

describe('Internal events guard (/api/internal/events/:topic)', () => {
    it('rejects without secret header (403)', async () => {
        const res = await request(app)
            .post('/api/internal/events/auth-events')
            .send({ type: 'user_registered', payload: {} });
        expect(res.status).toBe(403);
    });

    it('accepts an event with the right secret', async () => {
        const res = await request(app)
            .post('/api/internal/events/complaint-events')
            .set('x-internal-secret', process.env.INTERNAL_SERVICE_SECRET)
            .send({
                type: 'complaint_status_updated',
                payload: {
                    complaintId: newId(),
                    workerId: newId(),
                    newStatus: 'under_review',
                    title: 'Test complaint',
                },
            });
        expect([200, 202]).toContain(res.status);
    });
});
