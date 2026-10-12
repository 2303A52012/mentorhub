# SRU MentorHub — Technical Mentorship, Evaluation & Grievance Platform

> **SR University (SRU) · Engineering & Technology · Full-Stack Web Application**  
> An enterprise-grade academic mentorship, continuous problem-solving evaluation, mock interview training, and confidential student grievance management ecosystem.

---

## 📌 Executive Summary

**SRU MentorHub** is a unified platform engineered to bridge the gap between faculty mentors, student mentees, and university administration. Designed specifically for competitive coding training, placement preparation, and student support, the platform eliminates manual tracking spreadsheets through automated workflows, persistent problem note-taking, structured rubric evaluations, and confidential student support desks.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SRU Client (React 19 + Vite)                    │
│     Tailwind CSS · Lucide Icons · Recharts · Role Protected Routing    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API (/api/v1)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express.js Backend (Node.js)                      │
│     JWT Auth · RBAC Middleware · Excel Bulk Parser · Prisma Client     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Connection Pooling (Port 6543)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database (Supabase Cloud)                   │
│   Users · Tasks · Mock Interviews · Grievances · Doubt Sessions        │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Database**: PostgreSQL (Supabase) via **Prisma ORM (v6)** with PgBouncer transaction pooling (`port 6543`) and session pooling for schema migrations (`port 5432`).
- **Backend**: Node.js, Express.js (ES Modules), JWT Authentication, bcryptjs, Multer, XLSX parsing, Morgan logging.
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Recharts, Axios with Bearer interceptors.
- **Identity & Email Standard**: All university member accounts follow the standard SRU institutional format: `<rollnumber>@sru.edu.in` (e.g., `2303a51812@sru.edu.in`) and `admin@sru.edu.in`.

---

## 🔄 Core Workflows & Functional Modules

### 1. Weekly Tasks & Coding Submissions (`Assign → Solve → Submit → Review`)
1. **Assignment**: Mentors or Admins publish weekly problem sets targeted to **All Students**, a **Specific Batch**, or **Selected Individuals**.
2. **Problem Integrations**: Problems link to LeetCode, Codeforces, CodeChef, HackerRank, or custom departmental repositories.
3. **Problem Progress Notes**: As students practice, they save persistent, per-problem solution notes (approach, time complexity $O(N)$, space complexity $O(1)$, edge cases).
4. **Submission**: Once all problems are practiced, mentees submit their complete solution snapshots. Submissions are version-tracked and locked from editing during review.
5. **Evaluation & Feedback**: Mentors inspect student code, assign problem-level feedback, provide an overall score (1–10), and issue a decision:
   - **`APPROVED`**: Unlocks gamified achievement points and updates cohort leaderboard.
   - **`RESUBMISSION_REQUIRED`**: Unlocks the task for the mentee with mentor feedback for revisions.

---

### 2. Weekly Mock Interviews (`Section → Session → Slot → Rubric Evaluation`)
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

### 3. Confidential Grievance & Complaint Desk
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

### 4. 1-on-1 Doubt Clearing & Guidance Sessions
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

### 5. High-Throughput Bulk Data Loader
- Enables administrators to import hundreds of student and mentor records from CSV or XLSX spreadsheets in seconds.
- **Intelligent Column Normalization**: Automatically recognizes roll numbers, names, departments, sections, and emails.
- **Standardized Identity Generation**: Converts student IDs/roll numbers directly into the official `<rollNumber>@sru.edu.in` identity schema.
- **Pre-Import Verification**: Dry-run preview displays valid rows, format discrepancies, and existing user conflicts before applying database changes.
- **Import Modes**: Supports `CREATE_NEW`, `UPDATE_EXISTING`, and `UPSERT` modes with downloadable error logs.

---

## 👥 Role Permissions Matrix

| Feature / Module | Mentee | Mentor | Administrator |
| :--- | :---: | :---: | :---: |
| **Platform Dashboard & Analytics** | Personal KPIs & Streaks | Authorized Mentees & At-Risk | Global Platform Metrics |
| **Weekly Tasks (Practice & Notes)** | Submit & Problem Notes | Review & Approve/Reject | Create & Publish Platform-wide |
| **Weekly Mock Interviews** | View Slot & Performance | Evaluate & Schedule Slots | View Global Mock Reports & CSV |
| **1-on-1 Doubt Sessions** | Request & Join Meet | Schedule Timeslot & Venue | *Disabled for privacy* |
| **Confidential Grievance Box** | Raise to Mentor or Admin | Review Assigned & Escalate | Oversee Direct & Escalated |
| **User & Batch Management** | *View own profile only* | View Assigned Mentees | Full CRUD & Password Resets |
| **Bulk Excel / CSV Loader** | ❌ No | ❌ No | ✅ Full Access |
| **CSV & Analytics Export** | ❌ No | Batch Tasks & Mocks | Global Tasks, Mentees & Mocks |

