# LaborGuard — Test Report

**Project:** LaborGuard  
**Date:** 2026-04-26  
**Prepared by:** Nivakaran Shanmugabavan  
**Scope:** Unit tests, integration tests, and performance tests across all 6 backend microservices.

---

## Overview

This report documents the testing strategy, test cases, expected outcomes, actual outcomes, and bugs discovered during the test phase of LaborGuard. Testing was conducted across three levels — unit, integration, and performance — covering all six backend microservices.

| Test Type | Services Covered | Total Cases | Result |
|---|---|---|---|
| Unit | auth-service, complaint-service | 42 | ✅ 42 / 42 Passed |
| Integration | auth, complaint, community, messaging, notification, job | 99 | ✅ 99 / 99 Passed |
| Performance (Artillery) | All 6 services | YAML scripts configured | ⚠️ Not yet executed live |
| **Total** | **6 services** | **141** | **✅ 141 / 141 Passed** |

---

## 1. Unit Tests

Unit tests verify pure functions with no I/O or network calls. No environment configuration is required. Jest completes all unit tests in under 10 seconds.

### 1.1 auth-service — JWT Utilities

**File:** `tests/unit/jwt.unit.test.js`  
**Framework:** Jest  
**Total Cases:** 8

| # | Test Case | What Was Tested | Expected Outcome | Actual Outcome |
|---|---|---|---|---|
| 1 | Returns a non-empty string | `generateAccessToken` output format | Non-empty string token | ✅ Passed |
| 2 | Includes `sub` claim equal to `userId` | JWT payload `sub` field (required by Centrifugo) | `sub === userId` | ✅ Passed |
| 3 | Includes `userId`, `email`, `role` in payload | Downstream service auth middleware fields | All three fields present | ✅ Passed |
| 4 | Signs with `JWT_ACCESS_SECRET` (round-trip) | `generateAccessToken` → `verifyAccessToken` round-trip | Token verifies without error | ✅ Passed |
| 5 | Rejects tokens signed with the wrong secret | Tampered/foreign-key tokens | Verification throws error | ✅ Passed |
| 6 | Uses default 15-minute expiry when env is unset | Expiry fallback when `JWT_ACCESS_EXPIRY` is not set | Token expires in ~15 min | ✅ Passed |
| 7 | `generateRefreshToken` signs with `JWT_REFRESH_SECRET` | Refresh token uses a separate secret | Verifies with refresh secret | ✅ Passed |
| 8 | Refresh tokens are NOT accepted by access verifier | Secret separation between token types | Access verifier rejects refresh token | ✅ Passed |

**Result:** 8 / 8 Passed — Time: < 2 s

---

### 1.2 complaint-service — Appointment Eligibility Logic

**File:** `tests/unit/appointmentEligibility.unit.test.js`  
**Framework:** Jest  
**Total Cases:** 34

This suite exhaustively tests the `isEligibleForAppointment` function, which gates automatic appointment creation based on complaint category and priority.

**Eligibility Rules Under Test:**
- Only complaints with category in `{wage_theft, wrongful_termination, harassment, discrimination}` **AND** priority `high` or `critical` qualify for auto-appointment.
- All other combinations must be rejected.

| Group | Cases | What Was Tested | Expected Outcome | Actual Outcome |
|---|---|---|---|---|
| Full eligibility matrix | 8 | All 4 eligible categories × 2 eligible priorities (`high`, `critical`) | Returns `true` for all 8 combos | ✅ All 8 Passed |
| Ineligible category × any priority | 12 | Categories outside the eligible set (e.g. `unsafe_conditions`) with any priority | Returns `false` | ✅ All 12 Passed |
| Eligible category × low/medium priority | 8 | Valid categories with `low` or `medium` priority | Returns `false` | ✅ All 8 Passed |
| Garbage / missing inputs | 6 | `null`, `undefined`, empty string, unknown strings | Returns `false` or throws gracefully | ✅ All 6 Passed |

**Result:** 34 / 34 Passed — Time: 6.471 s

---

## 2. Integration Tests

Integration tests run a real Express application with an in-process MongoDB instance (`mongodb-memory-server`). External SaaS services (Cloudinary, Resend, Centrifugo, Twilio) are mocked so no real network calls are made. Tests are fully self-contained — no `.env` file is needed.

---

### 2.1 auth-service

**File:** `tests/integration/auth.integration.test.js`  
**Total Cases:** 10

