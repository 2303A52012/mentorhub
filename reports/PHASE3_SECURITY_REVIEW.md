# MentorHub — Phase 3 & Phase 4 Security Review & Discrepancy Remediation Report

**Date:** October 24, 2026  
**Auditor:** Application Security Specialist & Senior DevOps Reliability Auditor  
**Status:** **NOT READY FOR PRODUCTION** (Blocker: Isolated test database infrastructure unprovisioned)  

---

## 1. Executive Summary

Following the Phase 2 and Phase 3 reviews, an independent deep-dive audit identified remaining critical and high-severity security and test-isolation gaps in the repository:
1. **Shared & Predictable Credentials in Bulk Imports:** `server/src/services/bulkImportService.js` provisioned student and mentor accounts with predictable static passwords `Student@2024` and `Mentor@2027`.
2. **Predictable Development Seed Passbacks:** Seeding scripts (`seedPrisma.js`, `seed.js`, `seedTrainerAndCalendar.js`) fell back to a shared predictable password `DevSeed@2026!`.
3. **Plaintext Password Disclosure & Short Password Policy in Resets:** `server/src/controllers/authController.js` allowed 6-character passwords and leaked the plaintext temporary password directly in the JSON response message upon mentor reset.
4. **Permissive Production CSP & Localhost Connect-Src:** `server/src/app.js` allowed `http://localhost:5001` and `http://localhost:5173` in production `connect-src` and permitted `'unsafe-inline'` in `script-src`.
5. **Superficial Database Test Isolation & Broken Cleanup:** `server/test-db-guard.js` previously only compared string URLs and could not prevent tests from running against a live API server connected to the primary database. Furthermore, `process.exit()` calls inside `try` blocks prematurely aborted Node.js processes, preventing `finally` cleanup handlers from executing.

All identified vulnerabilities have been remediated in source code, verified with regression assertions, and confirmed with 100% pass rates. The final deployment verdict remains **NOT READY FOR PRODUCTION** until an isolated test database is provisioned.

---

## 2. Discrepancy Analysis & Remediation Log (Phase 3 & Phase 4)

