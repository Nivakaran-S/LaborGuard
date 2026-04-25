/**
 * community.integration.test.js
 *
 * End-to-end coverage of community-service: posts (CRUD + likes + polls),
 * profiles, internal-event guard. Real Mongo (in-process), real JWT
 * round-trip. Cloudinary, NSFW image moderation, content moderation, and
 * cross-service eventing are mocked — those are external dependencies that
 * shouldn't run during CI.
 */

process.env.JWT_ACCESS_SECRET = 'test-access-secret-community';
process.env.NODE_ENV = 'test';
process.env.SERVICE_NAME = 'community-service-test';
process.env.INTERNAL_SERVICE_SECRET = 'test-internal-secret';
process.env.DISABLE_NSFW_CHECK = 'true';

// In-process multer (no real Cloudinary) and pass-through uploadToCloudinary
jest.mock('../../src/utils/cloudinaryConfig', () => {
    const multer = require('multer');
    return {
        upload: multer({ storage: multer.memoryStorage() }),
        uploadToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://test.cdn/img.jpg' }),
    };
});

// Skip image moderation entirely — pass through
jest.mock('../../src/middleware/imageModeration', () => ({
    moderateImages: (req, _res, next) => next(),
}));

// Skip content moderation — pass through
jest.mock('../../src/middleware/contentModeration', () => ({
    moderateContent: (req, _res, next) => next(),
}));

// Mock cross-service eventing
jest.mock('../../src/utils/kafkaProducer', () => ({
    emitEvent: jest.fn().mockResolvedValue([]),
    connectProducer: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { setupTestDB } = require('../helpers/testDb');

const Post = require('../../src/models/Post');
const UserProfile = require('../../src/models/UserProfile');

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

const seedProfile = async (userId, overrides = {}) =>
    UserProfile.create({
        userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'worker',
        ...overrides,
    });

describe('GET /health', () => {
    it('returns 200 with service name', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ status: 'ok' });
    });
});

describe('Auth gating on /api/posts', () => {
    it('rejects unauthenticated POST with 401', async () => {
        const res = await request(app).post('/api/posts').send({ content: 'hi' });
        expect(res.status).toBe(401);
    });

    it('rejects expired/invalid token with 401', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set({ Authorization: 'Bearer not-a-jwt' })
            .send({ content: 'hi' });
        expect(res.status).toBe(401);
    });
});

describe('POST /api/posts (create post)', () => {
    it('creates a post with denormalized author fields from profile', async () => {
        const userId = newId();
        await seedProfile(userId, { name: 'Jane Worker', avatarUrl: 'https://x/y.jpg' });
        const token = signToken({ userId });

        const res = await request(app)
            .post('/api/posts')
            .set(auth(token))
            .send({ content: 'Stand up for fair wages.', hashtags: ['rights'] });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            authorId: userId,
            authorName: 'Jane Worker',
            content: 'Stand up for fair wages.',
            hashtags: ['rights'],
            likes: [],
            shareCount: 0,
        });
    });

    it('still creates a post even when no UserProfile exists (graceful empty author fields)', async () => {
        const userId = newId();
        const token = signToken({ userId });

        const res = await request(app)
            .post('/api/posts')
            .set(auth(token))
            .send({ content: 'No profile yet but I can still post.' });

        expect(res.status).toBe(201);
        expect(res.body.authorName).toBe('');
        expect(res.body.authorRole).toBe('worker');
    });
});

describe('GET /api/posts/:postId', () => {
    it('returns the requested post', async () => {
        const userId = newId();
        const post = await Post.create({
            authorId: userId,
            authorName: 'A',
            content: 'hello world',
        });
        const res = await request(app)
            .get(`/api/posts/${post._id}`)
            .set(auth(signToken({ userId })));
        expect(res.status).toBe(200);
        expect(res.body._id).toBe(post._id.toString());
    });

    it('returns 404 for an unknown post id', async () => {
        const res = await request(app)
            .get(`/api/posts/${newId()}`)
            .set(auth(signToken({ userId: newId() })));
        expect(res.status).toBe(404);
    });
});

