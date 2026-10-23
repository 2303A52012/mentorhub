# SRU MentorHub — Technical Mentorship, Evaluation, Training & Grievance Platform

> **SR University (SRU) · Engineering & Technology · Full-Stack Web Application**  
> An enterprise-grade academic mentorship, continuous problem-solving evaluation, corporate trainer cohort management, live senior verification engine, mock interview training, mentor reallocation, and confidential student grievance management ecosystem.

---

## 📌 Executive Summary

**SRU MentorHub** is a unified platform engineered to bridge the gap between faculty mentors, corporate trainers, student mentees, and university administration. Designed specifically for competitive coding training, placement preparation, and student support, the platform eliminates manual tracking spreadsheets through automated workflows, persistent problem note-taking, structured rubric evaluations, seamless mentor reallocation, syllabus training logs, live senior target verification, and confidential student support desks.

---

## 🎨 Modern Aesthetics & Dual Theme System

The platform features a **Dual Light & Dark Theme** system with instant, persistent toggling:
- **Light Theme**: Clean, high-contrast academic interface using slate palettes, crisp borders, and refined card surfaces.
- **Dark Theme**: Deep obsidian / slate-950 backdrop with vibrant neon-indigo, amber, emerald, and sky accents.
- **Persistent Toggle**: Integrated sun/moon switcher in the top navigation bar with `localStorage` persistence.
- **Tailwind CSS & Micro-Animations**: Smooth transitions, glassmorphic panels, backdrop-blur modals, and custom scrollbars across all pages and components.

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
│   JWT Auth · Multi-Role RBAC · Excel Bulk Parser · Prisma Client       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Connection Pooling (Port 6543)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database (Supabase Cloud)                   │
│   Users · Batches · Tasks · Reviews · POTDs · Targets · Verifications │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Database**: PostgreSQL (Supabase) via **Prisma ORM (v6)** with PgBouncer transaction pooling (`port 6543`) and direct connection for migrations (`port 5432`).
- **Backend**: Node.js, Express.js (ES Modules), JWT Authentication, bcryptjs, Multer, XLSX parsing, Morgan logging.
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Recharts, Axios with Bearer interceptors.
- **Institutional Identity Standard**:
  - Super Admin: `admin@sru.edu.in`
  - Faculty Mentors: `<rollNumber>@sru.edu.in` (e.g., `2303a51812@sru.edu.in`)
  - Corporate Trainers: `trainer.{batch}@sru.edu.in` (e.g., `trainer.b1@sru.edu.in`)
  - Student Mentees: `<rollNumber>@sru.edu.in` (e.g., `2403a51015@sru.edu.in`)

---

## 🔄 Core Workflows & Functional Modules

### 1. Corporate Trainer Portal & Cohort Authority
Trainers act as batch directors who oversee all students and mentors within their designated cohort (G6-B1, G6-B2, G6-B3, or G6-B4):
- **Batch-Scoped Authority**: Trainers exclusively access and manage students and mentors within their assigned cohort.
- **Batch Task Assignments**: Assign coding assignments to their entire batch or a custom subset of students.
- **Submissions & Reviews**: Inspect source code, algorithmic complexity, and mentor feedback.
- **Dedicated Trainer Profiles**: Configured with specialization, designations, cabins, and direct batch associations.

---

### 2. Pillar 2: Hierarchical Multicast Announcements
A targeted institutional communication engine with strict audience selection and parent-visibility rules:
- **Targeted Audiences**:
  - `ALL`: Broadcast to all platform members.
  - `BATCH`: Target an entire academic cohort (e.g., G6-B1).
  - `MENTOR_GROUP`: Target a specific mentor's mentees.
  - `INDIVIDUAL`: Target custom selected individuals.
- **Auto-CC / Superior Visibility Guarantee**:
  - Super Admin & Admins retain global transparency across all posted announcements.
  - When announcements target students, their assigned **Mentor** and batch **Trainer** automatically gain visibility to ensure cohesive academic support.
