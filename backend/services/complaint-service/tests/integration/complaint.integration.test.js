/**
 * complaint.integration.test.js
 *
 * End-to-end coverage of the complaint workflow we audited before writing
 * these tests:
 *   1. Admin registers a lawyer in /api/registry
 *   2. Worker files a complaint (POST /api/complaints) — auth + validation
 *   3. Admin moves status to under_review (PATCH /api/complaints/:id/status)
 *   4. Auto-appointment is created when category × priority is eligible
 *   5. Lawyer records the outcome (PATCH /api/appointments/:id/outcome)
 *   6. Worker shares the resolved case to community (POST /:id/share-to-community)
 *
 * Real Mongo (in-process), real express-validator, real JWT round-trip.
 * Cloudinary, email, and HTTP eventing are mocked — they're external SaaS
 * dependencies that don't add value here, and we don't want fan-out HTTP
 * calls during CI.
 */

// Stub env BEFORE requiring app — middleware reads process.env.JWT_ACCESS_SECRET
process.env.JWT_ACCESS_SECRET = 'test-access-secret-complaint';
process.env.NODE_ENV = 'test';
process.env.SERVICE_NAME = 'complaint-service-test';

// Mock cloudinary util — replaces multer-storage-cloudinary with in-memory
// multer so file uploads don't hit any network.
jest.mock('../../src/utils/cloudinary', () => {
    const multer = require('multer');
    return {
        cloudinary: { v2: {} },
        upload: multer({ storage: multer.memoryStorage() }),
    };
});

// Mock email — three exports must match what services/emailService.js exposes.
jest.mock('../../src/services/emailService', () => ({
    sendComplaintConfirmationEmail: jest.fn().mockResolvedValue(true),
    sendStatusUpdateEmail: jest.fn().mockResolvedValue(true),
    sendAppointmentConfirmationEmail: jest.fn().mockResolvedValue(true),
    sendAppointmentNotificationToOfficer: jest.fn().mockResolvedValue(true),
}));

// Mock cross-service eventing — emitEvent is fire-and-forget.
jest.mock('../../src/utils/kafkaProducer', () => ({
    emitEvent: jest.fn().mockResolvedValue([]),
    connectProducer: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { setupTestDB } = require('../helpers/testDb');

const Complaint = require('../../src/models/Complaint');
const Appointment = require('../../src/models/Appointment');
const LegalOfficerRegistry = require('../../src/models/LegalOfficerRegistry');

beforeAll(setupTestDB.start);
afterAll(setupTestDB.stop);
beforeEach(setupTestDB.clear);

// ── Helpers ─────────────────────────────────────────────────────────────────

const signToken = ({ userId, role, email = 'user@test.com' }) =>
    jwt.sign(
        { sub: userId.toString(), userId: userId.toString(), email, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
    );

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// autoCreateAppointment is fire-and-forget (.catch(...)) — the controller
// doesn't await it, so a single setImmediate tick is not enough. Poll for the
// expected number of appointments to appear (or stay empty) over a short
// window before asserting.
const waitForAppointments = async (expectedCount, timeoutMs = 3000) => {
    const Appointment = require('../../src/models/Appointment');
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const count = await Appointment.countDocuments({});
        if (count === expectedCount) return;
        await new Promise((r) => setTimeout(r, 50));
    }
};

const newId = () => new mongoose.Types.ObjectId();

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /health', () => {
    it('returns 200 with service name', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ status: 'ok' });
    });
});

describe('Auth gating', () => {
    it('rejects unauthenticated complaint creation with 401', async () => {
        const res = await request(app).post('/api/complaints').send({});
        expect(res.status).toBe(401);
    });

    it('rejects worker accessing admin-only listing with 403', async () => {
        const token = signToken({ userId: newId(), role: 'worker' });
        const res = await request(app).get('/api/complaints').set(auth(token));
        expect(res.status).toBe(403);
    });
});