describe('POST /api/posts/:postId/like', () => {
    it('toggles a like — first hit adds, second hit removes', async () => {
        const author = newId();
        const liker = newId();
        const post = await Post.create({ authorId: author, content: 'pls like' });
        const token = signToken({ userId: liker });

        const first = await request(app)
            .post(`/api/posts/${post._id}/like`)
            .set(auth(token));
        expect(first.status).toBe(200);
        expect(first.body).toMatchObject({ liked: true, likeCount: 1 });

        const second = await request(app)
            .post(`/api/posts/${post._id}/like`)
            .set(auth(token));
        expect(second.status).toBe(200);
        expect(second.body).toMatchObject({ liked: false, likeCount: 0 });
    });

    it('does not double-count a single liker', async () => {
        const post = await Post.create({ authorId: newId(), content: 'x' });
        const liker = newId();
        const token = signToken({ userId: liker });

        await request(app).post(`/api/posts/${post._id}/like`).set(auth(token));
        await request(app).post(`/api/posts/${post._id}/like`).set(auth(token)); // unlike
        await request(app).post(`/api/posts/${post._id}/like`).set(auth(token)); // re-like

        const fresh = await Post.findById(post._id);
        expect(fresh.likes).toHaveLength(1);
        expect(fresh.likes[0]).toBe(liker);
    });
});

describe('POST /api/posts/:postId/poll (poll voting)', () => {
    it('records a vote on a valid option', async () => {
        const post = await Post.create({
            authorId: newId(),
            content: 'pick one',
            poll: {
                question: 'Best day?',
                options: [
                    { text: 'Mon', votes: [] },
                    { text: 'Tue', votes: [] },
                ],
            },
        });
        const userId = newId();
        const res = await request(app)
            .post(`/api/posts/${post._id}/poll`)
            .set(auth(signToken({ userId })))
            .send({ optionIndex: 1 });
        expect(res.status).toBe(200);

        const fresh = await Post.findById(post._id);
        expect(fresh.poll.options[1].votes).toContain(userId);
    });

    it('rejects double-voting with 409', async () => {
        const post = await Post.create({
            authorId: newId(),
            content: 'pick one',
            poll: { question: 'q', options: [{ text: 'a', votes: [] }] },
        });
        const userId = newId();
        const token = signToken({ userId });
        await request(app).post(`/api/posts/${post._id}/poll`).set(auth(token)).send({ optionIndex: 0 });
        const res = await request(app).post(`/api/posts/${post._id}/poll`).set(auth(token)).send({ optionIndex: 0 });
        expect(res.status).toBe(409);
    });

    it('rejects out-of-range option index with 400', async () => {
        const post = await Post.create({
            authorId: newId(),
            content: 'p',
            poll: { question: 'q', options: [{ text: 'a', votes: [] }] },
        });
        const res = await request(app)
            .post(`/api/posts/${post._id}/poll`)
            .set(auth(signToken({ userId: newId() })))
            .send({ optionIndex: 99 });
        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/posts/:postId', () => {
    it('lets the author delete their own post', async () => {
        const author = newId();
        const post = await Post.create({ authorId: author, content: 'mine' });
        const res = await request(app)
            .delete(`/api/posts/${post._id}`)
            .set(auth(signToken({ userId: author })));
        expect(res.status).toBe(200);
        expect(await Post.findById(post._id)).toBeNull();
    });

    it('blocks a different worker from deleting (403)', async () => {
        const post = await Post.create({ authorId: newId(), content: 'mine' });
        const stranger = signToken({ userId: newId(), role: 'worker' });
        const res = await request(app).delete(`/api/posts/${post._id}`).set(auth(stranger));
        expect(res.status).toBe(403);
    });

    it('lets an admin delete anyone\'s post', async () => {
        const post = await Post.create({ authorId: newId(), content: 'someone else' });
        const admin = signToken({ userId: newId(), role: 'admin' });
        const res = await request(app).delete(`/api/posts/${post._id}`).set(auth(admin));
        expect(res.status).toBe(200);
    });
});

describe('Internal events guard (/api/internal/events/:topic)', () => {
    it('rejects without secret header (403)', async () => {
        const res = await request(app)
            .post('/api/internal/events/community-events')
            .send({ type: 'user_registered', payload: {} });
        expect(res.status).toBe(403);
    });

    it('rejects with wrong secret header (403)', async () => {
        const res = await request(app)
            .post('/api/internal/events/community-events')
            .set('x-internal-secret', 'bogus')
            .send({ type: 'user_registered', payload: {} });
        expect(res.status).toBe(403);
    });

    it('accepts a payload with the correct secret', async () => {
        const res = await request(app)
            .post('/api/internal/events/community-events')
            .set('x-internal-secret', process.env.INTERNAL_SERVICE_SECRET)
            .send({
                type: 'user_registered',
                payload: {
                    userId: newId(),
                    name: 'New User',
                    email: 'new@example.com',
                    role: 'worker',
                },
            });
        expect([200, 202]).toContain(res.status);
    });
});