---

## 🗄️ Database Schema Overview (Prisma)

The application models key institutional entities with strict relational constraints:

- `User`: Core user identity with `Role` (`ADMIN`, `MENTOR`, `MENTEE`), account status, hashed credentials, and relation links.
- `MentorProfile` / `MenteeProfile`: Extended academic metadata (roll number, department, branch, section, faculty designation).
- `Batch` / `BatchMentor` / `BatchMentee`: Academic cohorts and groups.
- `MentorMenteeAssignment`: Direct 1-to-1 mentor–mentee relationships (`ACTIVE`, `INACTIVE`).
- `Task` / `Problem`: Weekly coding problem sets containing LeetCode/CodeChef URLs and problem order.
- `MenteeTask` / `ProblemProgress`: Student task lifecycle and persistent algorithmic progress notes.
- `TaskSubmission` / `TaskReview`: Versioned student submissions and mentor rubrics/approvals.
- `MockSection` / `MockSession` / `MockSlot` / `MockEvaluation`: Complete mock interview scheduling and 3-criteria scoring rubric.
- `MockSlotHistory`: Audit log tracking slot date/room changes and rescheduling reasons.
- `Complaint` / `ComplaintMessage`: Privacy-scoped grievance tickets with escalation trail and discussion history.
- `DoubtSession`: 1-on-1 personal mentorship session requests with Google Meet and venue allocations.
- `Notification`: User alerts for task approvals, review requests, grievances, and mock interviews.
- `ImportHistory`: Audit ledger of bulk CSV/Excel imports with row counts and error reports.

---

## 🔌 API Endpoints Reference

All API routes are prefixed with `/api/v1` and authenticated using JWT Bearer headers:

### Authentication (`/api/v1/auth`)
- `POST /login`: Authenticate with roll number email & password.
- `GET /me`: Fetch authenticated user profile and permissions.
- `POST /logout`: Clear session cookies.
- `POST /reset-request`: Submit a self-service password reset request.
- `GET /reset-requests`: (Admin) View and approve student password reset tickets.

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
git clone https://github.com/your-org/mentorconnect.git
cd mentorconnect
```

### 2. Configure Environment Variables

**Server Configuration (`server/.env`):**
```env
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="sru_mentorconnect_super_secret_production_key_2026"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

**Client Configuration (`client/.env` - optional):**
```env
VITE_API_URL="/api/v1"
```

### 3. Install Dependencies & Initialize Database

```bash
# Install root, server, and client dependencies
cd server
npm install
npx prisma generate
npx prisma db push

cd ../client
npm install
```

### 4. Running the Development Environment

You can start both backend and frontend concurrently from the root directory:
```bash
# From repository root:
node dev.js
```

Or run them in separate terminals:
```bash
# Terminal 1 - Backend:
cd server
npm run dev

# Terminal 2 - Frontend:
cd client
npm run dev
```

- **Frontend Client**: `http://localhost:5173` (or `http://localhost:5174`)
- **Backend API**: `http://localhost:5001`
- **API Health Check**: `http://localhost:5001/api/health`

---

## 🔐 Default Access & Sample Credentials

All registered accounts use their institutional email address:

| Persona | Sample Login Email | Role Access |
| :--- | :--- | :--- |
| **System Administrator** | `admin@sru.edu.in` | Global University Administrative Desk |
| **Faculty Lead / Mentor** | `2303a51812@sru.edu.in` | Mentor Dashboard, Review Queue & Mocks |
| **Student Mentee** | `2403a51015@sru.edu.in` | Mentee Tasks, Doubt Sessions & Complaints |

*(Password resets can be performed via the self-service reset flow or configured via database seeds).*

---

## 🧪 Testing & Verification

```bash
# Validate client bundle and linting:
cd client
npm run build

# Run automated workflow verification tests:
cd ../server
node test-weekly-mocks.js
```

---

## 📄 License
Developed for SR University. All rights reserved. Built with modern full-stack best practices for scalable academic training.
