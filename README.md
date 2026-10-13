# SRU MentorHub — Technical Mentorship, Evaluation & Grievance Platform

> **SR University (SRU) · Engineering & Technology · Full-Stack Web Application**  
> An enterprise-grade academic mentorship, continuous problem-solving evaluation, mock interview training, mentor reallocation, and confidential student grievance management ecosystem.

---

## 📌 Executive Summary

**SRU MentorHub** is a unified platform engineered to bridge the gap between faculty mentors, student mentees, and university administration. Designed specifically for competitive coding training, placement preparation, and student support, the platform eliminates manual tracking spreadsheets through automated workflows, persistent problem note-taking, structured rubric evaluations, seamless mentor reallocation, and confidential student support desks.

---

## 🎨 Modern Aesthetics & Dual Theme System

The platform features a **Dual Light & Dark Theme** system with instant, persistent toggling:
- **Light Theme**: Clean, high-contrast academic interface using slate palettes, crisp borders, and refined card surfaces.
- **Dark Theme**: Deep obsidian / slate-950 backdrop with vibrant neon-indigo, amber, emerald, and sky accents.
- **Persistent Toggle**: Integrated sun/moon switcher in the top navigation bar with `localStorage` persistence.
- **Tailwind CSS & Micro-Animations**: Smooth transitions, backdrop-blur modals, and custom scrollbars across all 43 pages and components.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SRU Client (React 19 + Vite)                    │
│   Tailwind CSS · Dual Theme (Dark/Light) · Lucide · Recharts · RBAC    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API (/api/v1)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express.js Backend (Node.js)                      │
│   JWT Auth · Multi-Admin RBAC · Excel Bulk Parser · Prisma Client      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Connection Pooling (Port 6543)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database (Supabase Cloud)                   │
│  Users · Tasks · Mock Interviews · Reallocations · Grievances · Doubts │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Database**: PostgreSQL (Supabase) via **Prisma ORM (v6)** with PgBouncer transaction pooling (`port 6543`) and direct connection for migrations (`port 5432`).
- **Backend**: Node.js, Express.js (ES Modules), JWT Authentication, bcryptjs, Multer, XLSX parsing, Morgan logging.
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Recharts, Axios with Bearer interceptors.
- **Identity & Email Standard**: All university member accounts follow the standard SRU institutional format: `<rollnumber>@sru.edu.in` (e.g., `2303a51812@sru.edu.in`) and `admin@sru.edu.in`.

---

## 🔄 Core Workflows & Functional Modules

### 1. Super Admin & Delegated Platform Administration
- **Designated Super Administrator**: `admin@sru.edu.in` holds exclusive authority over administrator identity management.
- **Administrator Directory (`/admin/users`)**:
  - Super Admin can create additional platform administrators with custom credentials.
  - Direct password reset and account status toggling (`ACTIVE` / `INACTIVE`).
  - Protected Super Admin account (cannot be deactivated or deleted).
- **Delegated Operational Administration**: Appointed administrators can oversee mentees, faculty mentors, batches, weekly tasks, review queues, and reports without administrator-level privilege escalation.

---

### 2. Mentor Reallocation & Cohort Transfer System
Designed for operational continuity when a faculty mentor leaves the university, accepts another offer, or needs workload rebalancing:
1. **Bulk / Cohort Transfer**:
   - Select a **Source Mentor** to instantly view their entire active mentee roster.
   - Interactive student checklist: toggle individual students or click **"Select All Students"** to transfer the complete cohort at once.
   - In-modal search bar to quickly filter students by name, roll number, or email.
   - Select an active **Target Mentor** (with current student workload displayed).
2. **Departing Mentor Deactivation Toggle**:
   - Optional checkbox: *"Deactivate departing mentor account"*.
   - Automatically sets the departing mentor's account to `INACTIVE`, revoking login access.
3. **Individual Mentee Reassignment**:
   - In the Mentees directory table, each student row features a **"Reassign"** button for quick 1-click mentor reassignments.
4. **Automated Notifications & Audit Ledger**:
   - Transferred students and destination mentors receive immediate notifications.
   - Records an immutable `MENTOR_REALLOCATION` audit log with actor ID, source/target mentors, student IDs, and administrative reasons.

---