- **Read Receipts**: Tracks individual reads with timestamps per user.

---

### 3. Pillar 3: Training Calendar & Daily Problem of the Day (POTD)
- **Official Training Dates Log**:
  - Pre-seeded official calendar schedule across September, October, and November 2026.
  - Dropdown batch switcher to view covered syllabus and problems solved on any selected training date.
  - Trainers log topics covered, solution notes, and problems discussed per date.
- **Company-Specific Daily Problem (POTD)**:
  - Trainers publish company-tagged coding problems (e.g. Amazon, Google, Microsoft) with difficulty (`EASY`, `MEDIUM`, `HARD`) and platform auto-detection (`LEETCODE`, `CODECHEF`, `CODEFORCES`, `HACKERRANK`, `CUSTOM`).
  - Problem reflected on the student dashboard and daily problems hub.
  - **Student Submissions**: Mentees submit solutions directly with source code, language selector, time complexity $O(N)$, and space complexity $O(1)$.
  - **Trainer Inspection Drawer**: Trainers track solved vs. pending student counts and inspect student source code with 1-click clipboard copying.

---

### 4. Pillar 4: Weekly Cumulative Targets (W1–W12) & Live Senior Verification Engine
Ensures that student LeetCode metrics reflect authentic, mentor-verified work rather than unverified profile claims:

#### 4.1 Target Schedule (Starting 05 Oct 2026)
| Week | Start Date | Cumulative LeetCode Target | Verification Requirement |
| :---: | :---: | :---: | :---: |
| **W1** | 05 Oct 2026 | **98** Problems | Senior Live Review Required |
| **W2** | 12 Oct 2026 | **111** Problems | Senior Live Review Required |
| **W3** | 19 Oct 2026 | **141** Problems | Senior Live Review Required |
| **W4** | 26 Oct 2026 | **156** Problems | Senior Live Review Required |
| **W5** | 02 Nov 2026 | **170** Problems | Senior Live Review Required |
| **W6** | 09 Nov 2026 | **184** Problems | Senior Live Review Required |
| **W7** | 16 Nov 2026 | **207** Problems | Senior Live Review Required |
| **W8** | 23 Nov 2026 | **207** Problems | Senior Live Review Required |
| **W9** | 30 Nov 2026 | **207** Problems | Senior Live Review Required |
| **W10** | 07 Dec 2026 | **207** Problems | Senior Live Review Required |
| **W11** | 14 Dec 2026 | **207** Problems | Senior Live Review Required |
| **W12** | 21 Dec 2026 | **207** Problems | Senior Live Review Required |

#### 4.2 Strict Verification Logic & Mentor Scoping
- **Strict Target Rule**:
  $$\text{Target Met} \iff \text{Mentor Verified Count} \ge \text{Week Cumulative Target}$$
- **Crucial Rule**: Unverified LeetCode solves or self-reported submissions *never* satisfy the target without Senior live review.
- **Mentor Scoping**: When a faculty mentor logs in to the weekly audit sheet, they see **only their assigned mentees** (~10–12 students) rather than the entire 120-student batch.
- **Live Verification Workflow**:
  1. The Senior Mentor opens the student's weekly audit sheet during the 1-on-1 sync.
  2. Senior verifies code authenticity and problem solutions live.
  3. Senior enters the verified problem count and clicks **"Confirm & Save Verification"**.
  4. System timestamps the verification, records Senior ID, and updates the student's **Target Met** badge.
- **Batch Target Customization**:
  - Trainers and Admins can customize target problem counts per batch for pacing adjustments (e.g. fast-track cohorts).

---

### 5. Profile Platform Solved Counters with Auto-Sync
- Student profiles feature interactive counter blocks for major competitive platforms:
  - **LeetCode** *(Live Synced with Weekly Cumulative Targets)*
  - **Codeforces**
  - **CodeChef**
  - **HackerRank**
  - **GeeksforGeeks**
