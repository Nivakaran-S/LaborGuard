const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const VerificationCode = require('../../models/VerificationCode');

// Connect to a test database
beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laborguard-auth-test';
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri);
        try {
            await mongoose.connection.db.dropDatabase();
            console.log('Database dropped successfully');
        } catch (err) {
            console.error('Error dropping database:', err);
        }
    }
});

// Clear database after each test
afterEach(async () => {
    await User.deleteMany({});
    await VerificationCode.deleteMany({});
});

// Close connection after all tests
afterAll(async () => {
    await mongoose.connection.close();
});

describe('Authentication API', () => {
    const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+94771234567',
        password: 'TestPassword123!'
    };

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe(userData.email);
        });

        it('should reject duplicate email', async () => {
            await request(app).post('/api/auth/register').send(userData);

            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...userData, phone: '+94777654321' }); // Different phone

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/Email already exists/);
        });

        it('should reject weak password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ ...userData, password: 'weak' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app).post('/api/auth/register').send(userData);
        });

        it('should login successfully with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
        });

        it('should reject invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: 'WrongPassword'
                });

            expect(res.statusCode).toBe(401);
        });
    });
});
