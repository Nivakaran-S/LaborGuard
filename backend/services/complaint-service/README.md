# Complaint Service

Complaint Management Service handles complaint filing, status lifecycle, evidence uploads, automated legal appointment booking, and a legal officer(lawyer) registry with round-robin assignment.

## Features

- **Complaints** — File, update, delete, filter, search, and track complaints with full status audit trail
- **Status Lifecycle** — `pending → under_review → resolved / rejected` with change history on every transition
- **Evidence Uploads** — Cloudinary integration for attaching images, documents, and PDFs to complaints
- **PDF Reports** — Downloadable, styled complaint report generated on demand with PDFKit
- **Auto-Appointment Booking** — Critical complaints in eligible categories automatically trigger a legal appointment when moved to `under_review`
- **Round-Robin Assignment** — Legal officer auto-selection based on specialization, active load, and last-assigned time
- **Legal Officer Registry** — Admin-managed registry of legal officers with specializations for the assignment engine of complaints
- **Email Notifications** — Nodemailer sends confirmation and status-update emails to workers, and case-assignment emails to legal officers
- **Role-Based Access Control** — JWT-authenticated routes with per-role authorization (`worker`, `legal_officer`, `admin`)
- **Dashboard Stats** — Aggregated breakdown of complaints by status, category, and priority

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database & ODM |
| Kafka (KafkaJS) | Event-driven messaging |
| Cloudinary | Evidence file storage (images, PDFs) |
| Nodemailer | Transactional email via Gmail SMTP |
| PDFKit | Server-side PDF report generation |
| multer-storage-cloudinary | Streaming file uploads to Cloudinary |
| express-validator | Input validation & sanitization |
| jsonwebtoken | JWT authentication |
| Docker | Containerization |

## User Roles

| Role | Description |
|------|-------------|
| `worker` | Labor workers — file and manage their own complaints |
| `legal_officer` | Assigned legal professionals — view their assigned cases, update status, reschedule appointments |
| `admin` | Platform administrators — full access to all complaints, appointments, and the officer registry |

## Project Structure

```
complaint-service/
├── src/
│   ├── index.js                         # Entry point — Express, MongoDB, Kafka bootstrap
│   ├── controllers/
│   │   ├── complaintController.js       # HTTP handlers for complaint routes
│   │   ├── appointmentController.js     # HTTP handlers for appointment routes
│   │   └── registryController.js        # HTTP handlers for officer registry routes
│   ├── models/
│   │   ├── Complaint.js                 # Complaint schema (with statusHistory & attachments)
│   │   ├── Appointment.js               # Appointment schema (with rescheduleHistory)
│   │   └── LegalOfficerRegistry.js      # Officer specialization & load tracking
│   ├── routes/
│   │   ├── complaintRoutes.js           # /api/complaints
│   │   ├── appointmentRoutes.js         # /api/appointments
│   │   └── registryRoutes.js            # /api/registry
│   ├── services/
│   │   ├── complaintService.js          # Core complaint business logic
│   │   ├── appointmentService.js        # Round-robin assignment & appointment lifecycle
│   │   ├── emailService.js              # Nodemailer email templates
│   │   └── registryService.js           # Registry CRUD & stats
│   ├── middleware/
│   │   ├── auth.js                      # JWT authenticate + role-based authorize
│   │   └── errorHandler.js             # Global error handler & 404 middleware
│   └── utils/
│       ├── cloudinary.js                # Cloudinary config + multer storage
│       ├── pdfGenerator.js              # PDFKit complaint report generator
│       └── validator.js                 # express-validator rule sets for all routes
├── tests/                               # Jest unit tests
├── Dockerfile
├── package.json
└── .gitignore
```

## API Endpoints

### Health & Info
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Health check |
| GET | `/` | None | Service info |

