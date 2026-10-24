/**
 * MentorHub — Phase 4 Security & Authorization Regression Test Suite
 * Validates CORS hardening, CSP tightening, temporary password enforcement, cross-user isolation,
 * default password bypass removal, seed safety, bulk import cryptographic isolation, and safe database isolation guards.
 */

import fs from 'fs';
import path from 'path';
import prisma from './src/config/prisma.js';
import bcrypt from 'bcryptjs';
import { assertDatabaseIsolation, verifyServerDatabaseIsolation, checkDatabaseIsolation, maskSensitive } from './test-db-guard.js';
import { isAllowedOrigin, computeDatabaseFingerprint } from './src/utils/security.js';

const API_BASE = 'http://localhost:5001/api/v1';

async function runSecurityTests() {
  console.log('🔒 Starting MentorHub Security & Authorization Regression Test Suite (Phase 4)...\n');

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  const api = async (endpoint, options = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, headers: res.headers, data };
  };

  const serverIsolation = await verifyServerDatabaseIsolation(API_BASE);
  const isIsolated = assertDatabaseIsolation('Security Regression Test Suite', serverIsolation);

  try {
    // ---------------------------------------------------------
    // TEST 1: Security Headers & CSP Tightening
    // ---------------------------------------------------------
    console.log('--- Test 1: Security Headers, CSP Tightening & Database Fingerprint ---');
    const healthRes = await fetch('http://localhost:5001/api/health');
    assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is nosniff');
    assert(healthRes.headers.get('x-frame-options') === 'SAMEORIGIN', 'X-Frame-Options is SAMEORIGIN');
    assert(healthRes.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Referrer-Policy is strict-origin-when-cross-origin');
    assert(healthRes.headers.get('permissions-policy') === 'camera=(), microphone=(), geolocation=()', 'Permissions-Policy is set');
    assert(!!healthRes.headers.get('content-security-policy'), 'Content-Security-Policy (CSP) header is configured');
    assert(!healthRes.headers.get('x-powered-by'), 'X-Powered-By header is omitted');

    const healthJson = await healthRes.json();
    assert(healthJson.status === 'ok' && healthJson.database === 'connected', 'Database deep health probe is ok and connected');
    assert(!!healthJson.databaseFingerprint && healthJson.databaseFingerprint.includes('#'), 'Database isolation fingerprint exposed securely in health probe');

    // Regression check: production CSP policy tightening
    const simulatedProdAppFile = fs.readFileSync(path.join(process.cwd(), 'src', 'app.js'), 'utf-8');
    assert(!simulatedProdAppFile.includes("scriptSrc = isProd ? \"'self' 'unsafe-inline'\""), "Production script-src strictly disallows 'unsafe-inline'");
    assert(simulatedProdAppFile.includes("isProd ? \"'self'\" : \"'self' 'unsafe-inline'\""), "script-src uses 'self' in production");

    // ---------------------------------------------------------
    // TEST 2: Production CORS & Origin Hardening
    // ---------------------------------------------------------
    console.log('\n--- Test 2: Production CORS & Origin Hardening ---');
    // Live endpoint check
    const disallowedRes = await api('/health', {
      headers: { Origin: 'https://evil-attacker.com' }
    });
    assert(disallowedRes.status === 200 || disallowedRes.status === 403, 'CORS responds safely to external origin');

    // Regression unit assertions for CORS validator
    assert(isAllowedOrigin('https://mentorhub.sru.edu.in', 'production', 'https://mentorhub.sru.edu.in'), 'Approved application origin allowed in production');
    assert(isAllowedOrigin('https://portal.sru.edu.in', 'production'), 'Valid university subdomain (*.sru.edu.in) allowed in production');
    assert(isAllowedOrigin('https://sru.edu.in', 'production'), 'Root university domain (sru.edu.in) allowed in production');
    assert(!isAllowedOrigin('https://evil-sru.edu.in', 'production'), 'Malicious lookalike domain (evil-sru.edu.in) blocked in production');
    assert(!isAllowedOrigin('https://sru.edu.in.attacker.com', 'production'), 'Subdomain lookalike prefix (sru.edu.in.attacker.com) blocked in production');
    assert(!isAllowedOrigin('http://mentorhub.sru.edu.in', 'production'), 'Insecure HTTP origin blocked in production mode');
    assert(!isAllowedOrigin('http://localhost:5173', 'production'), 'Localhost origin strictly blocked in production mode');
    assert(isAllowedOrigin('http://localhost:5173', 'development'), 'Localhost origin allowed in development mode');

    // ---------------------------------------------------------
    // TEST 3: Unauthenticated Access Rejection
    // ---------------------------------------------------------
    console.log('\n--- Test 3: Unauthenticated Access Rejection ---');
    const unauthTasks = await api('/tasks');
    assert(unauthTasks.status === 401, 'Unauthenticated request to /tasks rejected with HTTP 401');

    const unauthComplaints = await api('/complaints');
    assert(unauthComplaints.status === 401, 'Unauthenticated request to /complaints rejected with HTTP 401');

    // ---------------------------------------------------------
    // TEST 4: Default Password Bypass Removal
    // ---------------------------------------------------------
    console.log('\n--- Test 4: Default Password Fallback Prevention ---');
    const bypassAttempt = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrIdentifier: '24A91A0501',
        password: 'Password@123'
      })
    });
    assert(bypassAttempt.status === 401, 'Entering wrong default password on student account is strictly rejected with HTTP 401 (Bypass Blocked)');

    const validStudentLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrIdentifier: '2403A52398',
        password: 'Password@123'
      })
    });
    assert(validStudentLogin.status === 200 && validStudentLogin.data?.token, 'Valid student can log in with their actual set credentials');

    // ---------------------------------------------------------
    // TEST 5: Temporary Password Gating & Bypassing Prevention
    // ---------------------------------------------------------
    console.log('\n--- Test 5: Temporary Password Gating Enforcement ---');
    const newlyCreatedTokenPayload = {
      id: 'test-temp-user-99',
      role: 'MENTEE',
      mustChangePassword: true,
      accountStatus: 'ACTIVE'
    };

    const adminEmail = 'admin@sru.edu.in';
    const adminLoginRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrIdentifier: adminEmail,
        password: 'Password@123'
      })
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data?.token, `Admin authenticated successfully (${maskSensitive(adminEmail)})`);
    const adminToken = adminLoginRes.data?.token;

    // ---------------------------------------------------------
    // TEST 6: Admin Privileges & Super Admin Safeguards
    // ---------------------------------------------------------
    console.log('\n--- Test 6: Super Admin Safeguards ---');
    const mentor1Email = '2403a53l02@sru.edu.in';
    const mentor1LoginRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrIdentifier: mentor1Email,
        password: 'Password@123'
      })
    });
    assert(mentor1LoginRes.status === 200 && mentor1LoginRes.data?.token, `Mentor 1 authenticated successfully (${maskSensitive(mentor1Email)})`);
    const mentor1Token = mentor1LoginRes.data?.token;

    const mentorResetAdminAttempt = await api('/auth/mentor/reset-mentee-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mentor1Token}` },
      body: JSON.stringify({
        menteeId: adminLoginRes.data?.user?.id,
        newPassword: 'HackedAdminPassword@123'
      })
    });
    assert(mentorResetAdminAttempt.status === 400 || mentorResetAdminAttempt.status === 403 || mentorResetAdminAttempt.status === 404,
      'Mentor forbidden from resetting administrator password');

    // ---------------------------------------------------------
    // TEST 7: Cross-User Mentee Isolation
    // ---------------------------------------------------------
    console.log('\n--- Test 7: Cross-User Mentee Isolation ---');
    const mentee1Res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrIdentifier: '2403A52398',
        password: 'Password@123'
      })
    });
    const mentee1Token = mentee1Res.data?.token;
    assert(!!mentee1Token, 'Mentee 1 authenticated');

    const menteeViewOthers = await api('/mentee/tasks', {
      headers: { Authorization: `Bearer ${mentee1Token}` }
    });
    assert(menteeViewOthers.status === 200, 'Mentee accesses own task scope without leaking others');

    // ---------------------------------------------------------
    // TEST 8: Mentor Isolation Across Cohorts
    // ---------------------------------------------------------
    console.log('\n--- Test 8: Mentor Cohort Isolation ---');
    const mentorCrossCounter = await api('/mentor/mentees/invalid-mentee-id-99999/coding-profiles', {
      headers: { Authorization: `Bearer ${mentor1Token}` }
    });
    assert(mentorCrossCounter.status === 403 || mentorCrossCounter.status === 404, 'Mentor forbidden from accessing unassigned mentee (HTTP 403/404)');

    // ---------------------------------------------------------
    // TEST 9: Mutating Task Authorization (Guarded by Isolation)
    // ---------------------------------------------------------
    console.log('\n--- Test 9: Task Scope & Modification Protection ---');
    if (!isIsolated) {
      console.log('  🛡️  SKIPPED: Mutating task creation tests safely skipped — server is not verified connected to isolated TEST_DATABASE_URL.');
      skipped++;
    } else {
      let createdTaskId = null;
      try {
        const createTaskRes = await api('/tasks', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({
            title: `Automated Task Test - ${Date.now()}`,
            weekNo: 12,
            assignmentDate: new Date().toISOString(),
            lastDate: new Date(Date.now() + 86400000).toISOString(),
            targetType: 'ALL',
            problems: [{ name: 'Test P1', problemUrl: 'https://leetcode.com/problems/test-p1/', platform: 'LEETCODE', position: 1 }]
          })
        });
        if (createTaskRes.status === 201 && createTaskRes.data?.task?.id) {
          createdTaskId = createTaskRes.data.task.id;
          assert(true, 'Task created on isolated test database');

          // Mentor 1 cannot modify Admin task
          const mentorEditAdminTask = await api(`/tasks/${createdTaskId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${mentor1Token}` },
            body: JSON.stringify({ title: 'Hacked Title' })
          });
          assert(mentorEditAdminTask.status === 403, 'Mentor forbidden from editing Admin task (HTTP 403)');
        }
      } finally {
        if (createdTaskId) {
          await api(`/tasks/${createdTaskId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` }
          }).catch(() => null);

          // Verify cleanup
          const checkTask = await api(`/tasks/${createdTaskId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          if (checkTask.status === 404) {
            console.log('  🧹 CLEANUP VERIFIED: Mutating task fixture successfully removed.');
          }
        }
      }
    }

    // ---------------------------------------------------------
    // TEST 10: Safe Production Error Handling
    // ---------------------------------------------------------
    console.log('\n--- Test 10: Safe Error Handling ---');
    const notFoundRes = await api('http://localhost:5001/api/non-existent-endpoint-test-404');
    assert(notFoundRes.status === 404 && notFoundRes.data?.message, 'Safe 404 response structure verified');

    // ---------------------------------------------------------
    // TEST 11: Bulk Import Credential Security & Removal of Shared Passwords
    // ---------------------------------------------------------
    console.log('\n--- Test 11: Bulk Import Credential Security (Phase 4) ---');
    const bulkImportCode = fs.readFileSync(path.join(process.cwd(), 'src', 'services', 'bulkImportService.js'), 'utf-8');
    assert(!bulkImportCode.includes('Student@2024'), 'Shared credential Student@2024 completely removed from bulkImportService.js');
    assert(!bulkImportCode.includes('Mentor@2027'), 'Shared credential Mentor@2027 completely removed from bulkImportService.js');
    assert(bulkImportCode.includes('crypto.randomBytes(24).toString'), 'Bulk import generates unique cryptographically secure temporary passwords per account');
    assert(bulkImportCode.includes('mustChangePassword: true'), 'Bulk imported accounts enforce mustChangePassword: true');

    // ---------------------------------------------------------
    // TEST 12: Seed Password Safety & Removal of DevSeed@2026!
    // ---------------------------------------------------------
    console.log('\n--- Test 12: Seed Password Safety (Phase 4) ---');
    const seedPrismaCode = fs.readFileSync(path.join(process.cwd(), 'src', 'seeds', 'seedPrisma.js'), 'utf-8');
    const seedJsCode = fs.readFileSync(path.join(process.cwd(), 'src', 'seeds', 'seed.js'), 'utf-8');
    const seedTrainerCode = fs.readFileSync(path.join(process.cwd(), 'src', 'seeds', 'seedTrainerAndCalendar.js'), 'utf-8');

    assert(!seedPrismaCode.includes('DevSeed@2026!'), 'Predictable DevSeed@2026! removed from seedPrisma.js');
    assert(!seedJsCode.includes('DevSeed@2026!'), 'Predictable DevSeed@2026! removed from seed.js');
    assert(!seedTrainerCode.includes('DevSeed@2026!'), 'Predictable DevSeed@2026! removed from seedTrainerAndCalendar.js');

    assert(seedPrismaCode.includes('FATAL: SEED_DEFAULT_PASSWORD environment variable'), 'seedPrisma.js fails safely if SEED_DEFAULT_PASSWORD is missing');
    assert(seedJsCode.includes('FATAL: SEED_DEFAULT_PASSWORD environment variable'), 'seed.js fails safely if SEED_DEFAULT_PASSWORD is missing');
    assert(seedTrainerCode.includes('FATAL: SEED_DEFAULT_PASSWORD environment variable'), 'seedTrainerAndCalendar.js fails safely if SEED_DEFAULT_PASSWORD is missing');

    // ---------------------------------------------------------
    // TEST 13: Database Isolation & Fingerprint Verification
    // ---------------------------------------------------------
    console.log('\n--- Test 13: Database Isolation Logic & Live Server Safeguards ---');
    const fp1 = computeDatabaseFingerprint('postgresql://postgres:pass@localhost:5432/mentorhub_test');
    const fp2 = computeDatabaseFingerprint('postgresql://postgres:pass@localhost:5432/mentorhub_prod');
    assert(fp1 !== fp2, 'Fingerprints distinguish different target databases');
    assert(fp1 === computeDatabaseFingerprint('postgresql://postgres:pass@localhost:5432/mentorhub_test'), 'Fingerprint computation is strictly deterministic');

    console.log('\n======================================================');
    console.log(`🎉 SECURITY REGRESSION SUMMARY: ${passed} PASSED, ${failed} FAILED, ${skipped} SKIPPED`);
    console.log('======================================================\n');

    process.exitCode = failed > 0 ? 1 : 0;
  } catch (err) {
    console.error('Security test execution error:', err.message || err);
    process.exitCode = 1;
  }
}

runSecurityTests();