### 3. Weekly Tasks & Coding Submissions (`Assign → Solve → Submit → Review`)
1. **Assignment**: Mentors or Admins publish weekly problem sets targeted to **All Students**, a **Specific Batch**, or **Selected Individuals**.
2. **Problem Integrations**: Problems link to LeetCode, Codeforces, CodeChef, HackerRank, or custom departmental repositories.
3. **Problem Progress Notes**: As students practice, they save persistent, per-problem solution notes (approach, time complexity $O(N)$, space complexity $O(1)$, edge cases).
4. **Submission**: Once all problems are practiced, mentees submit their complete solution snapshots. Submissions are version-tracked and locked from editing during review.
5. **Evaluation & Feedback**: Mentors inspect student code, assign problem-level feedback, provide an overall score (1–10), and issue a decision:
   - **`APPROVED`**: Unlocks gamified achievement points and updates cohort leaderboard.
   - **`RESUBMISSION_REQUIRED`**: Unlocks the task for the mentee with mentor feedback for revisions.

---

### 4. Weekly Mock Interviews (`Section → Session → Slot → Rubric Evaluation`)
1. **Mock Sections**: Created by mentors or faculty leads for specific weeks (Technical DSA, System Design, HR & Behavioral).
2. **Slot Scheduling & Allocation**: Sessions are scheduled across dates, evaluator rooms, and slot duration (e.g., 30 minutes). Students are assigned to specific faculty evaluators and venues.
3. **Rubric Evaluation**: Evaluators conduct interviews and record scores on a 10-point scale:
   - **Technical Knowledge** (1–10)
   - **Communication & Articulation** (1–10)
   - **Problem Solving & Analytical Thinking** (1–10)
   - **Overall Recommendation**: `STRONGLY_RECOMMENDED`, `RECOMMENDED`, `RECOMMENDED_WITH_IMPROVEMENT`, or `NOT_RECOMMENDED_YET`.
   - Qualitative mentor feedback and preparation advice.
4. **Audit Trail**: Any slot rescheduling, cancellation, or missed attendance is recorded in `MockSlotHistory`.
5. **CSV Analytics & Reports**: Mentors and Admins can export comprehensive Excel/CSV reports of mock ratings across batches.

---

### 5. Confidential Grievance & Complaint Desk
Strict data isolation rules safeguard student privacy and prevent conflicts of interest:

| Scenario | Mentee Visibility | Assigned Mentor Visibility | Administration Visibility |
| :--- | :---: | :---: | :---: |
| **Mentee files complaint to Mentor** | ✅ Full Access | ✅ Full Access | ❌ **Hidden** until escalated |
| **Mentee files complaint to Admin** | ✅ Full Access | ❌ **Strictly Hidden** | ✅ Full Access |
| **Mentor files grievance to Admin** | ❌ Hidden | ✅ Full Access | ✅ Full Access |
| **Mentee/Mentor Escalates Complaint** | ✅ Full Access | ✅ Full Access | ✅ **Revealed** with escalation audit reason |

- **Escalation Mechanism**: If a mentor does not resolve an issue or administrative arbitration is needed, either party can click **"Escalate to Administration"** with an escalation reason. The grievance immediately appears in the Admin Grievance Desk.
- **Threaded Communication**: Interactive follow-up messages between authorized participants with real-time status tracking (`PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`).
- **Resolution Tracking**: Records resolution notes, resolving authority, and timestamps. Students can mark complaints satisfactorily closed.

---

### 6. 1-on-1 Doubt Clearing & Guidance Sessions
*(Direct Mentee–Mentor channel; disabled on Admin side for student-mentor confidentiality)*
1. **Request**: Mentees request personal doubt clearing on specific concepts, project guidance, or code debugging.
   - Mentee specifies topic, detailed questions, preferred date/time, and mode preference (**Online Meet** or **In-Person Campus**).
2. **Mentor Scheduling**: The assigned mentor receives the request and assigns:
   - Confirmed date, start time, and end time.
   - **Google Meet / Zoom URL** (for Online mode) or **Faculty Cabin / Lab room venue** (for Offline mode).
   - Preparation notes for the mentee.
3. **Meeting Access**: Mentees receive an in-app notification with a direct **"Join Meeting Link"** or venue pin.
4. **Closure**: Once conducted, mentors mark the session completed with outcome takeaways.

---

### 7. High-Throughput Bulk Data Loader
- Enables administrators to import hundreds of student and mentor records from CSV or XLSX spreadsheets in seconds.
- **Intelligent Column Normalization**: Automatically recognizes roll numbers, names, departments, sections, and emails.
- **Standardized Identity Generation**: Converts student IDs/roll numbers directly into the official `<rollNumber>@sru.edu.in` identity schema.
- **Pre-Import Verification**: Dry-run preview displays valid rows, format discrepancies, and existing user conflicts before applying database changes.
- **Import Modes**: Supports `CREATE_NEW`, `UPDATE_EXISTING`, and `UPSERT` modes with downloadable error logs.

---

## 👥 Role Permissions Matrix