### Complaints (`/api/complaints`)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/` | `worker` | File a new complaint |
| GET | `/my` | `worker` | List the  worker's own complaints |
| GET | `/` | `admin` | List all complaints (filterable, searchable, paginated) |
| GET | `/stats` | `admin`, `legal_officer` | Aggregated stats by status / category / priority |
| GET | `/:id` | `worker` (own), `legal_officer` (assigned), `admin` | Get complaint by ID |
| PATCH | `/:id` | `worker` (own pending) | Update complaint fields |
| PATCH | `/:id/status` | `admin`, `legal_officer` (assigned) | Change complaint status (with audit log) |
| PATCH | `/:id/assign` | `admin` | Manually assign complaint to a legal officer |
| DELETE | `/:id` | `worker` (own pending), `admin` | Delete complaint |
| POST | `/:id/attachments` | `worker` (own) , `admin` | Upload evidence file to Cloudinary |
| GET | `/:id/report` | Authenticated | Download complaint as a PDF report |

### Appointments (`/api/appointments`)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/my` | `worker` | Get the authenticated worker's appointments |
| GET | `/assigned` | `legal_officer` | Get appointments assigned to the authenticated officer |
| GET | `/` | `admin` | List all appointments (filterable, paginated) |
| GET | `/:id` | `worker` (own), `legal_officer` (assigned), `admin` | Get appointment by ID |
| PATCH | `/:id/confirm` | `admin` | Confirm an auto-booked appointment with meeting details |
| PATCH | `/:id/reschedule` | `admin`, `legal_officer` (assigned) | Reschedule with full history log |
| PATCH | `/:id/cancel` | `admin` | Cancel appointment (decrements officer load count) |

### Legal Officer Registry (`/api/registry`)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/stats` | `admin` | Registry statistics |
| GET | `/` | `admin` | List all registered officers (paginated) |
| POST | `/` | `admin` | Register a new legal officer |
| GET | `/:officerId` | `admin` | Get officer by ID |
| PATCH | `/:officerId` | `admin` | Update officer details or specializations |
| PATCH | `/:officerId/deactivate` | `admin` | Deactivate an officer (removes from auto-assignment pool) |

## Third-Party Integrations

### Cloudinary
- **Purpose:** Cloud storage for complaint evidence files (images and PDFs)
- **How it works:** Files are streamed via `multer-storage-cloudinary` to the `laborguard/evidence` folder on Cloudinary. Each file is named `complaint_{id}_{timestamp}`. The returned `secure_url` is stored as an attachment in the `Complaint` document
- **Supported formats:** JPEG, PNG, PDF
- **File size limit:** 5 MB per file
- **Docs:** https://cloudinary.com/documentation
- **Required env vars:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Nodemailer (Gmail SMTP)
- **Purpose:** Transactional email notifications throughout the complaint lifecycle
- **Emails sent:**
  | Trigger | Recipient | Template |
  |---------|-----------|----------|
  | Complaint filed | Worker | Complaint confirmation with ID, category, priority |
  | Status updated | Worker | Previous vs new status with color-coded badge |
  | Appointment auto-booked | Worker | Appointment details + assigned officer name |
  | Appointment assigned | Legal Officer | Case details + appointment schedule |
- **How it works:** All emails are sent asynchronously in the background (`.catch()` logged) so they never block the API response
- **Docs:** https://nodemailer.com
- **Required env vars:** `EMAIL_USER`, `EMAIL_PASS`

### PDFKit
- **Purpose:** Server-side PDF report generation for complaints
- **How it works:** The PDF is streamed directly to the HTTP response (`res.pipe(doc)`) — no temporary files on disk. The report includes complaint metadata, description, incident details, and a full status history audit trail
- **Docs:** https://pdfkit.org

## Complaint Lifecycle

```
State Machine:

  pending
    ├─→ under_review   (by admin or auto on assign)
    │       ├─→ resolved    (by admin / legal_officer)
    │       └─→ rejected    (by admin / legal_officer)
    └─→ rejected        (by admin, direct rejection)

Each transition is recorded in complaint.statusHistory with:
  - new status
  - who changed it (userId + role)
  - optional reason
  - timestamp
```

