import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import prisma from './src/config/prisma.js';
import bcrypt from 'bcryptjs';
import { assertDatabaseIsolation, verifyServerDatabaseIsolation, maskSensitive } from './test-db-guard.js';

const API_BASE = 'http://localhost:5001/api/v1';

async function runTests() {
  console.log('🚀 Starting Bulk Import Verification Tests...\n');
  let passCount = 0;
  let failCount = 0;
  const tempFiles = [];

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
  const isIsolated = assertDatabaseIsolation('Bulk Import Verification Suite', serverIsolation);

  try {
    // 1. Authenticate Admin (read-only token acquisition)
    const adminEmail = 'admin@sru.edu.in';
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrIdentifier: adminEmail,
        password: 'Password@123'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    assert(!!adminToken, `Admin authenticated successfully (${maskSensitive(adminEmail)})`);

    // 2. Authenticate Mentor
    const mentorEmail = '2303a51812@sru.edu.in';
    const mentorLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrIdentifier: mentorEmail,
        password: 'Password@123'
      })
    });
    const mentorLoginData = await mentorLoginRes.json();
    const mentorToken = mentorLoginData.token;
    assert(!!mentorToken, `Mentor authenticated successfully (${maskSensitive(mentorEmail)})`);

    // 3. Test Security & RBAC: Mentor trying to access Bulk Import endpoints
    console.log('\n--- Step 1: Role-Based Access Control ---');
    const mentorHistoryRes = await fetch(`${API_BASE}/bulk-import/history`, {
      headers: { Authorization: `Bearer ${mentorToken}` }
    });
    assert(mentorHistoryRes.status === 403, 'Mentor blocked with HTTP 403 Forbidden on /bulk-import/history');

    // 4. Test Template Download (Non-mutating)
    console.log('\n--- Step 2: Template Download Endpoint ---');
    const templateRes = await fetch(`${API_BASE}/bulk-import/template?format=xlsx`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const templateBuffer = await templateRes.arrayBuffer();
    assert(templateBuffer.byteLength > 1000, `Downloaded valid Excel template (${templateBuffer.byteLength} bytes)`);

    // 5. Test History Query (Non-mutating)
    console.log('\n--- Step 3: Import History Query ---');
    const historyRes = await fetch(`${API_BASE}/bulk-import/history`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(historyRes.status === 200, 'Admin can view import history log');

    // If database is not verified isolated, safely skip mutating import commit
    if (!isIsolated) {
      console.log('\n==========================================');
      console.log(`🎉 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED, 2 MUTATING TESTS SKIPPED`);
      console.log(`   (Mutating bulk commit safely skipped: live server is not verified connected to isolated TEST_DATABASE_URL)`);
      console.log('==========================================\n');
      process.exitCode = failCount > 0 ? 1 : 0;
      return;
    }

    // 6. Mutating Excel Preview and Confirm (Only on isolated test DB)
    console.log('\n--- Step 4: Preview and Confirm on Isolated Test Database ---');
    const tempFile = path.join(process.cwd(), `temp_test_mapping_${Date.now()}.xlsx`);
    tempFiles.push(tempFile);

    const testRows = [
      {
        'Sl No': 1,
        'Roll No': 'TEST_99A01',
        'Student Name': 'Test Student One',
        Branch: 'CSE',
        Nbatch: 'G6-B1',
        'Mentor Roll No': 'FAC-TEST-001',
        'Mentor Name': 'Dr. Test Mentor',
        LeetCode: 'https://leetcode.com/test_student_one',
        Codeforce: 'test_student_one',
        Hackerrank: 'test_student_one',
        Linkedin: 'https://linkedin.com/in/test_student_one',
        Github: 'https://github.com/test_student_one',
        Resume: 'https://drive.google.com/test_student_one'
      }
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(testRows);
    xlsx.utils.book_append_sheet(wb, ws, 'Mapping Data');
    xlsx.writeFile(wb, tempFile);

    const fileData = fs.readFileSync(tempFile);
    const blob = new Blob([fileData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const formData = new FormData();
    formData.append('file', blob, path.basename(tempFile));

    const previewRes = await fetch(`${API_BASE}/bulk-import/preview`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData
    });
    const previewData = await previewRes.json();
    assert(previewData.success && previewData.data?.totalRows === 1, 'File preview correctly parsed 1 row');

    const sessionId = previewData.data?.sessionId;
    if (sessionId) {
      const confirmRes = await fetch(`${API_BASE}/bulk-import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ sessionId, mode: 'CREATE' })
      });
      const confirmData = await confirmRes.json();
      assert(confirmData.success, 'Bulk import execution succeeded on isolated test database');
    }

    console.log(`\n==========================================`);
    console.log(`🎉 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`==========================================\n`);

    process.exitCode = failCount > 0 ? 1 : 0;
  } catch (err) {
    console.error('Test execution error:', err.message || err);
    process.exitCode = 1;
  } finally {
    // Guaranteed cleanup of temp files
    tempFiles.forEach((f) => {
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch {}
      }
    });

    // Cleanup test records on isolated DB and verify removal
    if (isIsolated) {
      try {
        await prisma.codingProfile.deleteMany({ where: { mentee: { menteeProfile: { rollNumber: 'TEST_99A01' } } } }).catch(() => null);
        await prisma.menteeProfile.deleteMany({ where: { rollNumber: 'TEST_99A01' } }).catch(() => null);
        await prisma.user.deleteMany({ where: { email: { contains: 'test_99a01' } } }).catch(() => null);
        await prisma.user.deleteMany({ where: { email: { contains: 'fac-test-001' } } }).catch(() => null);

        const remaining = await prisma.user.findMany({
          where: { OR: [{ email: { contains: 'test_99a01' } }, { email: { contains: 'fac-test-001' } }] }
        }).catch(() => []);
        if (remaining.length === 0) {
          console.log('  🧹 CLEANUP VERIFIED: Bulk import test fixtures successfully removed from database.');
        } else {
          console.warn(`  ⚠️ CLEANUP WARNING: ${remaining.length} test records still present.`);
        }
      } catch (cleanErr) {
        console.error('Cleanup error:', cleanErr.message || cleanErr);
      }
    }
  }
}

runTests();
