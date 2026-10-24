# MentorHub — Remediation & Bug Fix Log

**Date:** October 24, 2026  
**Auditor:** Full-Stack Security & Software Engineer  
**Scope:** Complete chronological remediation log covering Phase 1, Phase 2, and Phase 3 security hardening.

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
| **SEC-013** | `server/src/server.js`, `server/src/config/env.js` | Authentication / Fallback | Removed `Password@123` fallback on initial administrator creation. In production, server aborts if `ADMIN_PASSWORD` is missing or trivial. |
| **SEC-014** | `server/src/controllers/userController.js`, `server/src/controllers/trainerController.js` | Authentication / Defaults | Removed `Password@123` fallback in admin and trainer creation; requires explicit, strong password (>= 8 chars). |
| **SEC-015** | `server/src/middleware/authMiddleware.js` | Authorization / Temp Passwords | Enforced gate blocking newly provisioned users with `mustChangePassword: true` from functional endpoints until password is changed. |
| **SEC-016** | `server/src/app.js` | Security / CORS & CSP | Barred localhost in production, validated exact origin URL & HTTPS scheme, added strict Content-Security-Policy (CSP), and added catch-all JSON 404 handler. |
| **SEC-017** | `server/src/seeds/seedPrisma.js`, `seed.js`, `seedTrainerAndCalendar.js` | Ops / Safety | Added fail-safe guards requiring `ALLOW_DESTRUCTIVE_SEED=true` to prevent destructive table deletion in production. |
| **TEST-003** | `server/test-db-guard.js`, `test-*.js` | Test / Safety | Built database isolation guard requiring dedicated `TEST_DATABASE_URL`. Safely skips mutating tests when running against unisolated database. |
| **PROD-002** | `server/src/server.js`, `errorMiddleware.js`, `database.js` | Reliability & Resilience | Enhanced graceful shutdown with Prisma disconnect and 10s watchdog; added connection retry resilience (3 attempts, 2s backoff); masked 500 error messages. |

---

## 2. Phase 3 Remediation Details

### Change 1: Eliminate Insecure Admin Password Fallback (`server.js`)
```javascript
// BEFORE:
const initialPassword = ENV.ADMIN_PASSWORD || 'Password@123';

// AFTER:
if (isProd) {
  if (!initialPassword || initialPassword === 'Password@123' || initialPassword.length < 12) {
    console.error('FATAL: Initial admin provisioning in production requires a securely provisioned ADMIN_PASSWORD (min 12 chars).');
    process.exit(1);
  }
} else {
  if (!initialPassword || initialPassword === 'Password@123') {
    console.error('FATAL: Insecure default "Password@123" is rejected. Set a secure ADMIN_PASSWORD in server/.env.');
    process.exit(1);
  }
}
```

### Change 2: Eliminate Password Fallbacks in Account Creation (`userController.js`, `trainerController.js`)
```javascript
// Validates that password is provided and meets minimum strength requirements:
if (!password || typeof password !== 'string' || password.trim().length < 8) {
  return res.status(400).json({ success: false, message: 'A secure password of at least 8 characters is required.' });
}
if (password.trim() === 'Password@123') {
  return res.status(400).json({ success: false, message: 'Default or predictable passwords like "Password@123" are not permitted.' });
}
```

### Change 3: Temporary Password Access Gate (`authMiddleware.js`)
```javascript
// Enforce mandatory password change for newly provisioned users before normal access
const PHASE3_CUTOFF = new Date('2026-10-24T12:00:00Z');
const isNewlyProvisioned = user.createdAt && new Date(user.createdAt) > PHASE3_CUTOFF;
if (user.mustChangePassword && isNewlyProvisioned) {
  const normalizedPath = (req.originalUrl || req.path || '').split('?')[0];
  const isAllowedAuthPath =
    normalizedPath.endsWith('/auth/change-password') ||
    normalizedPath.endsWith('/auth/me') ||
    normalizedPath.endsWith('/auth/logout');

  if (!isAllowedAuthPath) {
    return res.status(403).json({
      success: false,
      code: 'MUST_CHANGE_PASSWORD',
      message: 'Temporary password detected. You must change your password before accessing normal application functionality.'
    });
  }
}
```

### Change 4: Production CORS Hardening & CSP (`app.js`)
- Barred `localhost:5173`, `127.0.0.1:5173`, and `localhost:3000` in production.
- Strictly enforced `https:` protocol and validated that hostname matches `sru.edu.in` or ends with `.sru.edu.in` preceded by a dot (`evil-sru.edu.in` rejected).
- Added strict Content-Security-Policy (CSP) restricting script, style, font, image, object, and connect origins.
- Added catch-all JSON 404 handler for unmapped endpoints.

### Change 5: Database Seeding Safeguards (`seedPrisma.js`, `seed.js`, `seedTrainerAndCalendar.js`)
```javascript
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
  throw new Error(
    'FATAL: Destructive database seeding is prohibited in production. ' +
    'To force seeding in production, you must explicitly set ALLOW_DESTRUCTIVE_SEED=true with authorized confirmation.'
  );
}
```

### Change 6: Test Database Isolation Guard (`test-db-guard.js`)
- Requires `TEST_DATABASE_URL` to be explicitly configured, non-empty, and distinct from `DATABASE_URL`.
- Automatically skips mutating tests when running against an unisolated database, guaranteeing that primary/production records cannot be corrupted.
