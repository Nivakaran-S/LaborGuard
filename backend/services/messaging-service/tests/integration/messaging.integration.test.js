/**
 * messaging.integration.test.js
 *
 * Coverage of messaging-service: conversations, messages, participant guard,
 * read tracking. Cloudinary uploads, Centrifugo realtime publish, and the
 * HTTP eventing layer are mocked.
 */

process.env.JWT_ACCESS_SECRET = 'test-access-secret-messaging';
process.env.NODE_ENV = 'test';
process.env.SERVICE_NAME = 'messaging-service-test';
process.env.INTERNAL_SERVICE_SECRET = 'test-internal-secret';

jest.mock('../../src/utils/cloudinaryConfig', () => {
    const multer = require('multer');
    return {
        cloudinary: {},
        upload: multer({ storage: multer.memoryStorage() }),
        uploadToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://test.cdn/m.jpg' }),
    };
});

jest.mock('../../src/utils/centrifugoClient', () => ({
    publishToChannel: jest.fn().mockResolvedValue(true),
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

const Conversation = require('../../src/models/Conversation');
const Message = require('../../src/models/Message');

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
    });
});

describe('Auth gating on messaging routes', () => {
    it('rejects POST /api/conversations without token (401)', async () => {
        const res = await request(app).post('/api/conversations').send({ participants: [] });
        expect(res.status).toBe(401);
    });
});

describe('POST /api/conversations', () => {
    it('creates a 1-1 conversation including the requester', async () => {
        const userA = newId();
        const userB = newId();
        const res = await request(app)
            .post('/api/conversations')
            .set(auth(signToken({ userId: userA })))
            .send({
                participants: [userB],
                participantRoles: [
                    { userId: userA, role: 'worker' },
                    { userId: userB, role: 'lawyer' },
                ],
            });
        expect(res.status).toBe(201);
        expect(res.body.participants).toEqual(expect.arrayContaining([userA, userB]));
        expect(res.body.isGroup).toBe(false);
    });

    it('returns the existing 1-1 conversation when one already exists (idempotent)', async () => {
        const userA = newId();
        const userB = newId();
        const existing = await Conversation.create({
            participants: [userA, userB],
            participantRoles: [
                { userId: userA, role: 'worker' },
                { userId: userB, role: 'lawyer' },
            ],
            isGroup: false,
        });

        const res = await request(app)
            .post('/api/conversations')
            .set(auth(signToken({ userId: userA })))
            .send({
                participants: [userA, userB],
                participantRoles: [
                    { userId: userA, role: 'worker' },
                    { userId: userB, role: 'lawyer' },
                ],
            });
        expect(res.status).toBe(200);
        expect(res.body._id).toBe(existing._id.toString());
    });

    it('rejects fewer than 2 participants with 400', async () => {
        const res = await request(app)
            .post('/api/conversations')
            .set(auth(signToken({ userId: newId() })))
            .send({ participants: [] });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/conversations', () => {
    it('returns only conversations the caller is a participant in', async () => {
        const userA = newId();
        const userB = newId();
        const userC = newId();

        await Conversation.create({
            participants: [userA, userB],
            participantRoles: [
                { userId: userA, role: 'worker' },
                { userId: userB, role: 'lawyer' },
            ],
        });
        await Conversation.create({
            participants: [userB, userC],
            participantRoles: [
                { userId: userB, role: 'lawyer' },
                { userId: userC, role: 'admin' },
            ],
        });

        const res = await request(app)
            .get('/api/conversations')
            .set(auth(signToken({ userId: userA })));
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].participants).toContain(userA);
    });
});

describe('POST /api/messages (send) + participant guard', () => {
    it('lets a participant send a message', async () => {
        const sender = newId();
        const peer = newId();
        const conversation = await Conversation.create({
            participants: [sender, peer],
            participantRoles: [
                { userId: sender, role: 'worker' },
                { userId: peer, role: 'lawyer' },
            ],
        });

        const res = await request(app)
            .post('/api/messages')
            .set(auth(signToken({ userId: sender })))
            .send({ conversationId: conversation._id.toString(), content: 'hello' });
        expect(res.status).toBe(201);

        const stored = await Message.find({ conversationId: conversation._id });
        expect(stored).toHaveLength(1);
        expect(stored[0].senderId).toBe(sender);
    });

    it('blocks non-participants with 403', async () => {
        const peer1 = newId();
        const peer2 = newId();
        const stranger = newId();
        const conversation = await Conversation.create({
            participants: [peer1, peer2],
            participantRoles: [
                { userId: peer1, role: 'worker' },
                { userId: peer2, role: 'lawyer' },
            ],
        });

        const res = await request(app)
            .post('/api/messages')
            .set(auth(signToken({ userId: stranger })))
            .send({ conversationId: conversation._id.toString(), content: 'sneaky' });
        expect(res.status).toBe(403);
    });

    it('rejects 404 when conversationId does not exist', async () => {
        const res = await request(app)
            .post('/api/messages')
            .set(auth(signToken({ userId: newId() })))
            .send({ conversationId: newId(), content: 'hi' });
        expect(res.status).toBe(404);
    });

    it('rejects sending without content or media (400)', async () => {
        const sender = newId();
        const peer = newId();
        const conv = await Conversation.create({
            participants: [sender, peer],
            participantRoles: [
                { userId: sender, role: 'worker' },
                { userId: peer, role: 'lawyer' },
            ],
        });
        const res = await request(app)
            .post('/api/messages')
            .set(auth(signToken({ userId: sender })))
            .send({ conversationId: conv._id.toString() });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/messages/:conversationId', () => {
    it('returns messages for a participant in chronological order', async () => {
        const u1 = newId();
        const u2 = newId();
        const conv = await Conversation.create({
            participants: [u1, u2],
            participantRoles: [
                { userId: u1, role: 'worker' },
                { userId: u2, role: 'lawyer' },
            ],
        });
        await Message.create([
            { conversationId: conv._id, senderId: u1, content: 'first' },
            { conversationId: conv._id, senderId: u2, content: 'second' },
        ]);

        const res = await request(app)
            .get(`/api/messages/${conv._id}`)
            .set(auth(signToken({ userId: u1 })));
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].content).toBe('first'); // ascending order
    });

    it('blocks non-participants from reading (403)', async () => {
        const u1 = newId();
        const u2 = newId();
        const conv = await Conversation.create({
            participants: [u1, u2],
            participantRoles: [
                { userId: u1, role: 'worker' },
                { userId: u2, role: 'lawyer' },
            ],
        });

        const res = await request(app)
            .get(`/api/messages/${conv._id}`)
            .set(auth(signToken({ userId: newId() })));
        expect(res.status).toBe(403);
    });
});

describe('Internal events guard', () => {
    it('rejects without secret header (403)', async () => {
        const res = await request(app)
            .post('/api/internal/events/complaint-events')
            .send({ type: 'complaint_assigned', payload: {} });
        expect(res.status).toBe(403);
    });
});