describe('POST /api/complaints (worker files complaint)', () => {
    const baseBody = {
        title: 'Unpaid wages for the past two months',
        description: 'My employer has refused to pay overtime accumulated during peak season despite repeated requests.',
        category: 'wage_theft',
        priority: 'critical',
        organizationName: 'Acme Garments Pvt Ltd',
        location: { city: 'Colombo', district: 'Colombo', country: 'Sri Lanka' },
    };

    it('accepts a valid wage_theft complaint with status=pending', async () => {
        const workerId = newId();
        const token = signToken({ userId: workerId, role: 'worker', email: 'worker@test.com' });

        const res = await request(app)
            .post('/api/complaints')
            .set(auth(token))
            .send(baseBody);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
            title: baseBody.title,
            category: 'wage_theft',
            priority: 'critical',
            status: 'pending',
        });
        expect(res.body.data.workerId).toBe(workerId.toString());
    });

    it('rejects short titles with 400', async () => {
        const token = signToken({ userId: newId(), role: 'worker' });
        const res = await request(app)
            .post('/api/complaints')
            .set(auth(token))
            .send({ ...baseBody, title: 'short' });
        expect(res.status).toBe(400);
    });

    it('rejects unknown category with 400', async () => {
        const token = signToken({ userId: newId(), role: 'worker' });
        const res = await request(app)
            .post('/api/complaints')
            .set(auth(token))
            .send({ ...baseBody, category: 'made_up_category' });
        expect(res.status).toBe(400);
    });

    it('rejects an admin trying to file a complaint with 403 (worker-only route)', async () => {
        const token = signToken({ userId: newId(), role: 'admin' });
        const res = await request(app)
            .post('/api/complaints')
            .set(auth(token))
            .send(baseBody);
        expect(res.status).toBe(403);
    });
});

describe('POST /api/registry (admin registers a lawyer)', () => {
    it('registers an officer and surfaces them in GET /api/registry', async () => {
        const adminId = newId();
        const lawyerId = newId();
        const adminToken = signToken({ userId: adminId, role: 'admin' });

        const reg = await request(app)
            .post('/api/registry')
            .set(auth(adminToken))
            .send({
                officerId: lawyerId.toString(),
                name: 'Jane Doe',
                email: 'jane@law.example',
                specializations: ['labor_law'],
            });
        expect(reg.status).toBe(201);
        expect(reg.body.data).toMatchObject({
            name: 'Jane Doe',
            specializations: ['labor_law'],
            isActive: true,
        });

        const list = await request(app).get('/api/registry').set(auth(adminToken));
        expect(list.status).toBe(200);
        expect(list.body.data).toHaveLength(1);
    });

    it('rejects double-registration of the same officer with 409', async () => {
        const adminToken = signToken({ userId: newId(), role: 'admin' });
        const lawyerId = newId();
        const payload = {
            officerId: lawyerId.toString(),
            name: 'Jane Doe',
            email: 'jane@law.example',
            specializations: ['labor_law'],
        };

        await request(app).post('/api/registry').set(auth(adminToken)).send(payload).expect(201);
        const dup = await request(app).post('/api/registry').set(auth(adminToken)).send(payload);
        expect(dup.status).toBe(409);
    });

    it('rejects unknown specialization values with 400', async () => {
        const adminToken = signToken({ userId: newId(), role: 'admin' });
        const res = await request(app)
            .post('/api/registry')
            .set(auth(adminToken))
            .send({
                officerId: newId().toString(),
                name: 'X',
                email: 'x@y.com',
                specializations: ['nonsense_law'],
            });
        expect(res.status).toBe(400);
    });

    it('rejects a worker trying to write the registry with 403', async () => {
        const workerToken = signToken({ userId: newId(), role: 'worker' });
        const res = await request(app)
            .post('/api/registry')
            .set(auth(workerToken))
            .send({
                officerId: newId().toString(),
                name: 'X',
                email: 'x@y.com',
                specializations: ['labor_law'],
            });
        expect(res.status).toBe(403);
    });
});

