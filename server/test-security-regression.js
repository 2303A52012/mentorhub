/**
 * MentorHub — Phase 2 Security & Authorization Regression Test Suite
 * Validates cross-user, cross-batch, credential bypass, and task isolation security.
 */

import prisma from './src/config/prisma.js';
import bcrypt from 'bcryptjs';

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

  // Helper for requests
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
    } catch (e) {
      data = null;
    }
    return { status: res.status, headers: res.headers, data };
  };

  try {
    // ---------------------------------------------------------
    // TEST 1: Security Headers & Server Hardening
    // ---------------------------------------------------------
    console.log('--- Test 1: Security Headers & Fingerprint Removal ---');
    const healthRes = await fetch('http://localhost:5001/api/health');
    assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is nosniff');
    assert(healthRes.headers.get('x-frame-options') === 'SAMEORIGIN', 'X-Frame-Options is SAMEORIGIN');
    assert(healthRes.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Referrer-Policy is strict-origin-when-cross-origin');
    assert(healthRes.headers.get('permissions-policy') === 'camera=(), microphone=(), geolocation=()', 'Permissions-Policy is set');
    assert(!healthRes.headers.get('x-powered-by'), 'X-Powered-By header is removed');

    const healthJson = await healthRes.json();
    assert(healthJson.status === 'ok' && healthJson.database === 'connected', 'Database deep health probe is ok and connected');

    // ---------------------------------------------------------
    // TEST 2: Authentication & Cross-Default Password Bypass Prevention
    // ---------------------------------------------------------
    console.log('\n--- Test 2: Authentication & Password Fallback Prevention ---');
    
    // Verify cross-default password bypass is completely blocked
    // Account 24A91A0501 was imported with Student@2024. Entering Password@123 must return 401!
    const bypassAttempt = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrIdentifier: '24A91A0501',
        password: 'Password@123' // Wrong default password for this student
      })
    });
    assert(bypassAttempt.status === 401, 'Entering wrong default password (Password@123) on student account is strictly rejected with HTTP 401 (Bypass Blocked)');

    // Correct password Student@2024 for 24A91A0501 must succeed
    const validStudentLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrIdentifier: '24A91A0501',
        password: 'Student@2024'
      })
    });
    assert(validStudentLogin.status === 200 && validStudentLogin.data?.token, 'Correct password Student@2024 authenticates successfully with HTTP 200');

    // Test with completely invalid password
    const wrongPassAttempt = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrIdentifier: '24A91A0501',
        password: 'CompletelyWrongPassword!999'
      })
    });
    assert(wrongPassAttempt.status === 401, 'Invalid password rejected with HTTP 401');

    // ---------------------------------------------------------
    // TEST 3: User Setup for Authorization Tests
    // ---------------------------------------------------------
    console.log('\n--- Test 3: Authenticating Test Users ---');
    // Admin login
    const adminLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrIdentifier: 'admin@sru.edu.in', password: 'Password@123' })
    });
    const adminToken = adminLogin.data?.token;
    assert(adminLogin.status === 200 && adminToken, 'Admin authenticated successfully');

    // Mentor 1 login
    const mentor1Login = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrIdentifier: '2303a51812@sru.edu.in', password: 'Password@123' })
    });
    const mentor1Token = mentor1Login.data?.token;
    const mentor1Id = mentor1Login.data?.user?.id;
    assert(mentor1Login.status === 200 && mentor1Token, 'Mentor 1 authenticated successfully');

    // Find Mentor 2 in DB or login
    const mentor2 = await prisma.user.findFirst({
      where: { role: 'MENTOR', id: { not: mentor1Id }, accountStatus: 'ACTIVE' }
    });

    let mentor2Token = null;
    let mentor2Id = null;
    if (mentor2) {
      let mentor2Login = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrIdentifier: mentor2.email, password: 'Mentor@2027' })
      });
      if (mentor2Login.status !== 200) {
        mentor2Login = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ emailOrIdentifier: mentor2.email, password: 'Password@123' })
        });
      }
      if (mentor2Login.status === 200) {
        mentor2Token = mentor2Login.data?.token;
        mentor2Id = mentor2.id;
        assert(true, `Mentor 2 (${mentor2.email}) authenticated successfully`);
      }
    }

    // Mentee login with 2403A52398 / Password@123
    const menteeLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrIdentifier: '2403A52398', password: 'Password@123' })
    });
    const menteeToken = menteeLogin.data?.token;
    const menteeId = menteeLogin.data?.user?.id;
    assert(menteeLogin.status === 200 && menteeToken, 'Mentee authenticated successfully');

    // Trainer login (Batch 1 trainer)
    const trainerLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrIdentifier: 'trainer.g6-b1@sru.edu.in', password: 'Password@123' })
    });
    const trainerToken = trainerLogin.data?.token;
    const trainerId = trainerLogin.data?.user?.id;
    assert(trainerLogin.status === 200 && trainerToken, 'Corporate Trainer authenticated successfully');

    // ---------------------------------------------------------
    // TEST 4: Task Scope & Modification Protection
    // ---------------------------------------------------------
    console.log('\n--- Test 4: Task Scope & Cross-Mentor Authorization ---');

    // Admin creates an official university task
    const taskRes = await api('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Security Verification Week 10 Task',
        weekNo: 10,
        assignmentDate: new Date(),
        lastDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        instructions: 'Test isolation between mentors and trainers',
        targetType: 'CUSTOM',
        targetIds: [menteeId],
        problems: [
          { name: 'Binary Search', problemUrl: 'https://leetcode.com/problems/binary-search/', platform: 'LEETCODE' }
        ]
      })
    });
    const taskId = taskRes.data?.task?._id || taskRes.data?.task?.id;
    assert(taskRes.status === 201 && taskId, 'Admin created official task');

    if (taskId && mentor1Token) {
      // Mentor 1 attempts to edit Admin's task (must be forbidden!)
      const editAttempt = await api(`/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${mentor1Token}` },
        body: JSON.stringify({ title: 'Hacked Task Title by Mentor 1' })
      });
      assert(editAttempt.status === 403, 'Mentor 1 forbidden from editing Admin task (HTTP 403)');

      // Mentor 1 attempts to extend deadline of Admin's task (must be forbidden!)
      const extendAttempt = await api(`/tasks/${taskId}/extend-deadline`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${mentor1Token}` },
        body: JSON.stringify({ lastDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) })
      });
      assert(extendAttempt.status === 403, 'Mentor 1 forbidden from extending deadline of Admin task (HTTP 403)');

      // Mentor 1 attempts to assign Admin's task to students (must be forbidden!)
      const assignAttempt = await api(`/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${mentor1Token}` },
        body: JSON.stringify({ targetType: 'CUSTOM', targetIds: [menteeId] })
      });
      assert(assignAttempt.status === 403, 'Mentor 1 forbidden from assigning Admin task (HTTP 403)');

      // Mentor 1 creates their own mentor-specific task
      const mentorTaskRes = await api('/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${mentor1Token}` },
        body: JSON.stringify({
          title: 'Mentor 1 Exclusive Cohort Task',
          weekNo: 11,
          assignmentDate: new Date(),
          lastDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          instructions: 'Exclusive to Mentor 1 mentees',
          targetType: 'CUSTOM',
          targetIds: [],
          problems: [
            { name: 'Two Sum', problemUrl: 'https://leetcode.com/problems/two-sum/', platform: 'LEETCODE' }
          ]
        })
      });
      const mentorTaskId = mentorTaskRes.data?.task?._id || mentorTaskRes.data?.task?.id;
      assert(mentorTaskRes.status === 201 && mentorTaskId, 'Mentor 1 created own cohort task');

      if (mentorTaskId && mentor2Token) {
        // Mentor 2 attempts to edit Mentor 1's task (must be forbidden!)
        const crossEdit = await api(`/tasks/${mentorTaskId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${mentor2Token}` },
          body: JSON.stringify({ title: 'Overwritten by Mentor 2' })
        });
        assert(crossEdit.status === 403, 'Mentor 2 forbidden from modifying Mentor 1 task (HTTP 403)');

        // Mentor 2 attempts to view Mentor 1's task details (must be forbidden!)
        const crossView = await api(`/tasks/${mentorTaskId}`, {
          headers: { Authorization: `Bearer ${mentor2Token}` }
        });
        assert(crossView.status === 403, 'Mentor 2 forbidden from viewing Mentor 1 private task (HTTP 403)');
      }

      // Cleanup created test task
      await api(`/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (mentorTaskId) {
        await api(`/tasks/${mentorTaskId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${mentor1Token}` }
        });
      }
    }

    // ---------------------------------------------------------
    // TEST 5: Daily Problem Cross-Batch Isolation
    // ---------------------------------------------------------
    console.log('\n--- Test 5: Daily Problem Cross-Batch Isolation ---');

    // Find Batch 4 in database
    const batch4 = await prisma.batch.findFirst({
      where: { name: { contains: 'B4' } }
    });

    if (batch4 && trainerToken) {
      // Trainer 1 is assigned to Batch 1. Attempting to create or view daily problem for Batch 4 must return 403!
      const unauthorizedDailyProblem = await api('/trainer/daily-problems', {
        method: 'POST',
        headers: { Authorization: `Bearer ${trainerToken}` },
        body: JSON.stringify({
          batchId: batch4.id,
          title: 'Unauthorized Cross-Batch Problem',
          platform: 'LEETCODE',
          link: 'https://leetcode.com/problems/climbing-stairs/'
        })
      });
      assert(unauthorizedDailyProblem.status === 403, 'Trainer 1 blocked with HTTP 403 when posting to unassigned Batch 4');
    }

    // Find an existing daily problem in Batch 2, 3, or 4
    const otherBatchProblem = await prisma.dailyProblem.findFirst({
      where: {
        batch: { name: { not: { contains: 'B1' } } }
      }
    });

    if (otherBatchProblem && trainerToken) {
      const viewOtherProblem = await api(`/trainer/daily-problems/${otherBatchProblem.id}`, {
        headers: { Authorization: `Bearer ${trainerToken}` }
      });
      assert(viewOtherProblem.status === 403, 'Trainer 1 blocked with HTTP 403 when viewing daily problem from unassigned batch');

      const viewOtherSubmissions = await api(`/trainer/daily-problems/${otherBatchProblem.id}/submissions`, {
        headers: { Authorization: `Bearer ${trainerToken}` }
      });
      assert(viewOtherSubmissions.status === 403, 'Trainer 1 blocked with HTTP 403 when viewing submissions from unassigned batch');
    }

    // ---------------------------------------------------------
    // TEST 6: Grievance Privacy & Unauthorized Role Access
    // ---------------------------------------------------------
    console.log('\n--- Test 6: Grievance Redressal Privacy ---');
    const existingComplaint = await prisma.complaint.findFirst();
    if (existingComplaint && trainerToken) {
      const trainerComplaintView = await api(`/complaints/${existingComplaint.id}`, {
        headers: { Authorization: `Bearer ${trainerToken}` }
      });
      assert(trainerComplaintView.status === 403, 'Trainer strictly denied access to student complaints (HTTP 403)');
    }

    // ---------------------------------------------------------
    // TEST 7: Weekly Target Coding Counter Verification IDOR
    // ---------------------------------------------------------
    console.log('\n--- Test 7: Weekly Target Verification Scope ---');
    // Find a student not assigned to Mentor 1
    const unassignedMentee = await prisma.user.findFirst({
      where: {
        role: 'MENTEE',
        menteeAssignments: {
          none: { mentorId: mentor1Id }
        }
      }
    });

    if (unassignedMentee && mentor1Token) {
      const verifyAttempt = await api('/weekly-targets/counters', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${mentor1Token}` },
        body: JSON.stringify({
          menteeId: unassignedMentee.id,
          verifiedLeetCodeCount: 150
        })
      });
      assert(verifyAttempt.status === 403, 'Mentor 1 forbidden from verifying counters of unassigned mentee (HTTP 403)');
    }

    console.log('\n======================================================');
    console.log(`🎉 SECURITY REGRESSION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runSecurityTests();