| # | Endpoint / Area | What Was Tested | Expected Outcome | Actual Outcome |
|---|---|---|---|---|
| 1 | `GET /health` | Service health check | HTTP 200, `{ status: "ok" }` | ✅ Passed |
| 2 | `POST /api/auth/register` — success | Worker registration with valid data | HTTP 201, user created | ✅ Passed |
| 3 | `POST /api/auth/register` — duplicate email | Re-registration with existing email | HTTP 400 error | ✅ Passed |
| 4 | `POST /api/auth/register` — invalid phone | Phone number fails format validation | HTTP 400 error | ✅ Passed |
| 5 | `POST /api/auth/register` — password mismatch | `password !== confirmPassword` | HTTP 400 error | ✅ Passed |
| 6 | `POST /api/auth/login` — valid credentials | Login with correct email + password | HTTP 200, access + refresh tokens returned | ✅ Passed |
| 7 | `POST /api/auth/login` — wrong password | Login with incorrect password | HTTP 401 Unauthorized | ✅ Passed |
| 8 | `POST /api/auth/login` — unknown email | Login with email not in DB | HTTP 401 Unauthorized | ✅ Passed |
| 9 | `POST /api/auth/verify` — valid OTP | Email verification with correct OTP code | User marked as verified | ✅ Passed |
| 10 | `POST /api/auth/verify` — wrong OTP | Email verification with incorrect code | HTTP 4xx error | ✅ Passed |

**Result:** 10 / 10 Passed — Time: 12.931 s

---

### 2.2 complaint-service

**File:** `tests/integration/complaint.integration.test.js`  
**Total Cases:** 22

This suite tests the full complaint lifecycle: admin registers lawyer → worker files complaint → admin transitions status → auto-appointment is created → lawyer records outcome → worker shares to community.

| Group | Cases | What Was Tested | Expected Outcome | Actual Outcome |
|---|---|---|---|---|
| Health check | 1 | `GET /health` | HTTP 200 | ✅ Passed |
| Auth gating | 2 | Protected routes reject unauthenticated requests | HTTP 401 | ✅ Passed |
| File complaint (`POST /api/complaints`) | 4 | Worker creates complaint with valid/invalid data | HTTP 201 on success, 4xx on bad input | ✅ Passed |
| Register lawyer (`POST /api/registry`) | 4 | Admin registers a legal officer | HTTP 201 on success, role-gated | ✅ Passed |
| Auto-appointment: does not create on `pending` | 1 | Status is still `pending` — no appointment expected | `Appointment` collection stays empty | ✅ Passed |
| Auto-appointment: creates on `under_review` (eligible) | 1 | Admin transitions eligible complaint to `under_review` | Appointment auto-created and linked | ✅ Passed |
| Auto-appointment: low priority blocked | 1 | Complaint has eligible category but low priority | No appointment created | ✅ Passed |
| Auto-appointment: ineligible category blocked | 1 | Category `unsafe_conditions` — not in eligible set | No appointment created | ✅ Passed |
| Lawyer records outcome | 1 | Lawyer marks appointment complete, officer load decremented | HTTP 200, officer `currentLoad` reduced by 1 | ✅ Passed |
| Lawyer cannot record others' outcome | 1 | Lawyer attempts to close another lawyer's appointment | HTTP 403 Forbidden | ✅ Passed |
| No matching officer (503) | 1 | No active officer matches the specialization required | HTTP 503 Service Unavailable | ✅ Passed |
| Share to community | 4 | Worker shares resolved complaint as community post | Post created and linked to complaint | ✅ Passed |

**Result:** 22 / 22 Passed — Time: 11.171 s

---

### 2.3 community-service

**File:** `tests/integration/community.integration.test.js`  
**Total Cases:** 18

| Group | Cases | What Was Tested | Expected Outcome | Actual Outcome |
|---|---|---|---|---|
| Health check | 1 | `GET /health` | HTTP 200 | ✅ Passed |
| Auth gating on `/api/posts` | 2 | Unauthenticated requests rejected | HTTP 401 | ✅ Passed |
| Create post (`POST /api/posts`) | 2 | Valid and invalid post creation | HTTP 201 on success, 4xx on bad input | ✅ Passed |
| Get post (`GET /api/posts/:postId`) | 2 | Fetch existing and non-existent post | HTTP 200 / 404 | ✅ Passed |
| Like post (`POST /api/posts/:postId/like`) | 2 | Toggle like on a post | Like count increments / decrements | ✅ Passed |
| Poll voting (`POST /api/posts/:postId/poll`) | 3 | Vote on valid option, duplicate vote, invalid option | 200 on first vote, 400 on duplicate, 404 on bad option | ✅ Passed |
| Delete post (`DELETE /api/posts/:postId`) | 3 | Owner deletes, non-owner attempts, missing post | 200 / 403 / 404 | ✅ Passed |
| Internal events guard | 3 | Cross-service internal events require secret header | 403 without header, 200 with correct header | ✅ Passed |

**Result:** 18 / 18 Passed — Time: 9.863 s

---

### 2.4 messaging-service

**File:** `tests/integration/messaging.integration.test.js`  
**Total Cases:** 13