### Finding 1: Shared Credentials in Bulk Import (`SEC-018` — Critical)
- **Affected File:** [bulkImportService.js](file:///d:/mentorconnect/server/src/services/bulkImportService.js)
- **Root Cause:** Bulk import provisioned all student accounts with `'Student@2024'` and mentors with `'Mentor@2027'`, creating an immediate account takeover vulnerability upon batch import.
- **Remediation:** Removed shared credentials completely. Implemented per-account unique cryptographic temporary passwords:
  ```javascript
  const tempPassword = crypto.randomBytes(24).toString('base64url');
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  ```
  Passwords are never logged or stored in plaintext, and each account is flagged with `mustChangePassword: true`.
- **Verification:** Verified via `Test 11` in `test-security-regression.js`.

---

### Finding 2: Unsafe Seed-Password Fallback (`SEC-019` — High)
- **Affected Files:** [seedPrisma.js](file:///d:/mentorconnect/server/src/seeds/seedPrisma.js), [seed.js](file:///d:/mentorconnect/server/src/seeds/seed.js), [seedTrainerAndCalendar.js](file:///d:/mentorconnect/server/src/seeds/seedTrainerAndCalendar.js)
- **Root Cause:** All seed scripts contained `process.env.SEED_DEFAULT_PASSWORD || 'DevSeed@2026!'`, introducing a predictable shared password for seeded accounts.
- **Remediation:** Removed `'DevSeed@2026!'` fallback. Seed scripts now validate:
  ```javascript
  const seedPassword = process.env.SEED_DEFAULT_PASSWORD;
  if (!seedPassword || seedPassword.length < 8) {
    throw new Error('FATAL: SEED_DEFAULT_PASSWORD environment variable (min 8 characters) must be explicitly configured to run seed scripts.');
  }
  ```
  All seeded accounts now enforce `mustChangePassword: true` so they remain gated until credentials are changed.
- **Verification:** Verified via `Test 12` in `test-security-regression.js`.

---

### Finding 3: Plaintext Password Echo & Short Password Policy in Reset (`SEC-020` — High)
- **Affected Files:** [authController.js](file:///d:/mentorconnect/server/src/controllers/authController.js)
- **Root Cause:** `mentorResetMenteePassword` and `adminResetPassword` accepted 6-character passwords, and `mentorResetMenteePassword` echoed the plaintext password in the JSON response (`message: "Password for ... reset to: ..."`).
- **Remediation:** Enforced minimum 8 characters (`newPassword.length < 8`), and sanitized response to:
  ```javascript
  message: `Password for ${mentee.name} has been reset successfully.`
  ```
- **Verification:** Verified in `authController.js` and syntax check.

---

### Finding 4: Production CSP Tightening & Localhost Removal (`SEC-021` — High)
- **Affected Files:** [app.js](file:///d:/mentorconnect/server/src/app.js)
- **Root Cause:** In production, CSP `connect-src` permitted `http://localhost:5001` and `http://localhost:5173`, and `script-src` allowed `'unsafe-inline'`.
- **Remediation:** In production mode (`isProd`):
  - `connect-src` allows strictly `'self'`, `https://*.supabase.co`, `https://*.sru.edu.in`, and `CLIENT_URL`. All localhost endpoints removed.
  - `script-src` strictly set to `'self'`. All `'unsafe-inline'` removed.
- **Verification:** Verified via `Test 1` in `test-security-regression.js`.

---

### Finding 5: Real Database Isolation & Guaranteed Test Cleanup (`TEST-004` — Critical)
- **Affected Files:** [test-db-guard.js](file:///d:/mentorconnect/server/test-db-guard.js), [test-weekly-mocks.js](file:///d:/mentorconnect/server/test-weekly-mocks.js), [test-bulk-import.js](file:///d:/mentorconnect/server/test-bulk-import.js), [test-security-regression.js](file:///d:/mentorconnect/server/test-security-regression.js)
- **Root Cause:**
  1. Tests executed against `http://localhost:5001/api/v1` without verifying what database the live server was connected to.
  2. Tests invoked `process.exit()` inside `try` and `catch` blocks, causing Node.js to exit immediately without executing `finally` fixture cleanup blocks.
- **Remediation:**
  - Implemented deterministic SHA-256 database fingerprinting in `src/utils/security.js` and exposed `databaseFingerprint` in `/api/health`.
  - Added asynchronous `verifyServerDatabaseIsolation` in `test-db-guard.js`: queries `/api/health`, verifies server is NOT connected to primary database, and confirms fingerprint matches `TEST_DATABASE_URL`.
  - Replaced all `process.exit()` calls in test suites with `process.exitCode = ...; return;` to guarantee `finally` cleanup execution.
  - Added post-cleanup verification assertions in `finally` blocks confirming database fixtures are removed.
- **Verification:** Verified via `npm test` across all three test suites.

---

## 3. Production Readiness Evaluation

| Evaluation Criteria | Current Status | Supporting Detail |
| :--- | :---: | :--- |
| **Authentication & Credential Hardening** | **PASS** | Shared passwords removed from bulk import and seed scripts. |
| **Authorization & Privacy Scopes** | **PASS** | Role scoping verified across tasks, reviews, POTDs, and grievances. |
| **CORS & Security Headers** | **PASS** | Strict HTTPS origin validation, localhost barred from prod, CSP hardened. |
| **Database Seeding Protection** | **PASS** | Destructive deletion blocked without `ALLOW_DESTRUCTIVE_SEED`; seed passwords require explicit configuration. |
| **Database Test Isolation Guard** | **PASS (Guard)** | Guard reliably prevents mutation of primary database; verifies server isolation. |
| **Mutating Integration Test Execution** | **BLOCKED** | Mutating tests safely skipped until `TEST_DATABASE_URL` is provisioned. |

---

## 4. Final Verdict

# **NOT READY FOR PRODUCTION**

### Reason for Verdict:
All identified code-level vulnerabilities, hardcoded credentials, predictable fallbacks, and test isolation flaws have been remediated. However, mutating end-to-end integration tests cannot be certified as passing until an **isolated test database** (`TEST_DATABASE_URL`) is provisioned by DevOps/DBA. As designed, the Phase 4 database isolation guard actively blocks mutating tests against the primary database to protect production data integrity.

### Required Actions Before Production Go-Live:
1. Provision a dedicated PostgreSQL test database instance and set `TEST_DATABASE_URL` in `server/.env`.
2. Start test server connected to `TEST_DATABASE_URL` and run `npm test` to execute full mutating integration assertions.
3. Configure target production secrets (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, `CLIENT_URL`).
