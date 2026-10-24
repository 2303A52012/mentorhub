# MentorHub — Remediation & Bug Fix Log

**Date:** October 24, 2026  
**Auditor:** Full-Stack Security & Software Engineer  
**Scope:** Remediation of all confirmed security, logic, reliability, configuration, and test infrastructure issues across Phase 1 and Phase 2.

---

## 1. Summary of Changes

| Issue ID | File(s) Modified | Type of Change | Rationale |
| :--- | :--- | :--- | :--- |
| **SEC-001** | `server/src/controllers/complaintController.js` | Security / Access Control | Added ownership & role checks in `getComplaintById` and `createComplaint` to prevent grievance data leakage. |
| **SEC-002** | `server/src/app.js` | Security / Headers | Added HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `X-XSS-Protection`) and restricted CORS in production. |
| **SEC-003** | `server/src/config/env.js` | Secrets & Configuration | Removed hardcoded Supabase plaintext password and enforced fail-fast validation in production mode. |
| **SEC-004** | `server/src/controllers/weeklyTargetController.js` | Security / IDOR | Scoped `updateCodingCounters` verification to assigned mentees for Mentors and assigned batches for Trainers. |
| **SEC-005** | `server/src/routes/userRoutes.js`, `server/src/middleware/roleMiddleware.js` | Access Control | Updated `checkMentorMenteeAccess` middleware to support `TRAINER` batch membership and hooked into `GET /mentees/:id`. |
| **SEC-006** | `server/src/controllers/authController.js` | Authentication / Bypass | Removed multi-fallback default password trial loop that permitted logging into accounts with arbitrary default passwords. |
| **SEC-007** | `server/src/server.js`, `server/src/config/env.js` | Secrets & Logging | Removed master admin plaintext password logging; added `ADMIN_PASSWORD` and `ADMIN_EMAIL` to environment configuration. |
| **SEC-008** | `server/src/controllers/taskController.js` | Authorization / IDOR | Restricted task update, deadline extension, and recipient assignment to creator or admin; scoped recipients to mentor's mentees or trainer's batches. |
| **SEC-009** | `server/src/controllers/taskController.js`, `server/src/controllers/menteeTaskController.js` | Authorization / Privacy | Scoped task progress metrics to creator/admin, and restricted mentee task detail retrieval to the assigned mentee or authorized mentor/trainer. |
| **SEC-010** | `server/src/controllers/reviewController.js` | Authorization / Review | Added mentor mentee assignment check and trainer batch validation to task review inspection and evaluation submission. |
| **SEC-011** | `server/src/controllers/trainerController.js` | Authorization / POTD | Enforced batch membership check in `getDailyProblemById` to prevent cross-batch POTD and problem solution access. |
| **SEC-012** | `server/src/app.js` | Defense-in-Depth / Headers | Added `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy` headers; configured CORS error handler to return HTTP 403. |
| **BUG-001** | `server/src/controllers/authController.js` | Business Logic | Added explicit `TRAINER` branch in `forgotPassword` handler to prevent unhandled state for corporate trainers. |
| **BUG-002** | `server/src/routes/reportRoutes.js`, `server/src/controllers/reportController.js` | Authorization & Reporting | Added `TRAINER` to report routes and scoped mentee/mock reports to trainer's assigned batches. |
| **BUG-003** | `server/src/app.js` | Reliability & Monitoring | Upgraded `/api/health` to perform active PostgreSQL database query (`SELECT 1`) via Prisma with HTTP 503 fallback. |
| **BUG-004** | `server/test-weekly-mocks.js` | Test Infrastructure | Replaced static past date `2026-10-20` with dynamic future date offset (`today + 2 days`) to preserve upcoming partition. |
| **BUG-005** | `server/test-bulk-import.js` | Test Infrastructure | Updated obsolete mentor email `mentor.alan@sru.edu.in` to active SRU mentor `2303a51812@sru.edu.in`. |
| **BUG-006** | `server/package.json` | Dev Tooling | Scoped `node --watch` with `--watch-path=src` to eliminate mid-test server restarts. |
| **BUG-007** | `server/src/controllers/taskController.js`, `server/src/routes/weeklyTargetRoutes.js` | API Contracts | Sanitized `CUSTOM` targetType to `SELECTED` to conform to Prisma enum; supported `PUT` on `/weekly-targets/counters`. |
| **PROD-001** | `server/src/server.js` | Reliability & Shutdown | Added basic signal handling for SIGTERM and SIGINT to close server. |
| **PROD-002** | `server/src/server.js`, `server/src/middleware/errorMiddleware.js` | Reliability & Hardening | Enhanced graceful shutdown with Prisma disconnect and 10s watchdog timeout; masked HTTP 500 error messages in production. |
| **TEST-001** | `server/package.json` | Tooling & Automation | Added `test:mocks` and `test:bulk` scripts to `package.json`. |
| **TEST-002** | `server/test-security-regression.js`, `server/package.json` | Test Automation | Created comprehensive 26-assertion security regression test suite; added `test:security` and unified `npm test`. |
| **PERF-001** | `client/vite.config.js` | Performance & Build | Added Vite 8 / Rolldown `manualChunks` function to partition React, Recharts, and utility libraries into separate chunks. |
| **CONF-001** | `client/src/services/api.js` | Configuration | Added `import.meta.env.VITE_API_URL` fallback to support multi-domain and CDN frontend deployments. |

---

## 2. Detailed Phase 2 Remediation Details

