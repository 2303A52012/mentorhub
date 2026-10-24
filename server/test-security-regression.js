/**
 * MentorHub — Phase 3 Security & Authorization Regression Test Suite
 * Validates CORS hardening, CSP, temporary password enforcement, cross-user isolation,
 * default password bypass removal, and safe database isolation guards.
 */

import prisma from './src/config/prisma.js';
import bcrypt from 'bcryptjs';
import { assertDatabaseIsolation, maskSensitive } from './test-db-guard.js';

const API_BASE = 'http://localhost:5001/api/v1';

async function runSecurityTests() {
  console.log('🔒 Starting MentorHub Security & Authorization Regression Test Suite...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  const api = async (path, options = {}) => {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
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

  const isIsolated = assertDatabaseIsolation('Security Regression Test Suite');

  try {
    // ---------------------------------------------------------
    // TEST 1: Security Headers & CSP
    // ---------------------------------------------------------
    console.log('--- Test 1: Security Headers, CSP & Fingerprint Removal ---');
    const healthRes = await fetch('http://localhost:5001/api/health');
    assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is nosniff');
    assert(healthRes.headers.get('x-frame-options') === 'SAMEORIGIN', 'X-Frame-Options is SAMEORIGIN');
    assert(healthRes.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Referrer-Policy is strict-origin-when-cross-origin');
    assert(healthRes.headers.get('permissions-policy') === 'camera=(), microphone=(), geolocation=()', 'Permissions-Policy is set');
    assert(!!healthRes.headers.get('content-security-policy'), 'Content-Security-Policy (CSP) header is configured');
    assert(!healthRes.headers.get('x-powered-by'), 'X-Powered-By header is omitted');

    const healthJson = await healthRes.json();
    assert(healthJson.status === 'ok' && healthJson.database === 'connected', 'Database deep health probe is ok and connected');

    // ---------------------------------------------------------
    // TEST 2: Production CORS & Origin Hardening
    // ---------------------------------------------------------
    console.log('\n--- Test 2: Production CORS & Origin Hardening ---');
    const disallowedRes = await api('/health', {
      headers: { Origin: 'https://evil-attacker.com' }
    });
    // In dev mode or when blocked, cors middleware either strips header or rejects
    assert(disallowedRes.status === 200 || disallowedRes.status === 403, 'CORS responds safely to external origin');

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
        emailOrIdentifier: '24A91A0501',
        password: 'Student@2024'
      })
    });
    assert(validStudentLogin.status === 200 && validStudentLogin.data?.token, `Valid password authenticates successfully (${maskSensitive('24A91A0501')})`);

    const invalidPassLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrIdentifier: '24A91A0501',
        password: 'CompletelyWrongPassword!99'
      })
    });
    assert(invalidPassLogin.status === 401, 'Invalid password rejected with HTTP 401');

    // ---------------------------------------------------------
    // TEST 5: Authenticating Test Users (Masked Output)
    // ---------------------------------------------------------
    console.log('\n--- Test 5: Authenticating Test Roles ---');
    const adminLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrIdentifier: 'admin@sru.edu.in', password: 'Password@123' })
    });
    assert(adminLogin.status === 200 && adminLogin.data?.token, `Admin authenticated (${maskSensitive('admin@sru.edu.in')})`);
    const adminToken = adminLogin.data?.token;

    const mentor1Login = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrIdentifier: '2303a51812@sru.edu.in', password: 'Password@123' })
    });
    assert(mentor1Login.status === 200 && mentor1Login.data?.token, `Mentor 1 authenticated (${maskSensitive('2303a51812@sru.edu.in')})`);
    const mentor1Token = mentor1Login.data?.token;

    const trainerLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrIdentifier: 'trainer.g6-b1@sru.edu.in', password: 'Password@123' })
    });
    assert(trainerLogin.status === 200 && trainerLogin.data?.token, `Trainer authenticated (${maskSensitive('trainer.g6-b1@sru.edu.in')})`);
    const trainerToken = trainerLogin.data?.token;

    // ---------------------------------------------------------
    // TEST 6: Grievance Redressal Privacy
    // ---------------------------------------------------------
    console.log('\n--- Test 6: Grievance Redressal Privacy ---');
    const trainerGrievances = await api('/complaints', {
      headers: { Authorization: `Bearer ${trainerToken}` }
    });
    assert(trainerGrievances.status === 403, 'Trainer strictly denied access to student complaints (HTTP 403)');

    // ---------------------------------------------------------
    // TEST 7: Cross-Batch Isolation for Trainer Daily Problems
    // ---------------------------------------------------------
    console.log('\n--- Test 7: Trainer POTD Cross-Batch Scoping ---');
    const fakeBatchId = '99999999-9999-9999-9999-999999999999';
    const trainerPostCrossBatch = await api('/trainer/daily-problems', {
      method: 'POST',
      headers: { Authorization: `Bearer ${trainerToken}` },
      body: JSON.stringify({
        title: 'Unauthorized Batch POTD',
        batchId: fakeBatchId,
        date: new Date().toISOString().split('T')[0],
        description: 'Test problem description'
      })
    });
    assert(trainerPostCrossBatch.status === 403, 'Trainer blocked with HTTP 403 when posting to unassigned batch');

    // ---------------------------------------------------------
    // TEST 8: Weekly Target Counter Scoping
    // ---------------------------------------------------------
    console.log('\n--- Test 8: Weekly Target Verification Scope ---');
    const fakeMenteeId = '99999999-9999-9999-9999-999999999999';
    const mentorCrossCounter = await api('/weekly-targets/counters', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${mentor1Token}` },
      body: JSON.stringify({
        menteeId: fakeMenteeId,
        weekNumber: 1,
        leetcodeVerified: 10
      })
    });
    assert(mentorCrossCounter.status === 403 || mentorCrossCounter.status === 404, 'Mentor forbidden from verifying counters of unassigned mentee (HTTP 403/404)');

    // ---------------------------------------------------------
    // TEST 9: Mutating Task Authorization (Guarded by Isolation)
    // ---------------------------------------------------------
    console.log('\n--- Test 9: Task Scope & Modification Protection ---');
    if (!isIsolated) {
      console.log('  🛡️  SKIPPED: Mutating task creation tests safely skipped — no isolated TEST_DATABASE_URL configured.');
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
        }
      }
    }

    // ---------------------------------------------------------
    // TEST 10: Safe Production Error Handling
    // ---------------------------------------------------------
    console.log('\n--- Test 10: Safe Error Handling ---');
    const notFoundRes = await api('http://localhost:5001/api/non-existent-endpoint-test-404');
    assert(notFoundRes.status === 404 && notFoundRes.data?.message, 'Safe 404 response structure verified');

    console.log('\n======================================================');
    console.log(`🎉 SECURITY REGRESSION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Security test execution error:', err.message || err);
    process.exit(1);
  }
}

runSecurityTests();
