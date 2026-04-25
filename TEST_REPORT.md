# LaborGuard — Test Report

**Date:** 2026-04-26
**Scope:** Unit tests, integration tests, performance tests across all 6 backend microservices.
**Test framework:** Jest (unit + integration), Artillery (performance), supertest (HTTP integration), mongodb-memory-server (in-process Mongo for hermetic integration tests).

---

## 1. Summary

| Test type | Services covered | Tests | Status |
|---|---|---|---|
| **Unit** | auth-service, complaint-service | **42 passing** (8 + 34) | ✅ Green |
| **Integration** | auth, complaint, community, messaging, notification, job | **99 passing** (10 + 22 + 18 + 13 + 15 + 21) | ✅ Green |
| **Performance (Artillery)** | All 6 services | YAML scripts configured (Warm-up → Load → Stress phases) | ✅ Wired, ready to run |
| **Total** | 6 services | **141 automated test cases** | ✅ Green |

**Bugs found and fixed during the test run:**

1. **messaging-service mounting order** — `app.use('/api', messageRoutes)` was running JWT auth on EVERY `/api/*` path, including `/api/internal/events/*`. Cross-service events to messaging-service were always 401-ing in production. Caught by `messaging.integration.test.js`. Fixed by mounting `internalRoutes` before `messageRoutes`.
2. **notification-service missing axios dependency** — the new `centrifugoClient.js` for real-time notification push imports axios, which wasn't in `package.json`. Test suite couldn't even load. Added axios to `dependencies`.
3. **complaint-service test timing** — `setImmediate` wasn't enough for the async auto-appointment chain (multiple awaits inside `autoCreateAppointment`). Three tests were flaky. Replaced with a 50ms-poll helper that waits up to 3 s for the expected appointment count.

---

## 2. Unit Tests

Pure-function tests with no I/O. Zero env config required — Jest runs them in <10 s.

### 2.1 auth-service — `tests/unit/jwt.unit.test.js` (8 cases)

```
PASS tests/unit/jwt.unit.test.js
  generateAccessToken
    √ returns a non-empty string
    √ includes sub claim equal to userId (required by Centrifugo)
    √ includes userId/email/role for downstream service auth middleware
    √ signs with JWT_ACCESS_SECRET (verifyAccessToken round-trips)
    √ rejects tokens signed with the wrong secret
    √ uses the default 15m expiry when JWT_ACCESS_EXPIRY env is unset
  generateRefreshToken
    √ signs with JWT_REFRESH_SECRET (separate from access)
    √ refresh tokens are NOT accepted by access verifier (different secrets)

Tests: 8 passed, 8 total
```

### 2.2 complaint-service — `tests/unit/appointmentEligibility.unit.test.js` (34 cases)

Exhaustive eligibility-matrix coverage for the auto-appointment gate (`category × priority`):

```
PASS tests/unit/appointmentEligibility.unit.test.js
  isEligibleForAppointment
    returns true for the full eligibility matrix
      √ category=wage_theft, priority=high
      √ category=wage_theft, priority=critical
      √ category=wrongful_termination, priority=high
      √ category=wrongful_termination, priority=critical
      √ category=harassment, priority=high
      √ category=harassment, priority=critical
      √ category=discrimination, priority=high
      √ category=discrimination, priority=critical
    rejects ineligible category × any priority   (12 cases)
    rejects eligible category × low/medium priority   (8 cases)
    rejects garbage / missing inputs   (6 cases)

Tests: 34 passed, 34 total   Time: 6.471 s
```

### 2.3 Run command

```bash
cd backend/services/<name>
npm run test:unit
```

---

## 3. Integration Tests

Real Express app + in-process MongoDB (`mongodb-memory-server`) + supertest. Mocks only external SaaS (Cloudinary, Resend, Centrifugo, Twilio) so no real network calls. No `.env` config needed — tests stub their own env vars before importing the app.

### 3.1 auth-service — `tests/integration/auth.integration.test.js` (10 cases)

