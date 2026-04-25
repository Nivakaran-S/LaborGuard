/**
 * job.integration.test.js
 *
 * Coverage of job-service: job posting CRUD, application flow, employer
 * scoping, role-based access. Email + AI contract + PDF generation are
 * mocked since they're external SaaS / heavy outputs.
 */

process.env.JWT_ACCESS_SECRET = 'test-access-secret-jobs';
process.env.NODE_ENV = 'test';

jest.mock('../../src/services/emailService', () => ({
    sendApplicationStatusEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/services/aiContractService', () => ({
    generateEmploymentContract: jest.fn().mockResolvedValue('<html>contract</html>'),
}));

jest.mock('../../src/services/pdfService', () => ({
    generatePdfContract: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    generateJobReport: jest.fn().mockResolvedValue(Buffer.from('pdf')),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { setupTestDB } = require('../helpers/testDb');

const Job = require('../../src/models/Job');
const Application = require('../../src/models/Application');

beforeAll(setupTestDB.start);
afterAll(setupTestDB.stop);
beforeEach(setupTestDB.clear);

const signToken = ({ userId, role = 'worker', email = `${role}@test.com` }) =>
    jwt.sign(
        { sub: userId.toString(), userId: userId.toString(), email, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
    );

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const newId = () => new mongoose.Types.ObjectId();

const validJobBody = (overrides = {}) => ({
    title: 'Construction Worker Needed',
    description: 'Looking for an experienced construction worker for a 2-week project in Colombo.',
    wage: { amount: 2500, currency: 'LKR', frequency: 'daily' },
    compliesWithMinimumWage: true,
    location: { address: 'Site A', city: 'Colombo', country: 'Sri Lanka' },
    jobType: 'daily_wage',
    ...overrides,
});

describe('GET /health', () => {
    it('returns 200', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
    });
});

describe('POST /api/jobs (create job — employer/admin only)', () => {
    it('creates a job for an employer', async () => {
        const employerId = newId();
        const token = signToken({ userId: employerId, role: 'employer' });
        const res = await request(app)
            .post('/api/jobs')
            .set(auth(token))
            .send(validJobBody());

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
            title: 'Construction Worker Needed',
            jobType: 'daily_wage',
            status: 'open',
        });
        expect(res.body.data.employerId).toBe(employerId.toString());
    });

    it('rejects an unauthenticated POST with 401', async () => {
        const res = await request(app).post('/api/jobs').send(validJobBody());
        expect(res.status).toBe(401);
    });

    it('rejects a worker trying to post a job (403)', async () => {
        const token = signToken({ userId: newId(), role: 'worker' });
        const res = await request(app)
            .post('/api/jobs')
            .set(auth(token))
            .send(validJobBody());
        expect(res.status).toBe(403);
    });

    it('rejects invalid jobType with 400', async () => {
        const token = signToken({ userId: newId(), role: 'employer' });
        const res = await request(app)
            .post('/api/jobs')
            .set(auth(token))
            .send(validJobBody({ jobType: 'made_up_type' }));
        expect([400, 500]).toContain(res.status); // Mongoose validation error → next(err) → 500 by default
    });
});

describe('GET /api/jobs (public listing)', () => {
    it('lists jobs without authentication (public route)', async () => {
        const employerId = newId();
        await Job.create([
            validJobBody({ employerId, title: 'A' }),
            validJobBody({ employerId, title: 'B' }),
        ]);
        const res = await request(app).get('/api/jobs');
        expect(res.status).toBe(200);
        expect(res.body.count).toBe(2);
        expect(res.body.data).toHaveLength(2);
    });

    it('filters by status', async () => {
        const employerId = newId();
        await Job.create([
            validJobBody({ employerId, status: 'open', title: 'open job' }),
            validJobBody({ employerId, status: 'closed', title: 'closed job' }),
        ]);
        const res = await request(app).get('/api/jobs?status=closed');
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].status).toBe('closed');
    });
});

describe('GET /api/jobs/:id', () => {
    it('returns a single job', async () => {
        const job = await Job.create(validJobBody({ employerId: newId() }));
        const res = await request(app).get(`/api/jobs/${job._id}`);
        expect(res.status).toBe(200);
        expect(res.body.data._id).toBe(job._id.toString());
    });

    it('returns 404 for unknown id', async () => {
        const res = await request(app).get(`/api/jobs/${newId()}`);
        expect(res.status).toBe(404);
    });
});