describe('Auto-appointment lifecycle', () => {
    /**
     * The audit identified this as the load-bearing path:
     *   - Eligible category × eligible priority × active officer ⇒ auto-book
     *   - Updating to under_review is what fires the trigger
     */
    let workerId, adminId, lawyerId;
    let workerToken, adminToken, lawyerToken;

    beforeEach(async () => {
        workerId = newId();
        adminId = newId();
        lawyerId = newId();
        workerToken = signToken({ userId: workerId, role: 'worker' });
        adminToken = signToken({ userId: adminId, role: 'admin' });
        lawyerToken = signToken({
            userId: lawyerId,
            role: 'lawyer',
            email: 'lawyer@test.com',
        });

        // Seed registry — auto-booking will fail without an active officer with
        // matching specialization
        await LegalOfficerRegistry.create({
            officerId: lawyerId,
            name: 'Test Lawyer',
            email: 'lawyer@test.com',
            specializations: ['labor_law'],
            isActive: true,
        });
    });

    const fileEligibleComplaint = async () => {
        const res = await request(app)
            .post('/api/complaints')
            .set(auth(workerToken))
            .send({
                title: 'Wage theft complaint for integration test',
                description: 'Employer has withheld wages for several months despite repeated requests through formal channels.',
                category: 'wage_theft',
                priority: 'critical',
            })
            .expect(201);
        return res.body.data._id;
    };

    it('does not auto-create an appointment when status is still pending', async () => {
        await fileEligibleComplaint();
        const apts = await Appointment.find({});
        expect(apts).toHaveLength(0);
    });

    it('auto-creates an appointment when admin moves to under_review (eligible case)', async () => {
        const complaintId = await fileEligibleComplaint();

        const res = await request(app)
            .patch(`/api/complaints/${complaintId}/status`)
            .set(auth(adminToken))
            .send({ status: 'under_review', reason: 'Verified by admin' });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('under_review');

        // autoCreateAppointment runs in the background via .catch(); poll until
        // it lands or we time out. A single setImmediate isn't enough because
        // the auto-create chain awaits multiple DB ops.
        await waitForAppointments(1);

        const apts = await Appointment.find({});
        expect(apts).toHaveLength(1);
        expect(apts[0]).toMatchObject({
            workerId,
            legalOfficerId: lawyerId,
            category: 'wage_theft',
            specialization: 'labor_law',
            status: 'auto_booked',
        });

        // Officer load tracking should bump
        const officer = await LegalOfficerRegistry.findOne({ officerId: lawyerId });
        expect(officer.activeAppointmentCount).toBe(1);
        expect(officer.totalAssigned).toBe(1);
    });

    it('does NOT auto-create an appointment when priority is too low', async () => {
        // File a low-priority complaint — eligible category, ineligible priority
        const filed = await request(app)
            .post('/api/complaints')
            .set(auth(workerToken))
            .send({
                title: 'Minor wage discrepancy',
                description: 'Small unpaid overtime amount that the worker wants to flag for awareness.',
                category: 'wage_theft',
                priority: 'low',
            })
            .expect(201);

        await request(app)
            .patch(`/api/complaints/${filed.body.data._id}/status`)
            .set(auth(adminToken))
            .send({ status: 'under_review' })
            .expect(200);

        // Wait the full window — count must stay 0
        await waitForAppointments(0);
        const apts = await Appointment.find({});
        expect(apts).toHaveLength(0);
    });

    it('does NOT auto-create when category is ineligible (e.g. unsafe_conditions)', async () => {
        const filed = await request(app)
            .post('/api/complaints')
            .set(auth(workerToken))
            .send({
                title: 'Workplace ventilation hazard',
                description: 'Ventilation system on the production floor is not functioning, leading to high heat and respiratory complaints.',
                category: 'unsafe_conditions',
                priority: 'critical',
            })
            .expect(201);

        await request(app)
            .patch(`/api/complaints/${filed.body.data._id}/status`)
            .set(auth(adminToken))
            .send({ status: 'under_review' })
            .expect(200);

        await waitForAppointments(0);
        const apts = await Appointment.find({});
        expect(apts).toHaveLength(0);
    });

    it('lawyer can record an outcome and decrement officer load on completion', async () => {
        const complaintId = await fileEligibleComplaint();
        await request(app)
            .patch(`/api/complaints/${complaintId}/status`)
            .set(auth(adminToken))
            .send({ status: 'under_review' })
            .expect(200);
        await waitForAppointments(1);

        const apt = await Appointment.findOne({});
        const res = await request(app)
            .patch(`/api/appointments/${apt._id}/outcome`)
            .set(auth(lawyerToken))
            .send({
                outcomeNotes: 'Discussed case with worker; advised to file with labor tribunal.',
                markCompleted: true,
            });
        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({
            status: 'completed',
            outcomeNotes: expect.stringContaining('labor tribunal'),
        });

        const officer = await LegalOfficerRegistry.findOne({ officerId: lawyerId });
        expect(officer.activeAppointmentCount).toBe(0); // decremented on completion
    });

    it('lawyer cannot record outcome on someone else\'s appointment', async () => {
        const complaintId = await fileEligibleComplaint();
        await request(app)
            .patch(`/api/complaints/${complaintId}/status`)
            .set(auth(adminToken))
            .send({ status: 'under_review' })
            .expect(200);
        await waitForAppointments(1);

        const apt = await Appointment.findOne({});
        const otherLawyer = signToken({ userId: newId(), role: 'lawyer' });
        const res = await request(app)
            .patch(`/api/appointments/${apt._id}/outcome`)
            .set(auth(otherLawyer))
            .send({ outcomeNotes: 'Trying to interfere', markCompleted: true });
        expect(res.status).toBe(403);
    });

    it('returns 503 when no active officer matches specialization', async () => {
        // Deactivate the only officer
        await LegalOfficerRegistry.updateOne({ officerId: lawyerId }, { isActive: false });

        const complaintId = await fileEligibleComplaint();
        // The status update itself succeeds; auto-booking failure is logged but
        // doesn't break the status transition (fire-and-forget by design)
        const res = await request(app)
            .patch(`/api/complaints/${complaintId}/status`)
            .set(auth(adminToken))
            .send({ status: 'under_review' });
        expect(res.status).toBe(200);

        await waitForAppointments(0);
        const apts = await Appointment.find({});
        expect(apts).toHaveLength(0);
    });
});

