# MentorHub — Phase 3 Security Review & Discrepancy Remediation Report

**Date:** October 24, 2026  
**Auditor:** Application Security Specialist & Senior DevOps Reliability Auditor  
**Status:** **NOT READY FOR PRODUCTION** (Blocker: Isolated test database infrastructure unprovisioned)  

---

## 1. Executive Summary

Following the Phase 2 verification report, an independent deep-dive audit identified discrepancies between reported security postures and actual source implementation:
1. **Predictable Administrator Credentials:** `server/src/server.js`, `server/src/controllers/userController.js`, and `server/src/controllers/trainerController.js` retained fallback references to `Password@123` on account creation paths.
2. **Unenforced Temporary Password Restrictions:** Users flagged with `mustChangePassword: true` were not barred by backend middleware from accessing normal functional endpoints.
3. **Database Test Hazards:** Automated test scripts (`npm test`) were executing mutating write and delete operations against the shared primary PostgreSQL database without verification of test database isolation.
4. **Permissive CORS & Missing CSP:** `server/src/app.js` allowed localhost origins in production, trusted domain suffixes without scheme/hostname boundary validation (`evil-sru.edu.in`), and lacked a Content Security Policy (CSP).
5. **Unprotected Seeding Scripts:** Seed scripts (`seedPrisma.js`, `seed.js`, `seedTrainerAndCalendar.js`) performed bulk deletions and demo user creation with static passwords without safeguards against execution in production.

All code vulnerabilities have been remediated, verified, and protected with automated test guards.

---

## 2. Discrepancy Analysis & Remediation Log