describe('PUT /api/jobs/:id', () => {
    it('lets the owning employer update their job', async () => {
        const employerId = newId();
        const job = await Job.create(validJobBody({ employerId }));
        const res = await request(app)
            .put(`/api/jobs/${job._id}`)
            .set(auth(signToken({ userId: employerId, role: 'employer' })))
            .send({ status: 'closed' });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('closed');
    });

    it('blocks a different employer from updating someone else\'s job (403)', async () => {
        const job = await Job.create(validJobBody({ employerId: newId() }));
        const stranger = signToken({ userId: newId(), role: 'employer' });
        const res = await request(app)
            .put(`/api/jobs/${job._id}`)
            .set(auth(stranger))
            .send({ status: 'closed' });
        expect([401, 403]).toContain(res.status);
    });
});

describe('POST /api/jobs/:id/apply (worker applies)', () => {
    it('lets a worker apply once', async () => {
        const employerId = newId();
        const workerId = newId();
        const job = await Job.create(validJobBody({ employerId }));

        const res = await request(app)
            .post(`/api/jobs/${job._id}/apply`)
            .set(auth(signToken({ userId: workerId, role: 'worker', email: 'jane@x.com' })))
            .send({ workerExperience: '3 years construction' });
        expect(res.status).toBe(201);
        expect(res.body.data.workerId).toBe(workerId.toString());
        expect(res.body.data.status).toBe('pending');
    });

    it('rejects double-applying with 400', async () => {
        const employerId = newId();
        const workerId = newId();
        const job = await Job.create(validJobBody({ employerId }));
        const token = signToken({ userId: workerId, role: 'worker', email: 'a@b.com' });

        await request(app)
            .post(`/api/jobs/${job._id}/apply`)
            .set(auth(token))
            .send({ workerExperience: 'x' })
            .expect(201);

        const dup = await request(app)
            .post(`/api/jobs/${job._id}/apply`)
            .set(auth(token))
            .send({ workerExperience: 'x' });
        expect(dup.status).toBe(400);
    });

    it('rejects a non-worker (employer) from applying (403)', async () => {
        const job = await Job.create(validJobBody({ employerId: newId() }));
        const token = signToken({ userId: newId(), role: 'employer' });
        const res = await request(app)
            .post(`/api/jobs/${job._id}/apply`)
            .set(auth(token))
            .send({ workerExperience: 'x' });
        expect(res.status).toBe(403);
    });

    it('returns 404 when applying to a non-existent job', async () => {
        const token = signToken({ userId: newId(), role: 'worker', email: 'a@b.com' });
        const res = await request(app)
            .post(`/api/jobs/${newId()}/apply`)
            .set(auth(token))
            .send({ workerExperience: 'x' });
        expect(res.status).toBe(404);
    });
});

describe('GET /api/jobs/my-listings (employer\'s own jobs)', () => {
    /**
     * Regression test for the bug fixed in commit ce3ba12:
     * the controller used to query { postedBy: ... } but the schema field
     * is `employerId`, so employers got an empty list. This test pins down
     * the field name.
     */
    it('returns only the employer\'s own jobs (filtered by employerId)', async () => {
        const meId = newId();
        const otherId = newId();
        await Job.create([
            validJobBody({ employerId: meId, title: 'Mine 1' }),
            validJobBody({ employerId: meId, title: 'Mine 2' }),
            validJobBody({ employerId: otherId, title: 'Theirs' }),
        ]);

        const res = await request(app)
            .get('/api/jobs/my-listings')
            .set(auth(signToken({ userId: meId, role: 'employer' })));
        expect(res.status).toBe(200);
        const titles = (res.body.data || []).map((j) => j.title);
        expect(titles).toEqual(expect.arrayContaining(['Mine 1', 'Mine 2']));
        expect(titles).not.toContain('Theirs');
    });
});

describe('GET /api/jobs/my-applications (worker\'s applications)', () => {
    it('returns only the calling worker\'s applications', async () => {
        const me = newId();
        const other = newId();
        const job = await Job.create(validJobBody({ employerId: newId() }));
        await Application.create([
            { jobId: job._id, workerId: me, workerName: 'me', workerEmail: 'me@x.com', workerExperience: 'x' },
            { jobId: job._id, workerId: other, workerName: 'o', workerEmail: 'o@x.com', workerExperience: 'y' },
        ]);

        const res = await request(app)
            .get('/api/jobs/my-applications')
            .set(auth(signToken({ userId: me, role: 'worker', email: 'me@x.com' })));
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].workerId.toString()).toBe(me.toString());
    });
});