## Auto-Appointment Booking Flow

When an admin moves a complaint to `under_review` and the complaint meets **both** eligibility criteria, an appointment is automatically created:

**Eligible Categories:** `wage_theft`, `wrongful_termination`, `harassment`, `discrimination`  
**Eligible Priorities:** `high`, `critical`

```
Complaint status → under_review
  → isEligibleForAppointment(category, priority)?
      YES → autoCreateAppointment()
              → CATEGORY_SPECIALIZATION_MAP lookup
                  wage_theft / wrongful_termination → labor_law
                  harassment                        → harassment_law
                  discrimination                    → discrimination_law
              → Round-Robin Officer Selection
                  1. Filter: isActive=true, specialization matches
                  2. Sort:   activeAppointmentCount ASC → lastAssignedAt ASC
                  3. Pick:   officers[0]
              → Schedule: next working day at 9:00 AM (skips weekends)
              → Appointment created (status: auto_booked)
              → Officer load updated (+1 activeAppointmentCount, +1 totalAssigned)
              → complaint.assignedTo = officer.officerId
              → Emails sent in background (worker + officer)
      NO  → skip
```


## Environment Variables

```env
# Server
PORT=3003
SERVICE_NAME=complaint-service

# Database
MONGODB_URI=mongodb://localhost:27017/laborguard

# Message Broker
KAFKA_BROKER=localhost:9092

# Auth
JWT_SECRET=your_jwt_secret

# Email (Nodemailer — Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```


## Running

### Local Development
```bash
npm install
npm run dev
```

### Docker
```bash
# From the backend/ directory
docker-compose up -d mongodb zookeeper kafka complaint-service
```

### Tests
```bash
npm test
```

## Scenario Walkthroughs

### Scenario 1 — Worker Files a Wage Theft Complaint

1. Worker sends `POST /api/complaints` with category `wage_theft`, priority `high`
2. Complaint is saved with status `pending`
3. A confirmation email is sent to the worker
4. Worker uploads supporting evidence via `POST /api/complaints/:id/attachments` (max 5 MB, stored on Cloudinary)

### Scenario 2 — Admin Reviews and Approves a High-Priority Complaint

1. Admin calls `PATCH /api/complaints/:id/status` with `{ "status": "under_review" }`
2. The transition is logged in `statusHistory`
3. A status-update email is sent to the worker
4. Since `wage_theft` + `high` is eligible:
   - The engine looks up active `labor_law` officers from the registry
   - Picks the least-loaded officer (round-robin)
   - Creates an `Appointment` with `status: auto_booked`, scheduled for the next working day at 9 AM
   - Increments the officer's `activeAppointmentCount`
   - Sends an appointment email to both the worker and the assigned officer

### Scenario 3 — Admin Confirms the Auto-Booked Appointment

1. Admin calls `PATCH /api/appointments/:id/confirm` with `{ "meetingDetails": "https://meet.google.com/xxx", "notes": "..." }`
2. Appointment status moves to `confirmed`, `confirmedAt` is recorded
3. Worker and officer can both view the confirmed appointment and meeting link

### Scenario 4 — Legal Officer Reschedules Due to Unavailability

1. Legal officer calls `PATCH /api/appointments/:id/reschedule` with a new `scheduledAt` + reason
2. The old date and reason are appended to `rescheduleHistory`
3. Appointment reflects the new date; full audit history is preserved

### Scenario 5 — Worker Downloads a Complaint Report

1. Worker calls `GET /api/complaints/:id/report`
2. The server streams a PDF directly in the response with `Content-Disposition: attachment`
3. The PDF includes complaint details, description, incident location, and the complete status history log

### Scenario 6 — Admin Rejects a Complaint Directly

1. Admin calls `PATCH /api/complaints/:id/status` with `{ "status": "rejected", "reason": "Duplicate complaint" }`
2. The rejection reason is logged in `statusHistory`
3. `resolvedAt` timestamp is set
4. A status-update email is sent to the worker informing them of the rejection
