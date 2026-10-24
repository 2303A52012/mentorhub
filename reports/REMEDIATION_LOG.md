# MentorHub — Remediation & Bug Fix Log

**Date:** October 24, 2026  
**Auditor:** Full-Stack Security & Software Engineer  
**Scope:** Complete chronological remediation log covering Phase 1, Phase 2, Phase 3, and Phase 4 gap closure.

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
| **SEC-018** | `server/src/services/bulkImportService.js` | Security / Credentials | Removed shared passwords `Student@2024` and `Mentor@2027`. Generates per-user unique cryptographically random temporary credentials; sets `mustChangePassword: true`. |
| **SEC-019** | `server/src/seeds/seedPrisma.js`, `seed.js`, `seedTrainerAndCalendar.js` | Security / Seed Fallback | Removed predictable `DevSeed@2026!` fallback. Requires explicit `SEED_DEFAULT_PASSWORD` (min 8 chars) or aborts safely. |
| **SEC-020** | `server/src/controllers/authController.js` | Privacy / Response Sanitization | Removed plaintext password echo in mentor password reset response message; enforced min 8 characters on reset passwords. |
| **SEC-021** | `server/src/app.js` | Security / CSP | Removed localhost from production `connect-src`; removed `'unsafe-inline'` from production `script-src`. |
| **TEST-004** | `server/test-db-guard.js`, `server/src/utils/security.js`, `test-*.js` | Test Isolation / Reliability | Implemented deterministic DB fingerprinting and server isolation verification; replaced `process.exit()` with `process.exitCode` to guarantee `finally` cleanup execution. |

---

## 2. Phase 4 Remediation Details

### Change 1: Remove Shared Credentials in Bulk Import (`bulkImportService.js`)
```javascript
// BEFORE:
const defaultPasswordHash = await bcrypt.hash('Student@2024', 10);
const mentorPasswordHash = await bcrypt.hash('Mentor@2027', 10);

// AFTER:
// Generate a unique cryptographically secure temporary password per imported user
const tempPassword = crypto.randomBytes(24).toString('base64url');
const passwordHash = await bcrypt.hash(tempPassword, 10);
// Never log temporary credentials; require mandatory password change
mustChangePassword: true
```

### Change 2: Eliminate Dev Seed Password Fallback (`seedPrisma.js`, `seed.js`, `seedTrainerAndCalendar.js`)
```javascript
// BEFORE:
const seedPassword = process.env.SEED_DEFAULT_PASSWORD || 'DevSeed@2026!';

// AFTER:
const seedPassword = process.env.SEED_DEFAULT_PASSWORD;
if (!seedPassword || seedPassword.length < 8) {
  throw new Error(
    'FATAL: SEED_DEFAULT_PASSWORD environment variable (min 8 characters) must be explicitly configured to run seed scripts.'
  );
}
```

### Change 3: Sanitize Password Reset Response & Enforce Minimum 8 Characters (`authController.js`)
```javascript
// BEFORE:
if (!menteeId || !newPassword || newPassword.length < 6) ...
message: `Password for ${mentee.name} has been successfully reset to: ${newPassword}`

// AFTER:
if (!menteeId || !newPassword || newPassword.length < 8) ...
message: `Password for ${mentee.name} has been reset successfully.`
```

### Change 4: Tighten Production CSP & Eliminate Localhost Endpoints (`app.js`)
```javascript
const isProd = ENV.NODE_ENV === 'production';
const scriptSrc = isProd ? "'self'" : "'self' 'unsafe-inline'";
const connectSrc = isProd
  ? ["'self'", "https://*.supabase.co", "https://*.sru.edu.in", ENV.CLIENT_URL].filter(Boolean).join(' ')
  : "'self' http://localhost:5001 http://localhost:5173 https://*.supabase.co https://*.sru.edu.in";
```

### Change 5: Real Test Database Isolation & Guaranteed Finally Cleanup (`test-db-guard.js`, `test-*.js`)
```javascript
// 1. Deterministic SHA-256 database fingerprinting exposed via /api/health:
databaseFingerprint: computeDatabaseFingerprint(process.env.DATABASE_URL)

// 2. Asynchronous server isolation verification before mutating tests:
const serverIsolation = await verifyServerDatabaseIsolation(API_BASE);
const isIsolated = assertDatabaseIsolation('Suite Name', serverIsolation);

// 3. Replace process.exit() with process.exitCode in test runners:
process.exitCode = failCount > 0 ? 1 : 0;
return;
// Guaranteed execution of finally blocks with post-cleanup verification
```
