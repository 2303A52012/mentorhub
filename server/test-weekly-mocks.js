import prisma from './src/config/prisma.js';
import { assertDatabaseIsolation, verifyServerDatabaseIsolation, maskSensitive } from './test-db-guard.js';

const API_BASE = 'http://localhost:5001/api/v1';

async function runTests() {
  console.log('🧪 Starting Acceptance Tests for Weekly Mocks...');
  let passCount = 0;
  let failCount = 0;
  let sectionId = null;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  };

  const serverIsolation = await verifyServerDatabaseIsolation(API_BASE);
  const isIsolated = assertDatabaseIsolation('Weekly Mocks Acceptance Suite', serverIsolation);

  try {
    // 1. Non-mutating Security & Role Authorization Assertions (always safe to run)
    console.log('\n--- Step 1: Security & Unauthorized Access ---');
    const unauthRes = await fetch(`${API_BASE}/mentor/mocks`).then((r) => r.status);
    assert(unauthRes === 401, 'Unauthenticated request rejected with 401');

    const healthRes = await fetch('http://localhost:5001/api/health').then((r) => r.json());
    assert(healthRes.status === 'ok' && healthRes.database === 'connected', 'Health check endpoint returns status ok with database connected');

    // If database isolation is not established, safely skip mutating tests
    if (!isIsolated) {
      console.log('\n==========================================');
      console.log(`🎉 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED, 7 MUTATING TESTS SKIPPED`);
      console.log(`   (Mutating tests safely skipped: live server is not verified connected to isolated TEST_DATABASE_URL)`);
      console.log('==========================================\n');
      process.exitCode = failCount > 0 ? 1 : 0;
      return;
    }

    // 2. Mutating Tests on Verified Isolated Test Database
    console.log('\n--- Step 2: Authentication on Isolated Test Database ---');
    const mentorEmail = '2403a53l02@sru.edu.in';
    const mentorLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrIdentifier: mentorEmail, password: 'Password@123' })
    }).then((r) => r.json());

    assert(mentorLoginRes.success && mentorLoginRes.token, `Mentor login successful (${maskSensitive(mentorEmail)})`);
    const mentorToken = mentorLoginRes.token;
    const mentorHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mentorToken}`
    };

    const menteeIdentifier = '2403A52398';
    const menteeLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrIdentifier: menteeIdentifier, password: 'Password@123' })
    }).then((r) => r.json());

    assert(menteeLoginRes.success && menteeLoginRes.token, `Mentee login successful (${maskSensitive(menteeIdentifier)})`);
    const menteeToken = menteeLoginRes.token;
    const menteeHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${menteeToken}`
    };
    const menteeId = menteeLoginRes.user.id;

    // Check mentee authorization boundary
    const menteeForbiddenRes = await fetch(`${API_BASE}/mentor/mocks`, {
      headers: menteeHeaders
    }).then((r) => r.status);
    assert(menteeForbiddenRes === 403, 'Mentee forbidden from mentor routes with 403');

    // Create Mock Section in Draft
    console.log('\n--- Step 3: Create Mock Section in Draft ---');
    const createSectionRes = await fetch(`${API_BASE}/mentor/mocks`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        title: `DSA Graph Traversal Mock - ${Date.now()}`,
        weekNumber: 5,
        targetBatches: ['G6-B1', 'G6-B2']
      })
    }).then((r) => r.json());

    assert(createSectionRes.success && createSectionRes.section?.id, 'Mock section created successfully');
    assert(createSectionRes.section?.status === 'DRAFT', 'Section initialized in DRAFT mode');
    sectionId = createSectionRes.section.id;

    // Manual Time-Slot Assignment
    console.log('\n--- Step 4: Manual Time-Slot Assignment ---');
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const assignSlotRes = await fetch(`${API_BASE}/mentor/mocks/${sectionId}/slots`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        menteeId,
        sessionDate: futureDate,
        startTime: '10:00',
        endTime: '10:30',
        roomNumber: 'Room 302'
      })
    }).then((r) => r.json());

    assert(assignSlotRes.success && assignSlotRes.slot?.id, 'Candidate assigned to slot 10:00 - 10:30');
    const slotId = assignSlotRes.slot.id;

    // Overlap Conflicts Validation
    console.log('\n--- Step 5: Overlap Conflicts Validation ---');
    const conflictEvaluatorRes = await fetch(`${API_BASE}/mentor/mocks/${sectionId}/slots`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        menteeId,
        sessionDate: futureDate,
        startTime: '10:15',
        endTime: '10:45',
        roomNumber: 'Room 999'
      })
    }).then((r) => r.json());
    assert(!conflictEvaluatorRes.success, 'Overlapping slot on same evaluator rejected');

    const conflictRoomRes = await fetch(`${API_BASE}/mentor/mocks/${sectionId}/slots`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        menteeId,
        sessionDate: futureDate,
        startTime: '10:00',
        endTime: '10:30',
        roomNumber: 'Room 302'
      })
    }).then((r) => r.json());
    assert(!conflictRoomRes.success, 'Overlapping slot in same room rejected');

    const invalidTimesRes = await fetch(`${API_BASE}/mentor/mocks/${sectionId}/slots`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        menteeId,
        sessionDate: futureDate,
        startTime: '11:30',
        endTime: '11:00',
        roomNumber: 'Room 101'
      })
    }).then((r) => r.json());
    assert(!invalidTimesRes.success, 'End time <= Start time rejected');

    // Draft Isolation
    console.log('\n--- Step 6: Draft Isolation from Mentee ---');
    const menteeMocksRes = await fetch(`${API_BASE}/mentee/mocks`, {
      headers: menteeHeaders
    }).then((r) => r.json());
    const visibleDraftSlots = (menteeMocksRes.upcoming || []).filter((s) => s.id === slotId);
    assert(visibleDraftSlots.length === 0, 'Draft section slot is NOT visible to mentee before publication');

    // Publish Section
    console.log('\n--- Step 7: Publish Schedule ---');
    const publishRes = await fetch(`${API_BASE}/mentor/mocks/${sectionId}/publish`, {
      method: 'POST',
      headers: mentorHeaders
    }).then((r) => r.json());
    assert(publishRes.success, 'Schedule published successfully');

    const menteeMocksPublished = await fetch(`${API_BASE}/mentee/mocks`, {
      headers: menteeHeaders
    }).then((r) => r.json());
    const publishedSlot = (menteeMocksPublished.upcoming || []).find((s) => s.id === slotId);
    assert(!!publishedSlot, 'Confirmed appointment is now visible to mentee');

    // Score Evaluation Validation
    console.log('\n--- Step 8: Score Evaluation Validation ---');
    const invalidScoreRes = await fetch(`${API_BASE}/mentor/mocks/slots/${slotId}/evaluate`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        overallScore: 11,
        technicalScore: 4,
        communicationScore: 4,
        problemSolvingScore: 4,
        recommendation: 'STRONGLY_RECOMMENDED',
        notes: 'Out of bounds score test'
      })
    }).then((r) => r.json());
    assert(!invalidScoreRes.success, 'Invalid overall score > 10 correctly rejected');

    // Valid Evaluation
    const evalRes = await fetch(`${API_BASE}/mentor/mocks/slots/${slotId}/evaluate`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        overallScore: 8.5,
        technicalScore: 4,
        communicationScore: 4.5,
        problemSolvingScore: 4,
        recommendation: 'RECOMMENDED',
        notes: 'Solid graph theory fundamentals and clear communication.'
      })
    }).then((r) => r.json());

    assert(evalRes.success && evalRes.slot?.status === 'COMPLETED', 'Evaluation recorded and slot status transitioned to COMPLETED');

    console.log(`\n==========================================`);
    console.log(`🎉 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`==========================================\n`);

    process.exitCode = failCount > 0 ? 1 : 0;
  } catch (err) {
    console.error('Test execution error:', err.message || err);
    process.exitCode = 1;
  } finally {
    // Guaranteed reliable cleanup of test fixtures
    if (sectionId && isIsolated) {
      try {
        await prisma.mockSlotHistory.deleteMany({ where: { slot: { sectionId } } }).catch(() => null);
        await prisma.mockEvaluation.deleteMany({ where: { slot: { sectionId } } }).catch(() => null);
        await prisma.mockSlot.deleteMany({ where: { sectionId } }).catch(() => null);
        await prisma.mockSection.deleteMany({ where: { id: sectionId } }).catch(() => null);

        const checkSection = await prisma.mockSection.findUnique({ where: { id: sectionId } }).catch(() => null);
        if (!checkSection) {
          console.log('  🧹 CLEANUP VERIFIED: Test mock section and related slots successfully removed.');
        } else {
          console.warn('  ⚠️ CLEANUP WARNING: Test section still present after cleanup.');
        }
      } catch (cleanErr) {
        console.error('Cleanup error:', cleanErr.message || cleanErr);
      }
    }
  }
}

runTests();