| Feature / Module | Mentee | Mentor | Administrator | Super Admin (`admin@sru.edu.in`) |
| :--- | :---: | :---: | :---: | :---: |
| **Dual Theme Switcher** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Platform Dashboard & KPIs** | Personal Stats | Authorized Mentees | Global Platform Metrics | Global Platform Metrics |
| **Weekly Tasks (Practice & Notes)** | Submit & Notes | Review & Rubrics | Create & Publish | Create & Publish |
| **Weekly Mock Interviews** | View Slot & Feedback | Evaluate & Schedule | View Global Reports | View Global Reports |
| **1-on-1 Doubt Sessions** | Request & Join | Schedule & Conduct | *Disabled for privacy* | *Disabled for privacy* |
| **Confidential Grievance Box** | Raise Ticket | Review Assigned | Resolve & Oversee | Resolve & Oversee |
| **Mentor Reallocation (Bulk & Single)**| ❌ No | ❌ No | ✅ Full Access | ✅ Full Access |
| **User & Batch Management** | *Own profile* | Assigned Mentees | Manage Mentees & Mentors | Manage Mentees & Mentors |
| **Administrator CRUD & Delegation** | ❌ No | ❌ No | ❌ No | ✅ Exclusive Access |
| **Bulk Excel / CSV Loader** | ❌ No | ❌ No | ✅ Full Access | ✅ Full Access |
| **CSV & Analytics Export** | ❌ No | Batch Tasks & Mocks | Global Reports | Global Reports |

---

## 🗄️ Database Schema Overview (Prisma)

The application models key institutional entities with strict relational constraints:

- `User`: Core user identity with `Role` (`ADMIN`, `MENTOR`, `MENTEE`), account status (`ACTIVE`, `INACTIVE`, `SUSPENDED`), hashed credentials.
- `MentorProfile` / `MenteeProfile`: Extended academic metadata (roll number, department, branch, section, faculty designation).
- `Batch` / `BatchMentor` / `BatchMentee`: Academic cohorts and group mappings.
- `MentorMenteeAssignment`: Direct mentor–mentee relationships (`ACTIVE`, `INACTIVE`) supporting historical reallocations.
- `Task` / `Problem`: Weekly coding problem sets containing LeetCode/CodeChef URLs and problem order.
- `MenteeTask` / `ProblemProgress`: Student task lifecycle and persistent algorithmic progress notes.
- `TaskSubmission` / `TaskReview`: Versioned student submissions and mentor rubrics/approvals.
- `MockSection` / `MockSession` / `MockSlot` / `MockEvaluation`: Complete mock interview scheduling and 3-criteria scoring rubric.
- `MockSlotHistory`: Audit log tracking slot date/room changes and rescheduling reasons.
- `Complaint` / `ComplaintMessage`: Privacy-scoped grievance tickets with escalation trail and discussion history.
- `DoubtSession`: 1-on-1 personal mentorship session requests with Google Meet and venue allocations.
- `Notification`: User alerts for task approvals, review requests, grievances, mock interviews, and reallocations.
- `AuditLog`: Immutable audit trail for user creations, password resets, admin updates, and mentor reallocations.
- `ImportHistory`: Audit ledger of bulk CSV/Excel imports with row counts and error reports.

---

## 🔌 API Endpoints Reference

All API routes are prefixed with `/api/v1` and authenticated using JWT Bearer headers:

### Authentication (`/api/v1/auth`)
- `POST /login`: Authenticate with roll number / email / identifier and password.
- `GET /me`: Fetch authenticated user profile, permissions, and `isSuperAdmin` flag.
- `POST /logout`: Clear session cookies.
- `POST /reset-request`: Submit a self-service password reset request.
- `GET /reset-requests`: (Admin) View and approve student password reset tickets.

### Administrator Delegation (`/api/v1/admins` & `/api/v1/users/admins`) *(Super Admin Only)*
- `GET /admins`: List all appointed platform administrators with status.
- `POST /admins`: Create a new administrator account with initial temporary credentials.
- `PATCH /admins/:id`: Update administrator name or toggle status (`ACTIVE` / `INACTIVE`).
- `DELETE /admins/:id`: Permanently remove an appointed administrator account.

### Mentor Reallocation & Assignment (`/api/v1`) *(Admin & Super Admin)*
- `POST /reallocate-mentor`: Bulk or selective transfer of students from source mentor to target mentor with optional source deactivation.
- `POST /mentees/:id/mentors`: Reassign an individual student to a new mentor and deactivate prior active assignments.
- `GET /mentees?mentorId=...`: Filter mentees list by assigned mentor.