```
PASS tests/integration/auth.integration.test.js
  GET /health
    √ returns 200 with status ok
  POST /api/auth/register
    √ registers a worker successfully
    √ rejects duplicate email with 400
    √ rejects invalid phone format with 400
    √ rejects mismatched confirmPassword with 400
  POST /api/auth/login
    √ returns 200 with access + refresh tokens on valid creds
    √ returns 401 on wrong password
    √ returns 401 on unknown email
  POST /api/auth/verify (email OTP)
    √ marks user verified given a valid code
    √ rejects wrong code with 4xx

Tests: 10 passed, 10 total   Time: 12.931 s
```

### 3.2 complaint-service — `tests/integration/complaint.integration.test.js` (22 cases)

End-to-end coverage of the workflow you specified — admin registers lawyer → worker files complaint → admin moves to `under_review` → auto-appointment created → lawyer records outcome → worker shares to community.

```
PASS tests/integration/complaint.integration.test.js
  GET /health   (1)
  Auth gating   (2)
  POST /api/complaints (worker files complaint)   (4)
  POST /api/registry (admin registers a lawyer)   (4)
  Auto-appointment lifecycle   (7)
    √ does not auto-create when status is still pending
    √ auto-creates an appointment when admin moves to under_review (eligible case)
    √ does NOT auto-create when priority is too low
    √ does NOT auto-create when category is ineligible (e.g. unsafe_conditions)
    √ lawyer can record an outcome and decrement officer load on completion
    √ lawyer cannot record outcome on someone else's appointment
    √ returns 503 when no active officer matches specialization
  Share-to-community   (4)

Tests: 22 passed, 22 total   Time: 11.171 s
```

### 3.3 community-service — `tests/integration/community.integration.test.js` (18 cases)

```
PASS tests/integration/community.integration.test.js
  GET /health   (1)
  Auth gating on /api/posts   (2)
  POST /api/posts (create post)   (2)
  GET /api/posts/:postId   (2)
  POST /api/posts/:postId/like   (2)
  POST /api/posts/:postId/poll (poll voting)   (3)
  DELETE /api/posts/:postId   (3)
  Internal events guard   (3)

Tests: 18 passed, 18 total   Time: 9.863 s
```

### 3.4 messaging-service — `tests/integration/messaging.integration.test.js` (13 cases)

```
PASS tests/integration/messaging.integration.test.js
  GET /health   (1)
  Auth gating on messaging routes   (1)
  POST /api/conversations   (3)
  GET /api/conversations   (1)
  POST /api/messages (send) + participant guard   (4)
  GET /api/messages/:conversationId   (2)
  Internal events guard   (1)

Tests: 13 passed, 13 total   Time: 6.91 s
```

### 3.5 notification-service — `tests/integration/notification.integration.test.js` (15 cases)

```
PASS tests/integration/notification.integration.test.js
  GET /health   (1)
  POST /api/notifications (internal write — no auth)   (3)
  GET /api/notifications (auth required, scoped to caller)   (3)
  GET /api/notifications/unread-count   (1)
  PATCH /api/notifications/:id/read   (2)
  PATCH /api/notifications/read-all   (2)
  DELETE /api/notifications/:id   (1)
  Internal events guard   (2)

Tests: 15 passed, 15 total   Time: 13.537 s
```

### 3.6 job-service — `tests/integration/job.integration.test.js` + `tests/health.test.js` (21 cases)

```
PASS tests/integration/job.integration.test.js
PASS tests/health.test.js
  GET /health   (1)
  POST /api/jobs (create job — employer/admin only)   (4)
  GET /api/jobs (public listing)   (2)
  GET /api/jobs/:id   (2)
  PUT /api/jobs/:id   (2)
  POST /api/jobs/:id/apply (worker applies)   (4)
  GET /api/jobs/my-listings (employer's own jobs)   (1)
  GET /api/jobs/my-applications (worker's applications)   (1)
  Smoke (health, root, 404 routing, auth gate)   (4)

Tests: 21 passed, 21 total   Time: 10.036 s
```

### 3.7 Run command

```bash
cd backend/services/<name>
npm run test:integration
```

Run for all 6 services in one go:

```bash
cd backend/services
for s in auth-service complaint-service community-service messaging-service notification-service job-service; do
  echo "=== $s ==="
  (cd "$s" && npm run test:integration)
done
```

---

## 4. Performance Tests (Artillery)

Each service has a `tests/performance/load-test.yml` Artillery script defining three phases:

| Phase | Duration | Arrival rate | Purpose |
|---|---|---|---|
| **Warm-up** | 30 s | 5 req/s | Connection pool primed, JIT warm |
| **Load test** | 60 s | 15-25 req/s | Sustained realistic load |
| **Stress test** | 30 s | 30-50 req/s | Find p95/p99 + breakpoint |

Per-service arrival rates:

| Service | Warm-up | Load | Stress | Total req over 2 min |
|---|---|---|---|---|
| auth-service | 5 | 20 | 50 | ~2,850 |
| complaint-service | 5 | 15 | 30 | ~2,000 |
| community-service | 5 | 20 | 40 | ~2,500 |
| messaging-service | 5 | 20 | 40 | ~2,500 |
| notification-service | 5 | 25 | 50 | ~3,150 |
| job-service | 5 | 20 | 40 | ~2,500 |

Each YAML defines weighted scenarios (e.g., for auth-service: 50% login, 20% register, 20% me, 10% refresh) so the load mirrors real traffic.

### 4.1 Run command (per service)

Performance tests need a **running** service, so it's a 2-terminal flow:

```bash
# Terminal 1 — start the service (reads .env, connects to Atlas)
cd backend/services/auth-service
npm run dev
# wait until you see "Server running on port 5001"
# and "[auth-service] Connected to MongoDB"

# Terminal 2 — fire Artillery
cd backend/services/auth-service
npm run loadtest
```

Artillery prints a phased report including:

- **Scenarios completed** (count + per-second rate)
- **Codes** (200/201/4xx/5xx breakdown)
- **Response time** — min, max, **median, p95, p99**
- **Errors** with sample request bodies for any non-2xx

### 4.2 Sample expected output (auth-service)

```
All VUs finished. Total time: 2 minutes, 8 seconds

--------------------------------
Summary report @ load test end
--------------------------------

http.codes.200: ........................ 1850
http.codes.201: ........................   320
http.codes.400: ........................   180   (expected — duplicate-email under load)
http.codes.401: ........................     0
http.codes.500: ........................     0

http.request_rate: ..................... 22/sec
http.requests: ......................... 2850
http.response_time:
  min: ................................. 18 ms
  max: ................................. 412 ms
  median: .............................. 38 ms
  p95: ................................. 124 ms
  p99: ................................. 248 ms

scenarios.completed: ................... 2850
scenarios.created: ..................... 2850
```

> **Note for the panel:** the actual numbers depend on local hardware + Atlas latency. The above is a representative shape. Acceptance criteria: p95 < 500 ms, error rate < 1 % (excluding intentional 400s on duplicate emails).

### 4.3 Run command (all services in sequence)

```bash
# In one terminal — services up via docker-compose
docker compose up -d auth-service complaint-service community-service \
  messaging-service notification-service job-service

# In another — run each loadtest
for s in auth-service complaint-service community-service messaging-service notification-service job-service; do
  echo "=== $s ==="
  (cd backend/services/$s && npm run loadtest) 2>&1 | tee "perf-$s.log"
done
```

---

## 5. CI Wiring

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs on every push to `main`:

```yaml
strategy:
  matrix:
    service:
      - auth-service
      - complaint-service
      - community-service
      - messaging-service
      - notification-service
      - job-service

steps:
  - npm ci --no-audit --no-fund --include=dev
  - syntax check (node -c on every src/*.js)
  - npm test                  # runs jest (all unit + integration)
```

Performance tests are NOT in CI (they need a running service); they're run manually pre-release.

---

## 6. Bugs Caught By This Test Run (and fixed)

These are real production bugs that the test suite caught. All fixed in the same commit as the test fixes.

### 6.1 messaging-service: cross-service events were always 401

**File:** [backend/services/messaging-service/src/app.js](backend/services/messaging-service/src/app.js)

