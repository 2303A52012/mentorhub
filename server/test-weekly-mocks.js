import prisma from './src/config/prisma.js';

const API_BASE = 'http://localhost:5001/api/v1';

async function runTests() {
  console.log('🧪 Starting Acceptance Tests for Weekly Mocks...');
  let passCount = 0;
  let failCount = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  };

  try {
    // Clean up any test sections from previous runs
    await prisma.mockSection.deleteMany({
      where: { title: { contains: 'DSA Graph Traversal Mock' } }
    });

    // 1. Authenticate Mentor
    console.log('\n--- Step 1: Authentication ---');
    const mentorLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrIdentifier: '2403a53l02@sru.edu.in', password: 'Password@123' })
    }).then((r) => r.json());

    assert(mentorLoginRes.success && mentorLoginRes.token, 'Mentor login successful with token');
    const mentorToken = mentorLoginRes.token;
    const mentorHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mentorToken}`
    };

    // Authenticate Mentee
    const menteeLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrIdentifier: '2403A52398', password: 'Password@123' })
    }).then((r) => r.json());

    assert(menteeLoginRes.success && menteeLoginRes.token, 'Mentee login successful with token');
    const menteeToken = menteeLoginRes.token;
    const menteeHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${menteeToken}`
    };
    const menteeId = menteeLoginRes.user.id;

    // 2. Acceptance Test 1 & 2: Create Mock Section without assigning slots
    console.log('\n--- Step 2: Create Mock Section in Draft ---');
    const createSectionRes = await fetch(`${API_BASE}/mentor/mocks`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        title: 'Week 5: DSA Graph Traversal Mock',
        weekNumber: 5,
        mockType: 'DSA',
        description: 'Test BFS, DFS, Dijkstra, and cycle detection in directed graphs.',
        defaultSlotDurationMinutes: 30,
        defaultVenue: 'Room 302, Lab Block',
        sessionStartDate: '2026-10-20',
        sessionEndDate: '2026-10-22'
      })
    }).then((r) => r.json());

    assert(createSectionRes.success && createSectionRes.section?.id, 'Mock section created successfully');
    const sectionId = createSectionRes.section.id;
    assert(createSectionRes.section.status === 'DRAFT', 'Section initialized in DRAFT mode');

    // 3. Acceptance Test 2 & 3: List mock sections and verify it appears in Current Mocks
    console.log('\n--- Step 3: List Sections and Check Summary ---');
    const listRes = await fetch(`${API_BASE}/mentor/mocks`, {
      headers: mentorHeaders
    }).then((r) => r.json());

    assert(listRes.success, 'Fetched mock sections list');
    const createdFound = listRes.sections.find((s) => s.id === sectionId);
    assert(createdFound && createdFound.weekNumber === 5, 'Newly created section listed with weekNumber 5');

    // 4. Acceptance Test 4: Assign time slot to mentee
    console.log('\n--- Step 4: Manual Time-Slot Assignment ---');
    // Ensure mentee is assigned to this mentor in DB so mentor is authorized
    await prisma.mentorMenteeAssignment.upsert({
      where: {
        mentorId_menteeId: {
          mentorId: mentorLoginRes.user.id,
          menteeId
        }
      },
      update: { status: 'ACTIVE' },
      create: {
        mentorId: mentorLoginRes.user.id,
        menteeId,
        status: 'ACTIVE'
      }
    });

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

    // 5. Acceptance Test 6: Overlap Conflicts Rejection
    console.log('\n--- Step 5: Overlap Conflicts Validation ---');
    // 5a. Evaluator overlap
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

    // 5b. Same room overlap
    const conflictRoomRes = await fetch(`${API_BASE}/mentor/mocks/${sectionId}/slots`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        menteeId,
        sessionDate: futureDate,
        startTime: '10:15',
        endTime: '10:45',
        roomNumber: 'Room 302'
      })
    }).then((r) => r.json());
    assert(!conflictRoomRes.success, 'Overlapping slot in same room rejected');

    // 5c. End time before start time
    const invalidTimesRes = await fetch(`${API_BASE}/mentor/mocks/${sectionId}/slots`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        menteeId,
        sessionDate: futureDate,
        startTime: '11:00',
        endTime: '10:30',
        roomNumber: 'Room 302'
      })
    }).then((r) => r.json());
    assert(!invalidTimesRes.success, 'End time <= Start time rejected');

    // 6. Acceptance Test 8: Unconfirmed Draft slots are invisible to Mentees
    console.log('\n--- Step 6: Draft Isolation from Mentee ---');
    const menteeMocksBeforePublish = await fetch(`${API_BASE}/mentee/mocks`, {
      headers: menteeHeaders
    }).then((r) => r.json());

    const draftSlotFound = (menteeMocksBeforePublish.upcoming || []).find((s) => s.id === slotId);
    assert(!draftSlotFound, 'Draft section slot is NOT visible to mentee before publication');

    // 7. Acceptance Test 5: Reschedule Slot
    console.log('\n--- Step 7: Reschedule Slot ---');
    const rescheduleRes = await fetch(`${API_BASE}/mentor/mocks/slots/${slotId}`, {
      method: 'PUT',
      headers: mentorHeaders,
      body: JSON.stringify({
        sessionDate: futureDate,
        startTime: '14:00',
        endTime: '14:30',
        roomNumber: 'Virtual Station A',
        reason: 'Adjusted to fit lab schedule'
      })
    }).then((r) => r.json());

    assert(rescheduleRes.success && rescheduleRes.slot?.startTime === '14:00', 'Slot successfully rescheduled to 14:00 - 14:30');

    // 8. Acceptance Test 7 & 8: Publish Schedule
    console.log('\n--- Step 8: Publish Schedule ---');
    const publishRes = await fetch(`${API_BASE}/mentor/mocks/${sectionId}/publish`, {
      method: 'POST',
      headers: mentorHeaders
    }).then((r) => r.json());

    assert(publishRes.success, 'Schedule published successfully');

    // Verify Mentee can now see the confirmed appointment!
    const menteeMocksAfterPublish = await fetch(`${API_BASE}/mentee/mocks`, {
      headers: menteeHeaders
    }).then((r) => r.json());

    const publishedSlotFound = (menteeMocksAfterPublish.upcoming || []).find((s) => s.id === slotId);
    assert(publishedSlotFound && publishedSlotFound.startTime === '14:00', 'Confirmed appointment is now visible to mentee');

    // 9. Acceptance Test 12: Invalid Scores Rejected
    console.log('\n--- Step 9: Score Evaluation Validation ---');
    const invalidScoreRes = await fetch(`${API_BASE}/mentor/mocks/slots/${slotId}/evaluate`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        overallScore: 12.5, // Invalid > 10
        technicalScore: 4.0,
        communicationScore: 3.5,
        problemSolvingScore: 4.0,
        recommendation: 'RECOMMENDED'
      })
    }).then((r) => r.json());
    assert(!invalidScoreRes.success, 'Invalid overall score > 10 correctly rejected');

    // 10. Acceptance Test 9, 10, 11: Valid Score Records Evaluation & Marks COMPLETED
    console.log('\n--- Step 10: Valid Evaluation & Complete Slot ---');
    const validEvalRes = await fetch(`${API_BASE}/mentor/mocks/slots/${slotId}/evaluate`, {
      method: 'POST',
      headers: mentorHeaders,
      body: JSON.stringify({
        overallScore: 8.5,
        technicalScore: 4.5,
        communicationScore: 4.0,
        problemSolvingScore: 4.0,
        recommendation: 'STRONGLY_RECOMMENDED',
        notes: 'Excellent grasp of Dijkstra algorithm and heap queue optimization. Articulated edge cases cleanly.'
      })
    }).then((r) => r.json());

    assert(validEvalRes.success && validEvalRes.evaluation?.overallScore === 8.5, 'Evaluation recorded with score 8.5/10');

    // Verify slot status is COMPLETED
    const sectionDetailRes = await fetch(`${API_BASE}/mentor/mocks/${sectionId}`, {
      headers: mentorHeaders
    }).then((r) => r.json());

    const completedSlot = sectionDetailRes.section.slots.find((s) => s.id === slotId);
    assert(completedSlot && completedSlot.status === 'COMPLETED', 'Slot status automatically transitioned to COMPLETED');
    assert(completedSlot.evaluation?.recommendation === 'STRONGLY_RECOMMENDED', 'Evaluation linked to slot with recommendation');

    // 11. Verify Mentee receives score breakdown
    const menteeMocksAfterEval = await fetch(`${API_BASE}/mentee/mocks`, {
      headers: menteeHeaders
    }).then((r) => r.json());

    const menteeHistorySlot = (menteeMocksAfterEval.history || []).find((s) => s.id === slotId);
    assert(
      menteeHistorySlot && menteeHistorySlot.evaluation?.overallScore === 8.5,
      'Mentee can view their released evaluation and feedback notes'
    );

    // 12. Acceptance Test 14 & 15: Security & Role Authorization
    console.log('\n--- Step 11: Security & Unauthorized Access ---');
    const unauthRes = await fetch(`${API_BASE}/mentor/mocks`).then((r) => r.status);
    assert(unauthRes === 401, 'Unauthenticated request rejected with 401');

    const menteeForbiddenRes = await fetch(`${API_BASE}/mentor/mocks`, {
      headers: menteeHeaders
    }).then((r) => r.status);
    assert(menteeForbiddenRes === 403, 'Mentee forbidden from mentor routes with 403');

    // 13. Acceptance Test 16: Existing Routes Regression Check
    console.log('\n--- Step 12: Regression Check on Existing Routes ---');
    const healthRes = await fetch('http://localhost:5001/api/health').then((r) => r.json());
    assert(healthRes.status === 'ok', 'Health check endpoint returns status ok');

    console.log(`\n==========================================`);
    console.log(`🎉 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`==========================================\n`);

    // Clean up test section
    await prisma.mockSection.deleteMany({
      where: { title: { contains: 'DSA Graph Traversal Mock' } }
    });

    if (failCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