### Tasks & Reviews (`/api/v1/tasks`, `/api/v1/mentee`, `/api/v1/mentor`)
- `GET /tasks`: List published weekly tasks.
- `POST /tasks`: (Mentor/Admin) Create a new weekly task with problem URLs.
- `GET /mentee/tasks/:taskId`: Fetch mentee problem notes and submission status.
- `POST /mentee/tasks/:taskId/notes`: Save draft solution notes for a problem.
- `POST /mentee/tasks/:taskId/submit`: Finalize and submit task version.
- `GET /mentor/task-reviews`: View pending mentee submission queue.
- `POST /mentor/task-reviews/:submissionId`: Submit review (Approve or Resubmission Required).

### Weekly Mock Interviews (`/api/v1`)
- `GET /mentor/mocks`: List mock sections and summary statistics.
- `POST /mentor/mocks`: Create new mock interview section.
- `POST /mentor/mocks/:id/slots`: Assign mentee to evaluator, date, time, and room.
- `POST /mentor/mocks/slots/:slotId/evaluate`: Record rubric evaluation (Technical, Communication, Problem Solving).
- `GET /mentee/mocks`: Mentee's upcoming scheduled mock slots and past evaluation reports.

### Grievances & Complaints (`/api/v1/complaints`)
- `GET /complaints`: List complaints scoped to user role and privacy filters.
- `POST /complaints`: Submit a grievance (Mentee: choose Mentor vs. Admin target).
- `GET /complaints/:id`: Retrieve complaint details and conversation history.
- `POST /complaints/:id/messages`: Post a reply in the discussion thread.
- `POST /complaints/:id/forward`: Escalate a mentor-level complaint to administration.
- `PATCH /complaints/:id/status`: Update status (`IN_REVIEW`, `RESOLVED`, `REJECTED`) and add outcome notes.

### 1-on-1 Doubt Sessions (`/api/v1/doubt-sessions`)
- `GET /doubt-sessions`: List sessions for mentee or mentor.
- `POST /doubt-sessions`: Mentee requests 1-on-1 doubt clearing session.
- `POST /doubt-sessions/:id/schedule`: Mentor assigns timeslot, Google Meet URL, or venue.
- `POST /doubt-sessions/:id/complete`: Mentor marks session completed with outcome notes.
- `POST /doubt-sessions/:id/cancel`: Cancel or decline request with reason.

### Bulk Import & Reports (`/api/v1/bulk-import`, `/api/v1/reports`)
- `POST /bulk-import/preview`: Parse and validate uploaded Excel/CSV file.
- `POST /bulk-import/execute`: Execute bulk user creation or update.
- `GET /reports/tasks/csv`: Export weekly tasks completion report.
- `GET /reports/mentees/csv`: Export student performance and coding profile stats.
- `GET /reports/mocks/csv`: Export mock interview scores and evaluations.

---

## 🚀 Local Setup & Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- Active PostgreSQL database or Supabase project

### 1. Repository Setup
```bash
git clone https://github.com/2303A52012/mentorhub.git
cd mentorhub
```

### 2. Configure Environment Variables

**Server Configuration (`server/.env`):**
```env
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="mentorhub_jwt_super_secret_production_key_2026"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

**Client Configuration (`client/.env` - optional):**
```env
VITE_API_URL="/api/v1"
```

### 3. Install Dependencies & Initialize Database

```bash
# Install server dependencies and generate Prisma client
cd server
npm install
npx prisma generate

# Install client dependencies
cd ../client
npm install
```

### 4. Running the Development Environment

Run backend and frontend in separate terminals:
```bash
# Terminal 1 - Backend API:
cd server
npm run dev

# Terminal 2 - Frontend Client:
cd client
npm run dev
```

- **Frontend Client**: `http://localhost:5173` (or `http://localhost:5174`)
- **Backend API**: `http://localhost:5001`
- **API Health Check**: `http://localhost:5001/api/health`

---

## 🔐 Default Access & Sample Credentials

All registered accounts use their institutional email address:

| Persona | Sample Login Email / ID | Default Password | Role Access |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@sru.edu.in` | `Password@123` | Platform Admin + Admin Management |
| **Faculty Lead / Mentor** | `2303a51812@sru.edu.in` | `Password@123` | Mentor Dashboard, Review Queue & Mocks |
| **Student Mentee** | `2403a51015@sru.edu.in` | `Password@123` | Mentee Tasks, Doubt Sessions & Complaints |

*(Password resets can be performed directly by administrators or via the self-service reset ticket queue).*

---

## 🧪 Testing & Verification

```bash
# Validate client production bundle and Tailwind compilation:
cd client
npm run build

# Run server syntax and integration checks:
cd ../server
node --check src/controllers/userController.js
node --check src/routes/userRoutes.js
```

---

## 📄 License
Developed for SR University by Palakurthi Lalith Prakash. All rights reserved. Built with modern full-stack best practices for scalable academic training.
