/**
 * auth.integration.test.js
 *
 * Real Express app + in-process Mongo + real bcrypt + real JWT signing.
 * The only mocks are external SaaS (Resend, Twilio) — those don't add value
 * to test, and we don't want to actually send emails/SMS during CI.
 *
 * What this catches that unit tests can't:
 *   - Mongoose schema validation (e.g., phone format, email uniqueness)
 *   - JWT round-trip (sign in auth-service, verify later)
 *   - Real password hashing/comparison
 *   - Middleware ordering (validators → controller)
 *   - Cross-route flows (register → verify → login)
 */

// Stub env BEFORE requiring app.js. Passport's Google strategy is constructed
// at module-load and throws "OAuth2Strategy requires a clientID" without these.
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5001/api/auth/google/callback';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

jest.mock('../../src/services/emailService', () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendApprovalEmail: jest.fn().mockResolvedValue(true),
    sendRejectionEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/services/smsService', () => ({
    sendVerificationSMS: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/utils/kafkaProducer', () => ({
    emitEvent: jest.fn().mockResolvedValue([]),
    connectProducer: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB } = require('../helpers/testDb');
const VerificationCode = require('../../src/models/VerificationCode');

beforeAll(setupTestDB.start);
afterAll(setupTestDB.stop);
beforeEach(setupTestDB.clear);

describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });
});

describe('POST /api/auth/register', () => {
    const validBody = {
        firstName: 'Test',
        lastName: 'Worker',
        birthDate: '1995-06-15',
        email: 'worker@example.com',
        phone: '0712345678',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        role: 'worker',
    };

    it('registers a worker successfully', async () => {
        const res = await request(app).post('/api/auth/register').send(validBody);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toMatchObject({ email: 'worker@example.com', role: 'worker' });
    });

    it('rejects duplicate email with 400', async () => {
        await request(app).post('/api/auth/register').send(validBody);
        const res = await request(app).post('/api/auth/register').send(validBody);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/email already exists/i);
    });

    it('rejects invalid phone format with 400', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validBody, email: 'other@example.com', phone: 'not-a-number' });
        expect(res.status).toBe(400);
    });

    it('rejects mismatched confirmPassword with 400', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validBody, email: 'other@example.com', confirmPassword: 'different' });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/login', () => {
    const userBody = {
        firstName: 'Login',
        lastName: 'Tester',
        birthDate: '1990-01-01',
        email: 'loginuser@example.com',
        phone: '0719876543',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        role: 'worker',
    };

    beforeEach(async () => {
        // Register + manually mark verified (login requires it)
        await request(app).post('/api/auth/register').send(userBody);
        const User = require('../../src/models/User');
        await User.updateOne(
            { email: userBody.email },
            { isEmailVerified: true, isApproved: true }
        );
    });

    it('returns 200 with access + refresh tokens on valid creds', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: userBody.email, password: userBody.password });
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('returns 401 on wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: userBody.email, password: 'wrong-pass' });
        expect(res.status).toBe(401);
    });

    it('returns 401 on unknown email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nope@example.com', password: 'StrongPass123!' });
        expect(res.status).toBe(401);
    });
});

describe('POST /api/auth/verify (email OTP)', () => {
    it('marks user verified given a valid code', async () => {
        const reg = await request(app).post('/api/auth/register').send({
            firstName: 'V',
            lastName: 'User',
            birthDate: '1995-06-15',
            email: 'verifyme@example.com',
            phone: '0700000000',
            password: 'StrongPass123!',
            confirmPassword: 'StrongPass123!',
            role: 'worker',
        });
        const userId = reg.body.data.userId;

        // Look up the OTP that registerUser created in Mongo
        const codeDoc = await VerificationCode.findOne({ userId, type: 'email' });
        expect(codeDoc).toBeTruthy();

        const res = await request(app)
            .post('/api/auth/verify')
            .send({ userId, code: codeDoc.code, type: 'email' });
        expect(res.status).toBe(200);
    });

    it('rejects wrong code with 4xx', async () => {
        const reg = await request(app).post('/api/auth/register').send({
            firstName: 'V', lastName: 'User',
            birthDate: '1995-06-15',
            email: 'verifyme2@example.com',
            phone: '0700000001',
            password: 'StrongPass123!',
            confirmPassword: 'StrongPass123!',
            role: 'worker',
        });
        const res = await request(app)
            .post('/api/auth/verify')
            .send({ userId: reg.body.data.userId, code: '000000', type: 'email' });
        expect([400, 401, 404]).toContain(res.status);
    });
});