- **Interactive Controls**:
  - Initialized to 0 by default.
  - Direct **`+`** increment (+1) and **`-`** decrement (-1).
  - **`Custom`** button: Quick presets (`+1`, `+5`, `+10`, `+20`) or direct exact count input.
  - **Real-Time Sync**: Updating the LeetCode counter immediately reflects in Weekly Cumulative Targets and updates the Senior Mentor's live review sheet.

---

### 6. Mentor Reallocation & Cohort Transfer System
- **Bulk Cohort Transfer**: Transfer all or selected mentees from a departing faculty mentor to a target mentor in 1 click.
- **Departing Mentor Deactivation**: Automatically marks departing mentors as `INACTIVE`.
- **Individual Reassignments**: Quick 1-click reassignment directly from the Mentees directory table.
- **Audit Ledger**: Records an immutable `MENTOR_REALLOCATION` audit log with source/target mentors and administrative justifications.

---

### 7. Weekly Tasks & Evaluated Submissions (`Assign → Solve → Submit → Review`)
1. **Assignment**: Mentors, Trainers, or Admins publish weekly tasks targeting **All**, **Batch**, or **Individuals**.
2. **Problem Progress Notes**: Students record per-problem persistent solution notes (approach, time complexity $O(N)$, space complexity $O(1)$).
3. **Submission**: Mentees submit code and solutions, locking the submission during review.
4. **Evaluation**: Evaluators score solutions (1–10) with problem-level feedback:
   - **`APPROVED`**: Awards achievement points and updates cohort leaderboard.
   - **`RESUBMISSION_REQUIRED`**: Unlocks the submission for revisions based on mentor notes.

---

### 8. Weekly Mock Interviews (`Section → Session → Slot → Rubric Evaluation`)
1. **Mock Sections**: Created for specific interview rounds (DSA, System Design, HR & Behavioral).
2. **Slot Scheduling & Allocation**: Sessions scheduled with dates, room venues, and duration slots.
3. **Rubric Evaluation**: Evaluators grade students across 3 criteria:
   - **Technical Knowledge** (1–10)
   - **Communication & Articulation** (1–10)
   - **Problem Solving & Analytical Thinking** (1–10)
   - **Overall Recommendation**: `STRONGLY_RECOMMENDED`, `RECOMMENDED`, `RECOMMENDED_WITH_IMPROVEMENT`, or `NOT_RECOMMENDED_YET`.
4. **Audit Trail**: Slot cancellations and rescheduling logged in `MockSlotHistory`.

---

### 9. Confidential Grievance & Complaint Desk
Strict data isolation rules safeguard student privacy:

| Scenario | Mentee Visibility | Assigned Mentor Visibility | Administration Visibility |
| :--- | :---: | :---: | :---: |
| **Mentee files complaint to Mentor** | ✅ Full Access | ✅ Full Access | ❌ **Hidden** until escalated |
| **Mentee files complaint to Admin** | ✅ Full Access | ❌ **Strictly Hidden** | ✅ Full Access |
| **Mentor files grievance to Admin** | ❌ Hidden | ✅ Full Access | ✅ Full Access |
| **Mentee/Mentor Escalates Complaint** | ✅ Full Access | ✅ Full Access | ✅ **Revealed** with escalation audit reason |

- **Escalation Mechanism**: If unresolved, tickets can be escalated directly to administration with justification notes.
- **Threaded Communication**: Interactive follow-up messages with real-time status tracking (`PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`).

---

### 10. 1-on-1 Doubt Clearing & Guidance Sessions
- Mentees request personal doubt clearing on specific concepts, project guidance, or code debugging.
- Mentors schedule confirmed timeslots, **Google Meet / Zoom URLs** (online), or **Campus Venues** (offline).
- Conducted sessions are closed with mentor outcome takeaways.

