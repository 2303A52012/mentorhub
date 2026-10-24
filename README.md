# SRU MentorHub — Enterprise Mentorship, Training & Evaluation Platform

> **SR University (SRU) · School of Computer Science & Artificial Intelligence**  
> Full-Stack Technical Mentorship Ecosystem for Competitive Programming, Placement Preparation, Corporate Training, Live Target Verification, Mock Interviews & Confidential Student Grievance Resolution.

---

## 📌 Table of Contents
1. [Platform Overview & Executive Summary](#-platform-overview--executive-summary)
2. [Dual Theme Design System & UX Standards](#-dual-theme-design-system--ux-standards)
3. [System Architecture & Technology Stack](#-system-architecture--technology-stack)
4. [Identity, Authentication & RBAC Hierarchy](#-identity-authentication--rbac-hierarchy)
5. [In-Depth Feature Modules](#-in-depth-feature-modules)
   - [Pillar 1: Corporate Trainer Portal & Batch Scope](#1-corporate-trainer-portal--batch-scope)
   - [Pillar 2: Hierarchical Multicast Announcements](#2-hierarchical-multicast-announcements)
   - [Pillar 3: Training Calendar & Company POTD](#3-training-calendar--company-potd)
   - [Pillar 4: Weekly Cumulative Targets (W1–W12) & Live Senior Verification Engine](#4-weekly-cumulative-targets-w1w12--live-senior-verification-engine)
   - [Platform Solved Counters with Real-Time Target Sync](#5-platform-solved-counters-with-real-time-target-sync)
   - [Weekly Coding Tasks & Algorithmic Notes](#6-weekly-coding-tasks--algorithmic-notes)
   - [Weekly Mock Interviews & 3-Criteria Scoring Rubric](#7-weekly-mock-interviews--3-criteria-scoring-rubric)
   - [Mentor Reallocation & Cohort Transfer Engine](#8-mentor-reallocation--cohort-transfer-engine)
   - [Confidential Grievance & Student Support Desk](#9-confidential-grievance--student-support-desk)
   - [1-on-1 Personal Doubt Clearing Sessions](#10-1-on-1-personal-doubt-clearing-sessions)
   - [High-Throughput Bulk Data Import (Excel/CSV)](#11-high-throughput-bulk-data-import-excelcsv)
   - [Gamified Achievements & Cohort Leaderboard](#12-gamified-achievements--cohort-leaderboard)
6. [Role Permissions Matrix](#-role-permissions-matrix)
7. [Database Schema Architecture (Prisma ORM)](#-database-schema-architecture-prisma-orm)
8. [RESTful API Reference](#-restful-api-reference)
9. [Local Development & Deployment Guide](#-local-development--deployment-guide)
10. [Default Institutional Credentials](#-default-institutional-credentials)
11. [Verification & Health Checks](#-verification--health-checks)

---

## 🌟 Platform Overview & Executive Summary

**SRU MentorHub** is a production-grade academic management ecosystem deployed at SR University to supervise competitive coding progress, interview readiness, and student wellbeing. 

The platform replaces fragmented spreadsheets and ad-hoc communication with:
- **Batch-Scoped Corporate Training**: Dedicated cohort directors oversee syllabus coverage, training calendar dates, and daily problems of the day (POTD).
- **Senior Live Verification Engine**: Strictly verifies problem claims during 1-on-1 review syncs against a 12-week cumulative target schedule (W1–W12).
- **Competitive Profile Counters**: Live counters for LeetCode, CodeChef, Codeforces, HackerRank, and GeeksforGeeks with automatic target synchronization.
- **Structured Rubric Evaluations**: Comprehensive 3-criteria grading for mock technical and behavioral interviews.
- **Confidential Grievance System**: Conflict-of-interest-free support tickets with one-click administrative escalation.
- **Seamless Mentor Reallocation**: Immediate single and cohort transfers with automated departing mentor deactivation.

---

## 🎨 Dual Theme Design System & UX Standards

MentorHub delivers an ultra-modern, distraction-free visual experience across all 45+ views:

- **Dual-Mode System**:
  - **Light Theme**: High-contrast slate canvas (`#f8fafc`), crisp borders (`#e2e8f0`), deep indigo accents, and subtle elevation shadows.
  - **Dark Theme**: Deep obsidian / slate-950 canvas (`#0b0f19`), frosted glass panels (`backdrop-blur-md`), and vibrant neon-indigo, amber, and emerald highlights.
- **State Persistence**: Instant toggle stored in `localStorage` with zero flicker on initial page load.
- **Responsive Layout**: Fluid desktop sidebar with collapsible mobile drawer, sticky action headers, and horizontal scroll tables.
- **Micro-Interactions**: Smooth CSS transitions, animated badge states, inline counter spinners, and toast alerts via `ModalContext`.

---

## 🏛️ System Architecture & Technology Stack

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (React 19 + Vite)                       │
│    Tailwind CSS · Lucide Icons · Recharts · Dual Theme · RBAC Route Guards   │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTPS / JSON REST API (/api/v1)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         API SERVER LAYER (Express.js)                        │
│    JWT Auth · Cookie Parser · Multer · XLSX Stream · Prisma Client Engine    │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ PgBouncer Connection Pool (:6543)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       PERSISTENCE LAYER (PostgreSQL Cloud)                   │
│   Users · Batches · Targets · Verifications · Sessions · Tasks · Reviews    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Core Technologies
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Recharts, Axios with Bearer authorization interceptors.
- **Backend**: Node.js (ES Modules), Express.js, JWT (`jsonwebtoken`), bcryptjs, Multer, XLSX parsing, Morgan logging.
- **Database**: PostgreSQL (hosted on Supabase) accessed via **Prisma ORM (v6)**.
  - Port `6543`: PgBouncer transaction-mode connection pool for production scalability.
  - Port `5432`: Direct database connection for schema migrations (`prisma db push`).

---

## 🔐 Identity, Authentication & RBAC Hierarchy

All university member identities follow the standardized SRU institutional email format:

| Role | Institutional Email Format | Scope of Authority |
| :--- | :--- | :--- |
| **Super Administrator** | `admin@sru.edu.in` | Global system authority; exclusively appoints and manages delegated platform administrators. |
| **Administrator** | `admin.{name}@sru.edu.in` | Manages batches, mentors, mentees, global audit sheets, reports, and complaints. |
| **Corporate Trainer** | `trainer.{batch}@sru.edu.in` (e.g. `trainer.g6-b1@sru.edu.in`) | Batch director for a specific cohort (G6-B1, G6-B2, G6-B3, G6-B4); manages calendar, POTD, batch tasks, and pacing adjustments. |
| **Faculty Mentor** | `<facultyRoll>@sru.edu.in` | Mentors ~10–12 assigned students; conducts mock evaluations, 1-on-1 doubt sessions, and weekly live target verifications. |
| **Student Mentee** | `<studentRoll>@sru.edu.in` | Solves weekly tasks, POTD challenges, reports platform solved counts, attends mocks, and tracks W1–W12 target badges. |

### Security Measures
- **Password Protection**: Hashed using `bcryptjs` with salt rounds = 10.
- **Token Security**: Signed JWT tokens stored in HTTP-only cookies and supported via `Authorization: Bearer <token>`.
- **Account Status Enforcer**: Accounts marked `INACTIVE` or `SUSPENDED` are immediately locked out at the authentication middleware.
- **Self-Service & Admin Password Reset**: Students can submit password reset tickets, and mentors/admins can trigger immediate password resets directly from user profiles.

---

## 🚀 In-Depth Feature Modules

---

### 1. Corporate Trainer Portal & Batch Scope
- **Batch Cohort Directors**: Dedicated trainers manage each designated student batch:
  - `G6-B1`: **Prof. Rajesh Sharma** (`trainer.g6-b1@sru.edu.in`)
  - `G6-B2`: **Prof. Sneha Kulkarni** (`trainer.g6-b2@sru.edu.in`)
  - `G6-B3`: **Prof. Vikram Rao** (`trainer.g6-b3@sru.edu.in`)
  - `G6-B4`: **Dr. Ananya Roy** (`trainer.g6-b4@sru.edu.in`)
- **Batch Isolation**: Trainers exclusively access students, mentors, and submissions belonging to their assigned batch.
- **Batch Task Assignments**: Post assignments targeted to the entire cohort or custom student subsets.
- **Batch Profile Management**: Dedicated trainer profile pages display assigned batches, cabin venues, and specialization.

---

### 2. Hierarchical Multicast Announcements
- **Audience Targeting Engine**:
  - `ALL`: Broadcast to every user across the university.
  - `BATCH`: Target an entire cohort batch (e.g. G6-B1).
  - `MENTOR_GROUP`: Target a specific mentor's assigned mentee group.
  - `INDIVIDUAL`: Target custom selected user IDs.
- **Superior Auto-CC Visibility Rule**:
  - Whenever an announcement targets **Students**, their assigned **Mentor** and batch **Trainer** automatically receive visibility.
  - Platform Administrators maintain global audit visibility across all announcements.
- **Engagement Tracking**: Individual read receipts recorded in `AnnouncementRead` with read timestamps.

---

### 3. Training Calendar & Company POTD
- **Official Training Date Schedules**:
  - Pre-seeded institutional training days across September, October, and November 2026.
  - Date-picker and batch dropdown allow switching cohorts to view topics covered, problems solved, and session notes.
- **Company Daily Problem of the Day (POTD)**:
  - Trainers publish company-tagged coding problems (Amazon, Google, Microsoft, Meta).
  - **Platform Auto-Detection**: Pasting links automatically maps domains to database enums (`LEETCODE`, `CODECHEF`, `CODEFORCES`, `HACKERRANK`, `CUSTOM`).
  - **Student Submissions**: Mentees write or paste solutions with language selection (C++, Java, Python, JavaScript), algorithmic complexities ($O(N)$ time / $O(1)$ space), and approach notes.
  - **Submission Inspection Drawer**: Trainers view live submission status (Completed vs Pending) and inspect student code with 1-click clipboard copying.

---

### 4. Weekly Cumulative Targets (W1–W12) & Live Senior Verification Engine
Ensures that LeetCode metrics reflect verified problem-solving ability rather than unverified profile claims.

#### Target Schedule (Starting 05 Oct 2026)
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

#### Verification Rules & Workflow
1. **Strict Target Rule**:
   $$\text{Target Met} \iff \text{Mentor Verified Count} \ge \text{Week Cumulative Target}$$
2. **Unverified Solves Policy**: Self-reported submissions or profile counters never satisfy the target without Senior live verification.
3. **Mentor Scoping**: Mentors strictly see their assigned mentees (~10–12 students) on the audit sheet, preventing cohort data overflow.
4. **Live Verification Procedure**:
   - Senior Mentor opens the mentee's audit sheet during the weekly 1-on-1 sync.
   - Senior inspects solution authenticity and tests problem understanding.
   - Senior enters the verified count, optional review notes, and clicks **"Confirm & Save Verification"**.
   - System timestamps the verification, records the Senior's ID, and updates the student's **Target Met** badge.
5. **Batch Pacing Customization**: Trainers and Admins can customize target problem counts per batch for accelerated or foundational pacing.

---

### 5. Platform Solved Counters with Real-Time Target Sync
- Interactive solved problem counter blocks embedded directly in student profiles:
  - **LeetCode** *(Live Synced with Weekly Cumulative Targets)*
  - **Codeforces**
  - **CodeChef**
  - **HackerRank**
  - **GeeksforGeeks**
- **Adjustment Modes**:
  - `+` (Increment by 1)
  - `-` (Decrement by 1, floor at 0)
  - `Custom` (Quick add `+1`, `+5`, `+10`, `+20` or set exact count)
- **Automatic Target Synchronization**: Updating the LeetCode counter immediately updates the student's self-reported count across the platform and reflects on the Senior Mentor's live audit sheet.

---

### 6. Weekly Coding Tasks & Algorithmic Notes
1. **Creation**: Mentors, Trainers, or Admins configure weekly problem sets with instructions, target audience, and external coding links.
2. **Persistent Notes**: Students save draft solution notes per problem (approach, complexity, edge cases) as they practice.
3. **Submission Snapshot**: When finalized, the student submits code and notes, locking the submission for evaluation.
4. **Grading & Rubrics**:
   - `APPROVED`: Confirms mastery, awards points, and updates cohort rank.
   - `RESUBMISSION_REQUIRED`: Returns the task to the mentee with mentor feedback for revisions.

---

### 7. Weekly Mock Interviews & 3-Criteria Scoring Rubric
1. **Mock Sections**: Created for specific interview rounds (Technical DSA, System Architecture, Behavioral & HR).
2. **Slot Allocations**: Evaluators, room venues/meeting links, dates, and timeslot durations configured per student.
3. **Evaluation Rubric**: Evaluators score students on 10-point scales across 3 pillars:
   - **Technical Knowledge** (1–10)
   - **Communication & Articulation** (1–10)
   - **Problem Solving & Analytical Thinking** (1–10)
   - **Recommendation Level**: `STRONGLY_RECOMMENDED`, `RECOMMENDED`, `RECOMMENDED_WITH_IMPROVEMENT`, `NOT_RECOMMENDED_YET`.
4. **Audit History**: All slot changes and rescheduling recorded in `MockSlotHistory`.

---

### 8. Mentor Reallocation & Cohort Transfer Engine
Designed for operational continuity during faculty transitions or workload rebalancing:
1. **Bulk Cohort Transfer**: Select a source mentor, review their mentee roster, toggle individual students or click **"Select All"**, and transfer to a target mentor.
2. **Departing Mentor Deactivation**: Optional checkbox automatically marks departing faculty as `INACTIVE`, terminating session tokens.
3. **Single Mentee Reassignment**: Instant 1-click reassignment directly from the Mentees directory table.
4. **Audit Ledger**: Generates an immutable `MENTOR_REALLOCATION` audit record detailing source, destination, students, and admin rationale.

---

### 9. Confidential Grievance & Student Support Desk
Strict data isolation rules protect student privacy and avoid conflicts of interest:

| Ticket Type | Mentee Visibility | Assigned Mentor Visibility | Administrator Visibility |
| :--- | :---: | :---: | :---: |
| **Mentee $\rightarrow$ Mentor** | ✅ Full Access | ✅ Full Access | ❌ **Hidden** until escalated |
| **Mentee $\rightarrow$ Admin** | ✅ Full Access | ❌ **Strictly Hidden** | ✅ Full Access |
| **Mentor $\rightarrow$ Admin** | ❌ Hidden | ✅ Full Access | ✅ Full Access |
| **Escalated Ticket** | ✅ Full Access | ✅ Full Access | ✅ **Revealed** with escalation audit trail |

- **Escalation Trigger**: If unresolved, either party can escalate to Administration with an explanation.
- **Threaded Communication**: Real-time replies, status progression (`PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`), and outcome notes.

---

### 10. 1-on-1 Personal Doubt Clearing Sessions
- Direct, confidential student-mentor consultation desk (disabled on the Admin side to preserve academic confidentiality).
- Students submit session requests specifying topics, detailed questions, and mode preference (**Online Google Meet** or **In-Person Cabin**).
- Mentors accept, assign meeting links or room venues, and log completion takeaways.

---

### 11. High-Throughput Bulk Data Import (Excel/CSV)
- Administrators upload `.xlsx` or `.csv` spreadsheets to provision hundreds of users in seconds.
- **Header Normalization**: Auto-maps roll numbers, names, departments, sections, and emails.
- **Identity Synthesis**: Transforms IDs directly into official `<rollNumber>@sru.edu.in` accounts.
- **Dry-Run Preview**: Detects duplicate emails, invalid formats, and missing fields before persisting.
- **Import Modes**: Supports `CREATE_NEW`, `UPDATE_EXISTING`, and `UPSERT`.

---

### 12. Gamified Achievements & Cohort Leaderboard
- Badges awarded for milestones: Task completion streaks, mock interview excellence, and target achievements.
- Real-time leaderboard displays student standing within batches.

---

## 👥 Role Permissions Matrix

| Feature / Module | Mentee | Mentor | Corporate Trainer | Administrator | Super Admin (`admin@sru.edu.in`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dual Theme Switcher** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Personalized Dashboard** | Personal Stats | Assigned Mentees | Assigned Batch | Platform Metrics | Full System Metrics |
| **Weekly Targets (W1-W12)** | Track & Self-Report | Live Verify (Mentees) | Batch Audit & Custom | Batch Audit & Custom | Global Audit & Custom |
| **Profile Platform Counters** | Adjust (+/-) | View Mentees | View Batch | View All | View All |
| **Training Calendar** | View Syllabus | View Batch | Log Topics & Problems | Manage & Oversee | Manage & Oversee |
| **Daily Problems (POTD)** | Solve & Submit | View Problem | Publish & Track Code | Manage All | Manage All |
| **Weekly Tasks (Practice & Notes)**| Submit & Notes | Review & Rubrics | Assign & Review | Create & Publish | Create & Publish |
| **Weekly Mock Interviews** | View Slot & Report | Evaluate & Schedule | View Batch | Global Reports | Global Reports |
| **1-on-1 Doubt Sessions** | Request & Join | Schedule & Conduct | *N/A* | *Disabled for privacy* | *Disabled for privacy* |
| **Confidential Grievance Box** | Raise Ticket | Review Assigned | *N/A* | Resolve & Oversee | Resolve & Oversee |
| **Multicast Announcements** | Read & Acknowledge | Post to Mentees | Post to Batch | Post Platform-wide | Post Platform-wide |
| **Mentor Reallocation** | ❌ No | ❌ No | ❌ No | ✅ Full Access | ✅ Full Access |
| **Administrator Delegation** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Exclusive Access |
| **Bulk Excel / CSV Loader** | ❌ No | ❌ No | ❌ No | ✅ Full Access | ✅ Full Access |
| **CSV & Analytics Export** | ❌ No | Mentees CSV | Batch CSV | Global Reports | Global Reports |

---

## 🗄️ Database Schema Architecture (Prisma ORM)

```prisma
// Core Identity
model User {
  id                 String         @id @default(uuid())
  name               String
  email              String         @unique
  passwordHash       String
  role               Role           @default(MENTEE) // ADMIN, TRAINER, MENTOR, MENTEE
  accountStatus      AccountStatus  @default(ACTIVE) // ACTIVE, INACTIVE, SUSPENDED
  mustChangePassword Boolean        @default(false)
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt

  mentorProfile      MentorProfile?
  menteeProfile      MenteeProfile?
  trainerProfile     TrainerProfile?
  codingProfile      CodingProfile?
  ...
}

// Competitive Programming Counters
model CodingProfile {
  id               String   @id @default(uuid())
  menteeId         String   @unique
  mentee           User     @relation(fields: [menteeId], references: [id], onDelete: Cascade)
  leetcodeUrl      String   @default("")
  codeforcesUrl    String   @default("")
  codechefUrl      String   @default("")
  hackerrankUrl    String   @default("")
  gfgUrl           String   @default("")
  resumeUrl        String   @default("")
  leetcodeSolved   Int      @default(0) // Live synced to Weekly Targets
  codeforcesSolved Int      @default(0)
  codechefSolved   Int      @default(0)
  hackerrankSolved Int      @default(0)
  gfgSolved        Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

// Weekly Cumulative Targets & Verifications
model WeeklyTargetVerification {
  id            String   @id @default(uuid())
  menteeId      String
  mentee        User     @relation("MenteeVerifications", fields: [menteeId], references: [id], onDelete: Cascade)
  verifierId    String
  verifier      User     @relation("VerifierVerifications", fields: [verifierId], references: [id], onDelete: Cascade)
  weekNo        Int
  verifiedCount Int      @default(0)
  targetMet     Boolean  @default(false)
  verified      Boolean  @default(false)
  notes         String   @default("")
  verifiedAt    DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([menteeId, weekNo])
}

model BatchWeeklyTarget {
  id          String   @id @default(uuid())
  batchId     String
  batch       Batch    @relation(fields: [batchId], references: [id], onDelete: Cascade)
  weekNo      Int
  startDate   DateTime
  targetCount Int      @default(98)
  requirement String   @default("Senior Live Review Required")

  @@unique([batchId, weekNo])
}

// Training Calendar & POTD
model TrainingSession {
  id             String   @id @default(uuid())
  batchId        String
  batch          Batch    @relation("BatchTrainingSessions", fields: [batchId], references: [id], onDelete: Cascade)
  trainerId      String
  date           DateTime
  topicsTaught   String[] @default([])
  problemsSolved String[] @default([])
  notes          String   @default("")
}

model DailyProblem {
  id          String   @id @default(uuid())
  batchId     String
  batch       Batch    @relation("BatchDailyProblems", fields: [batchId], references: [id], onDelete: Cascade)
  postedById  String
  title       String
  description String
  company     String   @default("")
  difficulty  String   @default("MEDIUM")
  platform    Platform @default(CUSTOM) // LEETCODE, CODECHEF, CODEFORCES, HACKERRANK, CUSTOM
  link        String   @default("")
  submissions DailyProblemSubmission[]
}

model DailyProblemSubmission {
  id              String       @id @default(uuid())
  dailyProblemId  String
  dailyProblem    DailyProblem @relation(fields: [dailyProblemId], references: [id], onDelete: Cascade)
  studentId       String
  student         User         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  status          String       @default("COMPLETED")
  sourceCode      String       @default("")
  language        String       @default("cpp")
  timeComplexity  String       @default("")
  spaceComplexity String       @default("")
  approach        String       @default("")
  submittedAt     DateTime     @default(now())

  @@unique([dailyProblemId, studentId])
}
```

---

## 🔌 RESTful API Reference

All endpoints are mounted under `/api/v1` and protected with JWT Bearer authentication:

### 1. Weekly Cumulative Targets & Counters (`/api/v1/weekly-targets`)
- `GET /schedule`: Get 12-week schedule with active week and student verification records.
- `GET /student/:studentId`: Retrieve student's target status and verification history across W1–W12.
- `GET /batch/:batchId/audit?weekNo=...`: (Mentor/Trainer/Admin) Senior audit sheet (strictly scoped to assigned mentees for Mentors).
- `POST /verify`: (Mentor/Trainer/Admin) Confirm and save senior live verification.
- `PATCH /batch/:batchId/custom`: (Trainer/Admin) Customize weekly target problem counts for a batch.
- `PATCH /counters`: Increment, decrement, or set platform solved counters with live target sync.

### 2. Trainer Portal & Daily Problems (`/api/v1/trainer`)
- `GET /calendar`: Fetch scheduled training dates and syllabus logs.
- `POST /sessions`: Log topics taught and problems discussed for a training date.
- `GET /daily-problems`: Fetch published company daily problems.
- `POST /daily-problems`: Publish new company-tagged coding challenge.
- `POST /daily-problems/:id/submit`: (Mentee) Submit daily problem solution with code and complexity.
- `GET /daily-problems/:id/submissions`: (Trainer/Admin) Inspect student submissions and source code.
- `GET /profile`: Retrieve trainer profile and assigned batches.
- `PATCH /profile`: Update trainer profile details.

### 3. Hierarchical Announcements (`/api/v1/announcements`)
- `GET /`: Retrieve announcements with audience filtering and superior auto-CC visibility.
- `POST /`: Post targeted announcement (`ALL`, `BATCH`, `MENTOR_GROUP`, `INDIVIDUAL`).
- `POST /:id/read`: Mark announcement as read.

### 4. Authentication & Security (`/api/v1/auth`)
- `POST /login`: Authenticate with roll number or institutional email.
- `GET /me`: Fetch authenticated user profile, permissions, and `isSuperAdmin` flag.
- `POST /logout`: Terminate session and clear cookies.
- `POST /reset-request`: Submit a self-service password reset request.
- `GET /reset-requests`: (Admin) View and approve student password reset tickets.

### 5. Mentor Reallocation (`/api/v1`)
- `POST /reallocate-mentor`: Bulk transfer students from source to destination mentor.
- `POST /mentees/:id/mentors`: Reassign an individual student to a new mentor.
- `GET /mentees?mentorId=...`: Filter mentees list by assigned mentor.

### 6. Tasks & Evaluations (`/api/v1/tasks`, `/api/v1/mentee`, `/api/v1/mentor`)
- `GET /tasks`: List published weekly tasks.
- `POST /tasks`: (Mentor/Trainer/Admin) Create a new weekly coding task.
- `GET /mentee/tasks/:taskId`: Fetch mentee problem notes and submission status.
- `POST /mentee/tasks/:taskId/notes`: Save draft problem notes.
- `POST /mentee/tasks/:taskId/submit`: Finalize and submit task version.
- `GET /mentor/task-reviews`: View pending mentee submission queue.
- `POST /mentor/task-reviews/:submissionId`: Submit review decision (`APPROVED` or `RESUBMISSION_REQUIRED`).

### 7. Mock Interviews (`/api/v1`)
- `GET /mentor/mocks`: List mock sections and summary statistics.
- `POST /mentor/mocks`: Create new mock interview section.
- `POST /mentor/mocks/:id/slots`: Assign mentee to evaluator, date, time, and room.
- `POST /mentor/mocks/slots/:slotId/evaluate`: Record rubric evaluation (Technical, Communication, Problem Solving).
- `GET /mentee/mocks`: Mentee's upcoming scheduled mock slots and past evaluation reports.

### 8. Grievances & Support (`/api/v1/complaints`)
- `GET /complaints`: List complaints scoped to user role and privacy filters.
- `POST /complaints`: Submit a grievance (choose Mentor vs. Admin target).
- `GET /complaints/:id`: Retrieve complaint details and conversation history.
- `POST /complaints/:id/messages`: Post a reply in the discussion thread.
- `POST /complaints/:id/forward`: Escalate a mentor-level complaint to administration.
- `PATCH /complaints/:id/status`: Update status (`IN_REVIEW`, `RESOLVED`, `REJECTED`).

### 9. 1-on-1 Doubt Sessions (`/api/v1/doubt-sessions`)
- `GET /doubt-sessions`: List sessions for mentee or mentor.
- `POST /doubt-sessions`: Mentee requests 1-on-1 doubt clearing session.
- `POST /doubt-sessions/:id/schedule`: Mentor assigns timeslot, Google Meet URL, or venue.
- `POST /doubt-sessions/:id/complete`: Mentor marks session completed with outcome notes.
- `POST /doubt-sessions/:id/cancel`: Cancel or decline request with reason.

### 10. Bulk Import & Reports (`/api/v1/bulk-import`, `/api/v1/reports`)
- `POST /bulk-import/preview`: Parse and validate uploaded Excel/CSV file.
- `POST /bulk-import/execute`: Execute bulk user creation or update.
- `GET /reports/tasks/csv`: Export weekly tasks completion report.
- `GET /reports/mentees/csv`: Export student performance and coding profile stats.
- `GET /reports/mocks/csv`: Export mock interview scores and evaluations.

---

## 🛠️ Local Development & Deployment Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- Active PostgreSQL database or Supabase project

### 1. Clone Repository
```bash
git clone https://github.com/2303A52012/mentorhub.git
cd mentorhub
```

### 2. Configure Environment Variables

**Server Configuration (`server/.env`):**
```env
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="mentorhub_jwt_super_secret_production_key_2026"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

**Client Configuration (`client/.env` - optional):**
```env
VITE_API_URL="/api/v1"
```

### 3. Install Dependencies & Synchronize Database
```bash
# Server setup
cd server
npm install
npx prisma db push
npx prisma generate

# Client setup
cd ../client
npm install
```

### 4. Start Development Servers
Run backend and frontend in separate terminals:
```bash
# Terminal 1 - Backend API:
cd server
npm run dev

# Terminal 2 - Frontend Client:
cd client
npm run dev
```

- **Client Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001`
- **Health Endpoint**: `http://localhost:5001/api/health`

---

## 🔑 Default Institutional Credentials

| Persona | Full Name / Identity | Institutional Email | Default Password | Scope / Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Super Administrator** | Sunil Reddy | `admin@sru.edu.in` | `Password@123` | Global Platform & Admin Delegation Authority |
| **Corporate Trainer (Batch 1)** | Prof. Rajesh Sharma | `trainer.g6-b1@sru.edu.in` | `Password@123` | G6-B1 Calendar, POTD, Batch Audit & Tasks |
| **Corporate Trainer (Batch 2)** | Prof. Sneha Kulkarni | `trainer.g6-b2@sru.edu.in` | `Password@123` | G6-B2 Calendar, POTD, Batch Audit & Tasks |
| **Corporate Trainer (Batch 3)** | Prof. Vikram Rao | `trainer.g6-b3@sru.edu.in` | `Password@123` | G6-B3 Calendar, POTD, Batch Audit & Tasks |
| **Corporate Trainer (Batch 4)** | Dr. Ananya Roy | `trainer.g6-b4@sru.edu.in` | `Password@123` | G6-B4 Calendar, POTD, Batch Audit & Tasks |
| **Student Mentee (Sample)** | Student (Sample) | `2403a51015@sru.edu.in` | `Password@123` | Mentee Dashboard, POTD, Targets, Platform Counters |
| **Student Mentee (Sample)** | Kankanala Rishikesh Reddy | `2403a52353@sru.edu.in` | `Password@123` | Mentee Dashboard, POTD, Targets, Platform Counters |

---

## 🧪 Verification & Health Checks

```bash
# Validate frontend compilation & Tailwind CSS bundle:
cd client
npm run build

# Verify backend syntax & route controllers:
cd ../server
node --check src/controllers/weeklyTargetController.js
node --check src/controllers/trainerController.js
node --check src/controllers/userController.js
```

---

## 📄 License & Attribution
Developed for **SR University** by **Palakurthi Lalith Prakash**. All rights reserved. Engineered for institutional scalability, secure student mentorship, and placement excellence.