### Change 1: Default Password Fallback Bypass Removal (`authController.js`)
- **Vulnerability (SEC-006):** In `authController.login`, if the database password hash comparison failed, the handler iterated through an array of all default passwords (`['Password@123', 'Student@2024', 'Mentor@2027']`) and accepted any of them if the user had not changed their password yet. This allowed an attacker to log in with `Password@123` even for accounts provisioned with a different default password.
- **Diff summary:**
```javascript
// BEFORE:
for (const defaultPwd of defaultPasswords) {
  if (password === defaultPwd) {
    isMatch = true;
    break;
  }
}

// AFTER:
// Removed loop entirely. Only authenticate against the stored bcrypt hash:
const isMatch = await bcrypt.compare(password, user.passwordHash);
if (!isMatch) {
  return res.status(401).json({ success: false, message: 'Invalid email/roll number or password' });
}
```

---

### Change 2: Plaintext Admin Password Logging & Config (`server.js` & `env.js`)
- **Vulnerability (SEC-007):** In `server.js`, the bootstrap logic logged `Master Admin: admin@sru.edu.in / ${defaultAdminPassword}` directly into server stdout on every boot, exposing the master administrator credential in server logs.
- **Diff summary:**
```javascript
// In server/src/config/env.js:
ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@sru.edu.in',
ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Password@123',

// In server/src/server.js:
// BEFORE:
console.log(`[BOOT] Master Admin: admin@sru.edu.in / ${defaultAdminPassword}`);

// AFTER:
console.log(`[BOOT] Master Admin verified (${adminEmail}). Plaintext credentials suppressed.`);
```

---

### Change 3: Task Authoring Scope & Modification Protection (`taskController.js`)
- **Vulnerability (SEC-008):** In `updateTask`, `extendTaskDeadline`, and `assignTaskToRecipients`, any user with role `MENTOR` or `TRAINER` could modify or reassign tasks authored by other faculty members.
- **Diff summary:**
```javascript
// Verified creator ownership or admin privilege:
if (task.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
  return res.status(403).json({ success: false, message: 'Forbidden: You can only modify tasks you created' });
}

// Scoped recipient assignments for Mentors:
if (req.user.role === 'MENTOR') {
  const allowedMentees = await prisma.mentorMenteeAssignment.findMany({
    where: { mentorId: req.user.id },
    select: { menteeId: true }
  });
  const allowedSet = new Set(allowedMentees.map(a => a.menteeId));
  const unauthorized = targetIds.filter(id => !allowedSet.has(id));
  if (unauthorized.length > 0) {
    return res.status(403).json({ success: false, message: 'Forbidden: You cannot assign tasks to students outside your mentorship' });
  }
}
```

---

### Change 4: Task Progress & Mentee Task Detail Scoping (`taskController.js` & `menteeTaskController.js`)
- **Vulnerability (SEC-009):** `getTaskProgress` and `getMenteeTaskById` lacked boundary checks, allowing unauthorized cross-mentorship and student-to-student inspection.
- **Diff summary:**
```javascript
// In getTaskProgress (taskController.js):
if (task.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
  return res.status(403).json({ success: false, message: 'Forbidden: You can only view progress for tasks you created' });
}

// In getMenteeTaskById (menteeTaskController.js):
if (req.user.role === 'MENTEE' && menteeTask.menteeId !== req.user.id) {
  return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own task assignments' });
}
```

---

### Change 5: Task Review & Evaluation Validation (`reviewController.js`)
- **Vulnerability (SEC-010):** Review endpoints permitted any mentor to submit scores and evaluations for students not assigned to them.
- **Diff summary:**
```javascript
if (req.user.role === 'MENTOR') {
  const assignment = await prisma.mentorMenteeAssignment.findFirst({
    where: { mentorId: req.user.id, menteeId: menteeTask.menteeId }
  });
  if (!assignment) {
    return res.status(403).json({ success: false, message: 'Forbidden: You can only review tasks for your assigned mentees' });
  }
}
```

---

### Change 6: Trainer Problem & POTD Scoping (`trainerController.js`)
- **Vulnerability (SEC-011):** `getDailyProblemById` allowed trainers and students from one batch to view problem descriptions, solutions, and test cases intended for other batches.
- **Diff summary:**
```javascript
if (req.user.role === 'TRAINER') {
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: req.user.id }
  });
  if (!trainerProfile || !trainerProfile.assignedBatches.includes(problem.batchId)) {
    return res.status(403).json({ success: false, message: 'Forbidden: You cannot access daily problems from unassigned batches' });
  }
} else if (req.user.role === 'MENTEE') {
  const menteeProfile = await prisma.menteeProfile.findUnique({
    where: { userId: req.user.id }
  });
  if (!menteeProfile || menteeProfile.batchId !== problem.batchId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You can only access daily problems for your assigned batch' });
  }
}
```

---

### Change 7: Comprehensive Security Headers & CORS Error Handling (`app.js`)
- **Vulnerability (SEC-012):** Missing defense-in-depth headers and CORS errors bubbling as unhandled exceptions.
- **Diff summary:**
```javascript
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

// Safe CORS rejection:
if (isAllowed) {
  callback(null, true);
} else {
  const corsErr = new Error('Not allowed by CORS policy');
  corsErr.status = 403;
  callback(corsErr);
}
```

---

### Change 8: Graceful Shutdown & Production Error Masking (`server.js` & `errorMiddleware.js`)
- **Reliability (PROD-002):** Uncaught exceptions and termination signals now disconnect Prisma cleanly and terminate gracefully within a 10s watchdog timeout. Internal server errors (500) now return generic messages in production mode to avoid disclosing database schemas or stack traces.

---

### Change 9: Automated Security Regression Test Suite (`test-security-regression.js`)
- **Quality Assurance (TEST-002):** Built an automated 26-assertion security test suite validating headers, unauthenticated access, default password bypass removal, task scopes, progress metrics, review scopes, trainer POTD batches, and safe error responses.