| Group | Cases | What Was Tested | Expected Outcome | Actual Outcome |
|---|---|---|---|---|
| Health check | 1 | `GET /health` | HTTP 200 | ✅ Passed |
| Auth gating | 1 | Unauthenticated messaging routes rejected | HTTP 401 | ✅ Passed |
| Create conversation (`POST /api/conversations`) | 3 | Valid creation, duplicate prevention, missing participant | 201 / 200 (existing returned) / 400 | ✅ Passed |
| List conversations (`GET /api/conversations`) | 1 | Fetch all conversations for the caller | HTTP 200, array returned | ✅ Passed |
| Send message + participant guard (`POST /api/messages`) | 4 | Valid send, non-participant blocked, empty body, oversized | 201 / 403 / 400 / 400 | ✅ Passed |
| Get messages (`GET /api/messages/:conversationId`) | 2 | Fetch messages, pagination works | HTTP 200, correct messages returned | ✅ Passed |
| Internal events guard | 1 | Internal route rejects missing secret header | HTTP 403 | ✅ Passed |

**Result:** 13 / 13 Passed — Time: 6.91 s

---

### 2.5 notification-service

**File:** `tests/integration/notification.integration.test.js`  
**Total Cases:** 15

| Group | Cases | What Was Tested | Expected Outcome | Actual Outcome |
|---|---|---|---|---|
| Health check | 1 | `GET /health` | HTTP 200 | ✅ Passed |
| Create notification (`POST /api/notifications`) | 3 | Internal write (no auth required): valid, missing fields, wrong content-type | 201 / 400 / 400 | ✅ Passed |
| List notifications (`GET /api/notifications`) | 3 | Auth-scoped listing: own notifications, another user's (blocked), no token | 200 / 403 / 401 | ✅ Passed |
| Unread count (`GET /api/notifications/unread-count`) | 1 | Returns correct unread count for authenticated user | HTTP 200, integer count | ✅ Passed |
| Mark read (`PATCH /api/notifications/:id/read`) | 2 | Mark own notification read, attempt on another's | 200 / 403 | ✅ Passed |
| Mark all read (`PATCH /api/notifications/read-all`) | 2 | Marks all caller's notifications read, verifies unread-count drops to 0 | 200, count = 0 | ✅ Passed |
| Delete notification (`DELETE /api/notifications/:id`) | 1 | Owner deletes notification | HTTP 200, removed from DB | ✅ Passed |
| Internal events guard | 2 | Internal event routes enforce secret header | 403 without / 200 with | ✅ Passed |

**Result:** 15 / 15 Passed — Time: 13.537 s

---

### 2.6 job-service

**Files:** `tests/integration/job.integration.test.js` + `tests/health.test.js`  
**Total Cases:** 21

| Group | Cases | What Was Tested | Expected Outcome | Actual Outcome |
|---|---|---|---|---|
| Health check | 1 | `GET /health` | HTTP 200 | ✅ Passed |
| Create job (`POST /api/jobs`) | 4 | Employer/admin can create; worker cannot; missing fields rejected | 201 / 403 / 400 | ✅ Passed |
| List jobs (`GET /api/jobs`) | 2 | Public listing with and without filters | HTTP 200, array of jobs | ✅ Passed |
| Get job by ID (`GET /api/jobs/:id`) | 2 | Existing and non-existent job | 200 / 404 | ✅ Passed |
| Update job (`PUT /api/jobs/:id`) | 2 | Owner updates; non-owner blocked | 200 / 403 | ✅ Passed |
| Apply to job (`POST /api/jobs/:id/apply`) | 4 | Worker applies; duplicate application blocked; employer cannot apply; closed job blocked | 201 / 400 / 403 / 400 | ✅ Passed |
| Employer's listings (`GET /api/jobs/my-listings`) | 1 | Returns only jobs posted by the caller | HTTP 200, scoped results | ✅ Passed |
| Worker's applications (`GET /api/jobs/my-applications`) | 1 | Returns only applications submitted by the caller | HTTP 200, scoped results | ✅ Passed |
| Smoke tests | 4 | Health, root route, 404 handling, auth gate on protected route | Expected status codes | ✅ Passed |

**Result:** 21 / 21 Passed — Time: 10.036 s

---

## 3. Performance Tests (Artillery)

Performance tests require a **live running service** connected to MongoDB Atlas. Each service has a `tests/performance/load-test.yml` Artillery script with three ramp phases.

> ⚠️ **Status: Configured but not yet executed live.** The figures below describe the test design and acceptance criteria. To run them, use the orchestration script described in Section 3.3.

### 3.1 Load Profile

| Phase | Duration | Arrival Rate | Purpose |
|---|---|---|---|
| Warm-up | 30 s | 5 req/s | Prime connection pool, JIT warm-up |
| Load test | 60 s | 15–25 req/s | Sustained realistic load |
| Stress test | 30 s | 30–50 req/s | Find p95/p99 breakpoint |