---

### 11. High-Throughput Bulk Data Loader
- Import hundreds of student and mentor records from CSV or XLSX spreadsheets in seconds.
- Automatically generates institutional `<rollNumber>@sru.edu.in` identity schema.
- Pre-import preview detects format discrepancies, valid records, and duplicates.

---

## 👥 Role Permissions Matrix

| Feature / Module | Mentee | Mentor | Corporate Trainer | Administrator | Super Admin (`admin@sru.edu.in`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dual Theme Switcher** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Dashboard & KPIs** | Personal Stats | Assigned Mentees | Assigned Batch | Platform Metrics | Full System Metrics |
| **Weekly Tasks (Practice & Notes)**| Submit & Notes | Review & Rubrics | Assign & Review | Create & Publish | Create & Publish |
| **Weekly Targets (W1-W12)** | Track & Self-Report | Live Verify (Mentees) | Batch Audit & Custom | Batch Audit & Custom | Global Audit & Custom |
| **Profile Platform Counters** | Adjust (+/-) | View Mentees | View Batch | View All | View All |
| **Training Calendar** | View Syllabus | View Batch | Log Topics & Problems | Manage & Oversee | Manage & Oversee |
| **Daily Problems (POTD)** | Solve & Submit | View Problem | Publish & Track Code | Manage All | Manage All |
| **Weekly Mock Interviews** | View Slot & Report | Evaluate & Schedule | View Batch | Global Reports | Global Reports |
| **1-on-1 Doubt Sessions** | Request & Join | Schedule & Conduct | *N/A* | *Disabled for privacy* | *Disabled for privacy* |
| **Confidential Grievance Box** | Raise Ticket | Review Assigned | *N/A* | Resolve & Oversee | Resolve & Oversee |
| **Multicast Announcements** | Read & Acknowledge | Post to Mentees | Post to Batch | Post Platform-wide | Post Platform-wide |
| **Mentor Reallocation** | ❌ No | ❌ No | ❌ No | ✅ Full Access | ✅ Full Access |
| **Batch Management** | *Own batch* | Assigned Batch | Assigned Batch | Full Access | Full Access |
| **Administrator Delegation** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Exclusive Access |
| **Bulk Excel / CSV Loader** | ❌ No | ❌ No | ❌ No | ✅ Full Access | ✅ Full Access |
| **CSV & Analytics Export** | ❌ No | Mentees CSV | Batch CSV | Global Reports | Global Reports |

---

## 🗄️ Database Schema Highlights (Prisma)

- `User`: Institutional account with `Role` (`ADMIN`, `TRAINER`, `MENTOR`, `MENTEE`), account status (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
- `TrainerProfile` & `TrainerBatch`: Corporate trainer metadata and batch mappings.
- `CodingProfile`: Competitive platform profile URLs and live solved counters (`leetcodeSolved`, `codeforcesSolved`, `codechefSolved`, `hackerrankSolved`, `gfgSolved`).
- `WeeklyTargetVerification`: Stores Senior live verification (`verifiedCount`, `targetMet`, `notes`, `verifiedAt`, `verifierId`).
- `BatchWeeklyTarget`: Customized weekly problem targets and start dates per batch.
- `TrainingSession`: Syllabus dates, topics covered, and problems discussed.
- `DailyProblem` & `DailyProblemSubmission`: Company-tagged daily challenges with source code, complexities, and submission statuses.
- `Announcement` & `AnnouncementRead`: Multicast notices with audience targeting and read receipts.
- `MentorProfile` & `MenteeProfile`: Academic information (roll number, section, branch, faculty designation).
- `Batch`, `BatchMentor`, `BatchMentee`, `MentorMenteeAssignment`: Academic cohort and mentorship hierarchy.
- `Task`, `Problem`, `MenteeTask`, `TaskSubmission`, `TaskReview`: Problem sets, student notes, and mentor evaluations.
- `MockSection`, `MockSession`, `MockSlot`, `MockSlotHistory`: Mock interview management and 3-criteria scoring rubric.
- `Complaint`, `ComplaintMessage`: Privacy-scoped grievance tickets with escalation trail.
- `DoubtSession`: 1-on-1 personal mentorship session requests.
- `Notification` & `AuditLog`: User alerts and immutable administrative action ledger.

---

## 🔌 Key API Endpoints Reference

All routes are prefixed with `/api/v1` and authenticated using JWT Bearer headers:

### Weekly Cumulative Targets & Counters (`/api/v1/weekly-targets`)
- `GET /schedule`: Get 12-week schedule with active week and student verification records.
- `GET /student/:studentId`: Retrieve specific student's verification records across W1–W12.
- `GET /batch/:batchId/audit?weekNo=...`: (Mentor/Trainer/Admin) Senior audit sheet (strictly scoped to assigned mentees for Mentors).
- `POST /verify`: (Mentor/Trainer/Admin) Confirm and save senior live verification with strict target check.
- `PATCH /batch/:batchId/custom`: (Trainer/Admin) Customize weekly target counts for a batch.
- `PATCH /counters`: Increment, decrement, or set platform solved problem counters with live target sync.

### Training Calendar & POTD (`/api/v1/trainer`)
- `GET /calendar`: Fetch scheduled training dates and syllabus logs.
- `POST /sessions`: Log topics taught and problems discussed for a training date.
- `GET /daily-problems`: Fetch published company daily problems.
- `POST /daily-problems`: Publish new company-tagged coding challenge.
- `POST /daily-problems/:id/submit`: (Mentee) Submit daily problem solution with code and complexity.
- `GET /daily-problems/:id/submissions`: (Trainer/Admin) Inspect student submissions and source code.

### Hierarchical Announcements (`/api/v1/announcements`)
- `GET /`: Retrieve announcements with audience filtering and superior auto-CC visibility.
- `POST /`: Post targeted announcement (`ALL`, `BATCH`, `MENTOR_GROUP`, `INDIVIDUAL`).
- `POST /:id/read`: Mark announcement as read.

### Authentication (`/api/v1/auth`)
- `POST /login`: Authenticate with institutional email/roll number and password.
- `GET /me`: Fetch authenticated user profile, permissions, and `isSuperAdmin` flag.
- `POST /logout`: Clear session cookies.

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
# Install server dependencies and synchronize Prisma schema
cd server
npm install
npx prisma db push
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

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001`
- **API Health Check**: `http://localhost:5001/api/health`

---

## 🔐 Default Access & Sample Credentials

All registered accounts use their institutional email address:

| Persona | Sample Login Email / ID | Default Password | Role Access |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@sru.edu.in` | `Password@123` | Platform Admin + Admin Management |
| **Corporate Trainer (Batch 1)** | `trainer.b1@sru.edu.in` | `Password@123` | Batch 1 Calendar, POTD, Batch Audit |
| **Corporate Trainer (Batch 2)** | `trainer.b2@sru.edu.in` | `Password@123` | Batch 2 Calendar, POTD, Batch Audit |
| **Faculty Lead / Mentor** | `2303a51812@sru.edu.in` | `Password@123` | Mentor Dashboard, Review Queue & Live Audit |
| **Student Mentee** | `2403a51015@sru.edu.in` | `Password@123` | Mentee Tasks, POTD, Targets, Counters |

---

## 🧪 Testing & Verification

```bash
# Validate client production bundle and Tailwind compilation:
cd client
npm run build

# Run server syntax and integration checks:
cd ../server
node --check src/controllers/weeklyTargetController.js
node --check src/controllers/trainerController.js
```

---

## 📄 License
Developed for SR University by Palakurthi Lalith Prakash. All rights reserved. Built with modern full-stack best practices for scalable academic training.