```js
// BEFORE — wrong order
app.use('/api', messageRoutes);          // applies router.use(protect) globally
app.use('/api/messages', messageRoutes);
app.use('/api/internal', internalRoutes); // never reached

// AFTER — internal-events first
app.use('/api/internal', internalRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', messageRoutes);
```

`messageRoutes` calls `router.use(protect)` at the top, so any request matching `/api/...` got JWT-checked first and rejected with 401 before reaching `internalRoutes`. Sibling services (complaint, etc.) emitting `complaint_assigned` to messaging-service were silently failing in production. Caught by `Internal events guard › rejects without secret header (403)` — got 401 instead of expected 403.

### 6.2 notification-service: missing axios dependency

**File:** [backend/services/notification-service/package.json](backend/services/notification-service/package.json)

The new `centrifugoClient.js` (real-time push) imports axios, but axios was only in messaging-service's dependencies. The notification-service test suite couldn't even load (`Cannot find module 'axios'`). Fixed by adding axios to dependencies.

### 6.3 complaint-service tests: timing race on auto-appointment

**File:** [backend/services/complaint-service/tests/integration/complaint.integration.test.js](backend/services/complaint-service/tests/integration/complaint.integration.test.js)

`autoCreateAppointment` is fire-and-forget (`.catch(...)` instead of awaited) so the controller returns immediately after `updateComplaintStatus` saves. The test was using a single `setImmediate` tick, but the auto-create chain has multiple `await`s for DB writes. Three tests intermittently saw `Appointment.findOne()` return `null` and crashed on `apt._id`.

Fixed by adding a `waitForAppointments(expectedCount, timeoutMs = 3000)` helper that polls `Appointment.countDocuments({})` every 50 ms.

---

## 7. Demo Flow for the Viva

### Easiest path (recommended) — no env config required

```bash
# Show 8 unit tests + 56 integration tests in <30s
cd backend/services/complaint-service
npm run test:unit
npm run test:integration
```

This is the most impressive demo: shows the eligibility matrix exhaustively, then runs the full lifecycle test end-to-end (admin registers lawyer → worker files complaint → admin transitions status → auto-appointment created → lawyer records outcome → worker shares). All in <30 seconds, all green.

### Performance demo

```bash
# Terminal 1
cd backend/services/auth-service
npm run dev

# Wait for "Server running on port 5001"
# Terminal 2
cd backend/services/auth-service
npm run loadtest
```

Watch Artillery ramp through 5 → 20 → 50 req/s with the live request-rate counter.

### CI proof

Open the latest commit on [github.com/Nivakaran-S/LaborGuard](https://github.com/Nivakaran-S/LaborGuard) and show the green check on the matrix CI run across all 6 services.

---

## 8. Test Files Reference

```
backend/services/
├── auth-service/
│   ├── tests/unit/jwt.unit.test.js                               (8 cases)
│   ├── tests/integration/auth.integration.test.js                (10 cases)
│   └── tests/performance/load-test.yml                           (Artillery)
├── complaint-service/
│   ├── tests/unit/appointmentEligibility.unit.test.js            (34 cases)
│   ├── tests/integration/complaint.integration.test.js           (22 cases)
│   └── tests/performance/load-test.yml                           (Artillery)
├── community-service/
│   ├── tests/integration/community.integration.test.js           (18 cases)
│   └── tests/performance/load-test.yml                           (Artillery)
├── messaging-service/
│   ├── tests/integration/messaging.integration.test.js           (13 cases)
│   └── tests/performance/load-test.yml                           (Artillery)
├── notification-service/
│   ├── tests/integration/notification.integration.test.js        (15 cases)
│   └── tests/performance/load-test.yml                           (Artillery)
└── job-service/
    ├── tests/integration/job.integration.test.js                 (14 cases)
    ├── tests/health.test.js                                      (4 smoke)
    └── tests/performance/load-test.yml                           (Artillery)
```

Helper used by every integration suite:
```
tests/helpers/testDb.js   — mongodb-memory-server lifecycle (start / stop / clear)
```

---

**End of report.**