### 3.2 Per-Service Configuration

| Service | Warm-up | Load | Stress | Est. Total Requests |
|---|---|---|---|---|
| auth-service | 5 req/s | 20 req/s | 50 req/s | ~2,850 |
| complaint-service | 5 req/s | 15 req/s | 30 req/s | ~2,000 |
| community-service | 5 req/s | 20 req/s | 40 req/s | ~2,500 |
| messaging-service | 5 req/s | 20 req/s | 40 req/s | ~2,500 |
| notification-service | 5 req/s | 25 req/s | 50 req/s | ~3,150 |
| job-service | 5 req/s | 20 req/s | 40 req/s | ~2,500 |

Each script uses weighted scenarios to simulate realistic traffic (e.g. auth-service: 50% login, 20% register, 20% profile fetch, 10% token refresh).

### 3.3 Acceptance Criteria

These thresholds apply to real runs:

| Metric | Target |
|---|---|
| p95 response time | < 500 ms under sustained load |
| Error rate | < 1% (excluding intentional 4xx such as duplicate-email rejections) |

### 3.4 How to Run

**Single service (two terminals):**
```bash
# Terminal 1 — start the service
cd backend/services/auth-service
npm start

# Terminal 2 — run Artillery
cd backend/services/auth-service
npm run loadtest
```

**All 6 services, automated (recommended):**
```bash
./loadtest-all.sh          # Bash / Git Bash / Linux / macOS
.\loadtest-all.ps1         # PowerShell (Windows)
```

Reports are saved to `perf-reports/<service>.log` and `perf-reports/<service>.summary.txt`.

---

## 4. Bugs Found and Fixed

Three real production bugs were discovered and fixed during this test phase.

### Bug 1 — messaging-service: Cross-service internal events always returned 401

**Symptom:** Sibling services (e.g. complaint-service) emitting `complaint_assigned` events to messaging-service received HTTP 401 in production. The messaging-service test caught this via the `Internal events guard` test expecting HTTP 403 but receiving 401 instead.

**Root Cause:** In `app.js`, `messageRoutes` was mounted at `/api` before `internalRoutes`. Because `messageRoutes` calls `router.use(protect)` at the top, every request to `/api/*` — including internal event routes — was JWT-checked and rejected before reaching the internal handler.

**Fix:** Mount `internalRoutes` before `messageRoutes` so unauthenticated internal-event paths are matched first.

---

### Bug 2 — notification-service: Missing `axios` dependency

**Symptom:** The entire notification-service test suite failed to load with `Cannot find module 'axios'`.

**Root Cause:** The new `centrifugoClient.js` module (real-time notification push) imports axios, but axios was only listed in messaging-service's `package.json`, not notification-service's.

**Fix:** Added `axios` to `dependencies` in `notification-service/package.json`.

---

### Bug 3 — complaint-service: Flaky timing on auto-appointment tests

**Symptom:** Three tests intermittently crashed with `TypeError: Cannot read property '_id' of null` because `Appointment.findOne()` returned `null`.

**Root Cause:** `autoCreateAppointment` is fire-and-forget (not awaited by the controller). A single `setImmediate` tick was insufficient to wait for the chain of multiple `await` DB writes inside it.

**Fix:** Replaced `setImmediate` with a `waitForAppointments(expectedCount, timeoutMs = 3000)` poll helper that checks `Appointment.countDocuments({})` every 50 ms, up to a 3-second timeout.

---

## 5. Test File Reference

```
backend/services/
├── auth-service/
│   ├── tests/unit/jwt.unit.test.js                               (8 cases)
│   ├── tests/integration/auth.integration.test.js                (10 cases)
│   └── tests/performance/load-test.yml
├── complaint-service/
│   ├── tests/unit/appointmentEligibility.unit.test.js            (34 cases)
│   ├── tests/integration/complaint.integration.test.js           (22 cases)
│   └── tests/performance/load-test.yml
├── community-service/
│   ├── tests/integration/community.integration.test.js           (18 cases)
│   └── tests/performance/load-test.yml
├── messaging-service/
│   ├── tests/integration/messaging.integration.test.js           (13 cases)
│   └── tests/performance/load-test.yml
├── notification-service/
│   ├── tests/integration/notification.integration.test.js        (15 cases)
│   └── tests/performance/load-test.yml
└── job-service/
    ├── tests/integration/job.integration.test.js                 (14 cases)
    ├── tests/health.test.js                                      (4 smoke)
    └── tests/performance/load-test.yml

tests/helpers/testDb.js   — mongodb-memory-server lifecycle (shared by all integration suites)
```

---

*End of Test Report — LaborGuard, April 2026*