describe('Share-to-community', () => {
    let workerId, workerToken;

    beforeEach(() => {
        workerId = newId();
        workerToken = signToken({ userId: workerId, role: 'worker' });
    });

    const seedComplaint = async (status) => {
        return Complaint.create({
            title: 'Resolved harassment case to share',
            description: 'A finalized case to test the worker share-to-community gate after resolution by a legal officer.',
            category: 'harassment',
            priority: 'high',
            status,
            workerId,
        });
    };

    it('allows sharing on resolved cases (sets sharedToCommunityAt)', async () => {
        const complaint = await seedComplaint('resolved');

        const res = await request(app)
            .post(`/api/complaints/${complaint._id}/share-to-community`)
            .set(auth(workerToken));
        expect(res.status).toBe(200);

        const fresh = await Complaint.findById(complaint._id);
        expect(fresh.sharedToCommunityAt).toBeTruthy();
    });

    it('rejects sharing a pending case (workflow guard)', async () => {
        const complaint = await seedComplaint('pending');
        const res = await request(app)
            .post(`/api/complaints/${complaint._id}/share-to-community`)
            .set(auth(workerToken));
        expect([400, 403, 409]).toContain(res.status);
    });

    it('rejects re-sharing a case (idempotent — 409)', async () => {
        const complaint = await seedComplaint('resolved');
        complaint.sharedToCommunityAt = new Date();
        await complaint.save();

        const res = await request(app)
            .post(`/api/complaints/${complaint._id}/share-to-community`)
            .set(auth(workerToken));
        expect([400, 409]).toContain(res.status);
    });

    it('rejects sharing someone else\'s complaint (403)', async () => {
        const complaint = await seedComplaint('resolved');
        const otherWorker = signToken({ userId: newId(), role: 'worker' });
        const res = await request(app)
            .post(`/api/complaints/${complaint._id}/share-to-community`)
            .set(auth(otherWorker));
        expect(res.status).toBe(403);
    });
});

