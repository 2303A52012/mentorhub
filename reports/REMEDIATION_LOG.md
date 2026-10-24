# MentorHub — Remediation & Bug Fix Log

**Date:** October 24, 2026  
**Auditor:** Full-Stack Security & Software Engineer  
**Scope:** Remediation of all confirmed security, logic, reliability, configuration, and test infrastructure issues.

---

## 1. Summary of Changes

| Issue ID | File(s) Modified | Type of Change | Rationale |
| :--- | :--- | :--- | :--- |
| **SEC-001** | `server/src/controllers/complaintController.js` | Security / Access Control | Added ownership & role checks in `getComplaintById` and `createComplaint` to prevent grievance data leakage. |
| **SEC-002** | `server/src/app.js` | Security / Headers | Added HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `X-XSS-Protection`) and restricted CORS in production. |
| **SEC-003** | `server/src/config/env.js` | Secrets & Configuration | Removed hardcoded Supabase plaintext password and enforced fail-fast validation in production mode. |
| **SEC-004** | `server/src/controllers/weeklyTargetController.js` | Security / IDOR | Scoped `updateCodingCounters` verification to assigned mentees for Mentors and assigned batches for Trainers. |
| **SEC-005** | `server/src/routes/userRoutes.js`, `server/src/middleware/roleMiddleware.js` | Access Control | Updated `checkMentorMenteeAccess` middleware to support `TRAINER` batch membership and hooked into `GET /mentees/:id`. |
| **BUG-001** | `server/src/controllers/authController.js` | Business Logic | Added explicit `TRAINER` branch in `forgotPassword` handler to prevent unhandled state for corporate trainers. |
| **BUG-002** | `server/src/routes/reportRoutes.js`, `server/src/controllers/reportController.js` | Authorization & Reporting | Added `TRAINER` to report routes and scoped mentee/mock reports to trainer's assigned batches. |
| **BUG-003** | `server/src/app.js` | Reliability & Monitoring | Upgraded `/api/health` to perform active PostgreSQL database query (`SELECT 1`) via Prisma with HTTP 503 fallback. |
| **BUG-004** | `server/test-weekly-mocks.js` | Test Infrastructure | Replaced static past date `2026-10-20` with dynamic future date offset (`today + 2 days`) to preserve upcoming partition. |
| **BUG-005** | `server/test-bulk-import.js` | Test Infrastructure | Updated obsolete mentor email `mentor.alan@sru.edu.in` to active SRU mentor `2303a51812@sru.edu.in`. |
| **BUG-006** | `server/package.json` | Dev Tooling | Scoped `node --watch` with `--watch-path=src` to eliminate mid-test server restarts. |
| **PERF-001** | `client/vite.config.js` | Performance & Build | Added Vite 8 / Rolldown `manualChunks` function to partition React, Recharts, and utility libraries into separate chunks. |
| **CONF-001** | `client/src/services/api.js` | Configuration | Added `import.meta.env.VITE_API_URL` fallback to support multi-domain and CDN frontend deployments. |

---

## 2. Detailed Remediation Details

### Change 1: Secure Complaint Ownership (`complaintController.js`)
- **Diff summary:**
```javascript
// Added ownership & role checks in getComplaintById:
if (req.user.role === 'TRAINER') {
  return res.status(403).json({ success: false, message: 'Access denied: Trainers cannot view grievances.' });
}
if (req.user.role === 'MENTEE' && complaint.menteeId !== req.user.id) {
  return res.status(403).json({ success: false, message: 'Access denied: You can only view your own complaints.' });
}
if (req.user.role === 'MENTOR') {
  const assignment = await prisma.mentorMenteeAssignment.findFirst({
    where: { mentorId: req.user.id, menteeId: complaint.menteeId }
  });
  if (!assignment) {
    return res.status(403).json({ success: false, message: 'Access denied: Mentee not assigned to you.' });
  }
}
```

### Change 2: Security Headers & Strict CORS (`app.js`)
- **Diff summary:**
```javascript
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
```

### Change 3: Remove Plaintext Secret Fallback (`env.js`)
- **Diff summary:**
```javascript
// Removed plaintext Supabase connection string.
// Added production validation:
if (process.env.NODE_ENV === 'production') {
  if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL must be defined in production.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'supersecretkey') {
    console.error('FATAL: A secure, high-entropy JWT_SECRET must be defined in production.');
    process.exit(1);
  }
}
```

### Change 4: Prevent IDOR in Cumulative Counter Verification (`weeklyTargetController.js`)
- **Diff summary:**
```javascript
// Scoped verification checks:
if (userRole === 'MENTOR') {
  const assignment = await prisma.mentorMenteeAssignment.findFirst({
    where: { mentorId: userId, menteeId: targetMenteeId }
  });
  if (!assignment) {
    return res.status(403).json({ success: false, message: 'Forbidden: You can only verify counters for your assigned mentees' });
  }
} else if (userRole === 'TRAINER') {
  const student = await prisma.menteeProfile.findUnique({
    where: { userId: targetMenteeId },
    select: { batchId: true }
  });
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId },
    include: { batches: true }
  });
  const isAssigned = trainerProfile?.batches.some(b => b.id === student?.batchId);
  if (!isAssigned) {
    return res.status(403).json({ success: false, message: 'Forbidden: Student not in your assigned batches' });
  }
}
```

### Change 5: Deep Health Check Probe (`app.js`)
- **Diff summary:**
```javascript
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      service: 'MentorHub API',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      service: 'MentorHub API',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Change 6: Frontend Vendor Chunk Optimization (`client/vite.config.js`)
- **Diff summary:**
```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('recharts')) {
            return 'vendor-charts';
          }
          if (id.includes('lucide')) {
            return 'vendor-icons';
          }
          if (id.includes('axios')) {
            return 'vendor-utils';
          }
        }
      }
    }
  },
  chunkSizeWarningLimit: 1000
}
```

---

## 3. Regression Testing & Verification

1. Reran `npm run test:mocks` — **22 passed, 0 failed**.
2. Reran `npm run test:bulk` — **100% passed (idempotency, security, and update checks)**.
3. Reran `npm run build` in `client/` — **Built in 2.55s, 0 errors, 0 warnings**.
4. Executed `node --check` syntax check across all backend source files — **Passed with 0 errors**.
5. Pinged `GET /api/health` against running server — **HTTP 200 OK with `database: 'connected'`**.