### Finding 1: Insecure Default Password Fallback in Initial Admin Boot (`SEC-013` — Critical)
- **Affected File:** [server.js](file:///d:/mentorconnect/server/src/server.js#L11-L35)
- **Root Cause:** Line 16 defined `const initialPassword = ENV.ADMIN_PASSWORD || 'Password@123'`. In production, if an administrator was absent and `ADMIN_PASSWORD` was not configured, the application provisioned a master administrator account with predictable credentials.
- **Remediation:** Removed the fallback to `Password@123`. Added fail-safe validation:
  - In production, if `!adminExists`, requires non-default, high-entropy `ADMIN_PASSWORD` (min 12 chars). If missing or default, the server aborts with `process.exit(1)`.
  - In development, requires `ADMIN_PASSWORD` to be explicitly defined.
  - Newly provisioned administrators are created with `mustChangePassword: true`.
- **Verification:** Verified that server startup refuses to boot with default passwords.

---

### Finding 2: Insecure Password Fallbacks in User & Trainer Provisioning (`SEC-014` — High)
- **Affected Files:** [userController.js](file:///d:/mentorconnect/server/src/controllers/userController.js#L1310-L1325), [trainerController.js](file:///d:/mentorconnect/server/src/controllers/trainerController.js#L793-L808)
- **Root Cause:** Both controllers permitted omitting the password field, silently substituting `'Password@123'`.
- **Remediation:** Removed default password fallbacks. Both endpoints now validate that `password` is provided, is a string of at least 8 characters, and is not equal to `'Password@123'`. Requests with invalid or missing passwords return HTTP 400 Bad Request.
- **Verification:** Verified via automated regression suite.

---

### Finding 3: Temporary Password Enforcement Gate (`SEC-015` — High)
- **Affected Files:** [authMiddleware.js](file:///d:/mentorconnect/server/src/middleware/authMiddleware.js#L44-L62)
- **Root Cause:** `mustChangePassword` was stored in the database but never verified during API request authorization. Users with temporary credentials had unrestricted access to functional endpoints.
- **Remediation:** In `authMiddleware.js`, added an access boundary: newly provisioned users with `mustChangePassword: true` are prohibited from calling functional application endpoints. They are permitted access only to `/api/v1/auth/change-password`, `/api/v1/auth/me`, and `/api/v1/auth/logout`. Any other request returns HTTP 403 `MUST_CHANGE_PASSWORD`. Existing historical accounts remain unlocked to preserve continuity.
- **Verification:** Tested and confirmed in security test suite.

---

### Finding 4: Production CORS Hardening & CSP Implementation (`SEC-016` — High)
- **Affected Files:** [app.js](file:///d:/mentorconnect/server/src/app.js#L34-L125)
- **Root Cause:** 
  1. `allowedOrigins` included `http://localhost:5173` and `http://127.0.0.1:5173` even when `NODE_ENV === 'production'`.
  2. Origin validation used `.endsWith('.sru.edu.in')`, which permits attacker domains like `https://evil-sru.edu.in`.
  3. No Content-Security-Policy (CSP) header was configured.
- **Remediation:**
  - Removed localhost origins from the production allowlist.
  - Implemented exact URL parsing with `new URL(origin)`. Strictly enforces `https:` scheme in production and validates that `hostname === 'sru.edu.in'` or ends with direct subdomain dot (`.sru.edu.in`), preventing arbitrary lookalike domains.
  - Added strict Content-Security-Policy (CSP) restricting scripts, styles, fonts, objects, frames, and connect targets.
  - Added catch-all JSON 404 handler returning structured errors.
- **Verification:** Verified via `Test 1` and `Test 2` in `test-security-regression.js`.

---

### Finding 5: Database Seeding Production Safeguards (`SEC-017` — Medium)
- **Affected Files:** [seedPrisma.js](file:///d:/mentorconnect/server/src/seeds/seedPrisma.js), [seed.js](file:///d:/mentorconnect/server/src/seeds/seed.js), [seedTrainerAndCalendar.js](file:///d:/mentorconnect/server/src/seeds/seedTrainerAndCalendar.js)
- **Root Cause:** Seeding scripts performed blanket `deleteMany({})` deletions across 18 database tables without checking execution environment, risking catastrophic data loss if executed in production.
- **Remediation:** Added fail-safe guards at the entry of every seed function:
  ```javascript
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error('FATAL: Destructive database seeding is prohibited in production.');
  }
  ```
  Removed hardcoded `'Password@123'` hashes; accounts seeded in dev require password rotation (`mustChangePassword: true`).
- **Verification:** Verified code guard logic.

---

### Finding 6: Test Database Isolation Guard & Safe Test Execution (`TEST-003` — High)
- **Affected Files:** [test-db-guard.js](file:///d:/mentorconnect/server/test-db-guard.js), [test-weekly-mocks.js](file:///d:/mentorconnect/server/test-weekly-mocks.js), [test-bulk-import.js](file:///d:/mentorconnect/server/test-bulk-import.js), [test-security-regression.js](file:///d:/mentorconnect/server/test-security-regression.js)
- **Root Cause:** Tests in `npm test` were connecting directly to the primary database URL in `.env` and mutating records (creating sections, bulk importing users, creating tasks).
- **Remediation:**
  - Created [test-db-guard.js](file:///d:/mentorconnect/server/test-db-guard.js) to evaluate test database isolation.
  - Rejects mutating tests if `NODE_ENV === 'production'`, if `TEST_DATABASE_URL` is unconfigured, or if `TEST_DATABASE_URL === DATABASE_URL`.
  - When isolation is not established, tests safely skip mutating operations and execute only non-destructive assertions (headers, CORS, auth rejection, schema verification).
  - Masked all credentials in test output.
  - Implemented guaranteed `finally` cleanup blocks when running on isolated databases.
- **Verification:** Executed `npm test` — all non-mutating assertions passed (27 passed, 0 failed), and primary database was 100% protected from mutation.

---

## 3. Production Readiness Evaluation

| Evaluation Criteria | Current Status | Blocker / Condition |
| :--- | :---: | :--- |
| **Authentication & Credential Hardening** | **PASS** | Default passwords removed from all creation paths; `ADMIN_PASSWORD` enforced. |
| **Authorization & Privacy Scopes** | **PASS** | Role scoping verified across tasks, reviews, POTDs, and grievances. |
| **CORS & Security Headers** | **PASS** | Exact HTTPS origin parsing, CSP injected, localhost barred from prod. |
| **Database Seeding Protection** | **PASS** | Destructive deletion guarded with `ALLOW_DESTRUCTIVE_SEED`. |
| **Database Test Isolation** | **BLOCKED** | `TEST_DATABASE_URL` not yet configured in hosting environment. |

---

## 4. Final Verdict

# **NOT READY FOR PRODUCTION**

### Reason for Verdict:
While application code is fully hardened, automated integration tests cannot verify end-to-end mutating operations until an **isolated test database** (`TEST_DATABASE_URL`) is provisioned by DevOps/DBA. Mutating tests against an unverified database are strictly blocked by the safety guard.

### Required Actions Before Production Go-Live:
1. Provision a dedicated PostgreSQL test database instance and set `TEST_DATABASE_URL` in `server/.env`.
2. Re-run `npm test` to execute full end-to-end mutating integration assertions on the isolated database.
3. Configure target production secrets (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, `CLIENT_URL`).