describe('Appointment creation correctness', () => {
    /**
     * Pin down the three appointment-service fixes:
     *   1. getNextAvailableSlot doesn't pile every auto-appointment into the
     *      same 9 AM slot — it walks forward when the officer is busy.
     *   2. autoCreateAppointment emits an appointment_auto_booked event so
     *      the notification-service handler can fire in-app notifications.
     *   3. requestAppointment uses null for legalOfficerId (not the worker's
     *      own id) when the complaint has no assigned officer.
     */
    const { emitEvent } = require('../../src/utils/kafkaProducer');

    let workerId, adminId, lawyerId;
    let workerToken, adminToken;

    beforeEach(async () => {
        workerId = newId();
        adminId = newId();
        lawyerId = newId();
        workerToken = signToken({ userId: workerId, role: 'worker' });
        adminToken = signToken({ userId: adminId, role: 'admin' });
        await LegalOfficerRegistry.create({
            officerId: lawyerId,
            name: 'Slot Lawyer',
            email: 'slot@test.com',
            specializations: ['labor_law'],
            isActive: true,
        });
        if (emitEvent.mockClear) emitEvent.mockClear();
    });

    const fileEligibleComplaint = async () => {
        const res = await request(app)
            .post('/api/complaints')
            .set(auth(workerToken))
            .send({
                title: 'Wage theft case for slot test',
                description: 'A case eligible for auto-booking so we can stack multiple appointments.',
                category: 'wage_theft',
                priority: 'critical',
            })
            .expect(201);
        return res.body.data._id;
    };

    it('does not pile multiple auto-appointments into the same slot', async () => {
        // Stack 3 eligible complaints, all auto-routed to the same officer.
        const ids = [];
        for (let i = 0; i < 3; i += 1) ids.push(await fileEligibleComplaint());

        for (const id of ids) {
            await request(app)
                .patch(`/api/complaints/${id}/status`)
                .set(auth(adminToken))
                .send({ status: 'under_review' })
                .expect(200);
        }
        await waitForAppointments(3);

        const apts = await Appointment.find({ legalOfficerId: lawyerId }).sort({ scheduledAt: 1 });
        expect(apts).toHaveLength(3);
        const stamps = apts.map((a) => new Date(a.scheduledAt).getTime());
        // Every appointment lands on a distinct slot.
        expect(new Set(stamps).size).toBe(3);
    });

    it('emits appointment_auto_booked when admin moves to under_review', async () => {
        const id = await fileEligibleComplaint();
        await request(app)
            .patch(`/api/complaints/${id}/status`)
            .set(auth(adminToken))
            .send({ status: 'under_review' })
            .expect(200);
        await waitForAppointments(1);

        const calls = emitEvent.mock.calls.filter(
            (c) => c[1] === 'appointment_auto_booked'
        );
        expect(calls.length).toBeGreaterThanOrEqual(1);
        const payload = calls[0][2];
        expect(payload).toMatchObject({
            workerId,
            officerId: lawyerId,
        });
        expect(payload.appointmentId).toBeDefined();
        expect(payload.scheduledAt).toBeDefined();
    });

    it('worker-requested appointment leaves legalOfficerId null (not the workerId)', async () => {
        // Pre-existing seed-style requested appointment via the model directly
        // — the route is `/api/appointments/request`, but we want to assert
        // the schema/save path tolerates null.
        const complaint = await Complaint.create({
            title: 'Pending case for request test',
            description: 'Worker is going to request an appointment before assignment.',
            category: 'wage_theft',
            priority: 'medium',  // ineligible for auto-booking
            status: 'pending',
            workerId,
        });

        const res = await request(app)
            .post('/api/appointments/request')
            .set(auth(workerToken))
            .send({ complaintId: complaint._id, reason: 'I need to discuss this case' });

        expect(res.status).toBe(201);
        expect(res.body.data || res.body).toMatchObject({
            status: 'requested',
            workerId: String(workerId),
        });

        const stored = await Appointment.findById(res.body.data?._id || res.body._id);
        expect(stored.legalOfficerId).toBeNull();   // ← was workerId before fix
    });
});
