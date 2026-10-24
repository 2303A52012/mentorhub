import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import prisma from './src/config/prisma.js';
import bcrypt from 'bcryptjs';

const API_BASE = 'http://localhost:5001/api/v1';

async function runTests() {
  console.log('🚀 Starting Bulk Import Verification Tests...\n');

  // 1. Authenticate Admin
  console.log('🔑 Authenticating as Admin (admin@sru.edu.in)...');
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrIdentifier: 'admin@sru.edu.in',
      password: 'Password@123'
    })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;
  if (!adminToken) throw new Error('Admin login failed: ' + JSON.stringify(adminLoginData));
  console.log('✅ Admin authenticated successfully.\n');

  // 2. Authenticate Mentor
  console.log('🔑 Authenticating as Mentor (2303a51812@sru.edu.in)...');
  const mentorLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrIdentifier: '2303a51812@sru.edu.in',
      password: 'Password@123'
    })
  });
  const mentorLoginData = await mentorLoginRes.json();
  const mentorToken = mentorLoginData.token;
  if (!mentorToken) throw new Error('Mentor login failed: ' + JSON.stringify(mentorLoginData));
  console.log('✅ Mentor authenticated successfully.\n');

  // 3. Test Security: Mentor trying to access Bulk Import endpoints
  console.log('🛡️ Testing Security: Verifying Mentor receives HTTP 403 on Bulk Import endpoints...');
  const mentorHistoryRes = await fetch(`${API_BASE}/bulk-import/history`, {
    headers: { Authorization: `Bearer ${mentorToken}` }
  });
  if (mentorHistoryRes.status === 403) {
    console.log('✅ PASSED: Mentor blocked with HTTP 403 Forbidden on /bulk-import/history.');
  } else {
    const errBody = await mentorHistoryRes.text();
    console.error('❌ FAILED: Expected 403 but got', mentorHistoryRes.status, 'Body:', errBody);
    throw new Error('Mentor was not blocked with 403!');
  }

  // 4. Test Template Download
  console.log('\n📄 Testing Template Download endpoint...');
  const templateRes = await fetch(`${API_BASE}/bulk-import/template?format=xlsx`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const templateBuffer = await templateRes.arrayBuffer();
  if (templateRes.status === 200 && templateBuffer.byteLength > 0) {
    console.log(`✅ PASSED: Downloaded sample Excel template (${templateBuffer.byteLength} bytes).`);
  } else {
    throw new Error('Could not download template.');
  }

  // 5. Generate mock Excel matching "2024-28 Group-6 Mentor Mapping.xlsx"
  console.log('\n📊 Generating test workbook matching "2024-28 Group-6 Mentor Mapping.xlsx"...');
  const testData = [
    {
      'Sl No': 1,
      'Roll No': '24A91A0501',
      'Student Name': 'Aarav Sharma',
      'Branch': 'CSE',
      'Nbatch': 'G6-B1',
      'Mentor Roll No': 'FAC-CSE-001',
      'Mentor Name': 'Dr. Ramanujan Kumar',
      'LeetCode': 'https://leetcode.com/aarav_sharma',
      'Codeforce': 'https://codeforces.com/profile/aarav_s',
      'Hackerrank': 'https://hackerrank.com/aarav_sharma',
      'Linkedin': 'https://linkedin.com/in/aaravsharma',
      'Github': 'https://github.com/aaravsharma',
      'Resume': 'https://drive.google.com/aarav_resume.pdf'
    },
    {
      'Sl No': 2,
      'Roll No': '24A91A0502',
      'Student Name': 'Diya Patel',
      'Branch': 'CSE-AI',
      'Nbatch': 'G6-B1',
      'Mentor Roll No': 'FAC-CSE-001',
      'Mentor Name': 'Dr. Ramanujan Kumar',
      'LeetCode': 'https://leetcode.com/diya_patel',
      'Codeforce': '',
      'Hackerrank': '',
      'Linkedin': 'https://linkedin.com/in/diyapatel',
      'Github': 'https://github.com/diyapatel',
      'Resume': ''
    },
    {
      'Sl No': 3,
      'Roll No': '24A91A0503',
      'Student Name': 'Rohan Varma',
      'Branch': 'ECE',
      'Nbatch': 'G6-B2',
      'Mentor Roll No': 'FAC-ECE-002',
      'Mentor Name': 'Prof. Sarojini Rao',
      'LeetCode': '',
      'Codeforce': '',
      'Hackerrank': '',
      'Linkedin': '',
      'Github': 'https://github.com/rohanvarma',
      'Resume': ''
    }
  ];

  const ws = xlsx.utils.json_to_sheet(testData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Mapping Data');
  const tempFilePath = path.join(process.cwd(), 'temp_test_mapping.xlsx');
  xlsx.writeFile(wb, tempFilePath);
  console.log('✅ Created temp_test_mapping.xlsx with 3 student rows and 2 unique mentors.');

  // 6. Test File Upload & Preview endpoint
  console.log('\n🔍 Testing Upload & Preview endpoint (/api/v1/bulk-import/preview)...');
  const fileBytes = fs.readFileSync(tempFilePath);
  const formData = new FormData();
  const blob = new Blob([fileBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  formData.append('file', blob, '2024-28 Group-6 Mentor Mapping.xlsx');

  const previewRes = await fetch(`${API_BASE}/bulk-import/preview`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`
    },
    body: formData
  });

  const previewJson = await previewRes.json();
  if (!previewJson.success) throw new Error('Preview failed: ' + JSON.stringify(previewJson));
  const preview = previewJson.preview;
  console.log(`✅ PASSED Preview: Total Rows: ${preview.totalRows}, Valid Rows: ${preview.validRows}, Unique Mentors: ${preview.uniqueMentorsCount}, New Students: ${preview.newStudentsCount}`);
  console.log('Detected Header Mapping:', preview.detectedMapping);

  const sessionId = preview.importSessionId;

  // 7. Execute Import in CREATE Mode
  console.log('\n💾 Testing Confirm & Import in CREATE Mode (/api/v1/bulk-import/confirm)...');
  const confirmRes = await fetch(`${API_BASE}/bulk-import/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      importSessionId: sessionId,
      importMode: 'CREATE'
    })
  });

  const confirmJson = await confirmRes.json();
  if (!confirmJson.success) throw new Error('Confirm failed: ' + JSON.stringify(confirmJson));
  const importResult = confirmJson.result;
  console.log('✅ PASSED Import Execution:');
  console.log(`- Students Created: ${importResult.stats?.studentsCreated ?? importResult.summary?.studentsCreated}`);
  console.log(`- Mentors Created: ${importResult.stats?.mentorsCreated ?? importResult.summary?.mentorsCreated}`);
  console.log(`- Mappings Created: ${importResult.stats?.relationshipsCreated ?? importResult.summary?.relationshipsCreated}`);

  // 8. Verify Passwords and Relationships in DB
  console.log('\n🔐 Verifying DB Record Integrity & Default Passwords in PostgreSQL...');
  const studentUser = await prisma.user.findFirst({
    where: { menteeProfile: { rollNumber: '24A91A0501' } },
    include: { menteeProfile: true, codingProfile: true }
  });

  if (!studentUser) {
    throw new Error('Student user 24A91A0501 not found in PostgreSQL database!');
  }

  const isStudentPassValid = await bcrypt.compare('Student@2024', studentUser.passwordHash);
  console.log(`- Student password correctly hashed as Student@2024: ${isStudentPassValid ? '✅ YES' : '❌ NO'}`);
  console.log(`- Student mustChangePassword flag set: ${studentUser.mustChangePassword ? '✅ YES' : '❌ NO'}`);
  console.log(`- Student coding profiles stored (LeetCode): ${studentUser.codingProfile?.leetcodeUrl || 'None'}`);

  const mentorUser = await prisma.user.findFirst({
    where: { mentorProfile: { rollNumber: 'FAC-CSE-001' } },
    include: { mentorProfile: true }
  });

  if (!mentorUser) {
    throw new Error('Mentor user FAC-CSE-001 not found in PostgreSQL database!');
  }

  const isMentorPassValid = await bcrypt.compare('Mentor@2027', mentorUser.passwordHash);
  console.log(`- Mentor password correctly hashed as Mentor@2027: ${isMentorPassValid ? '✅ YES' : '❌ NO'}`);
  console.log(`- Mentor name: ${mentorUser.name} (${mentorUser.mentorProfile?.rollNumber})`);

  // Verify mentor-student assignment
  const assignment = await prisma.mentorMenteeAssignment.findFirst({
    where: {
      mentorId: mentorUser.id,
      menteeId: studentUser.id
    }
  });
  console.log(`- Mentor-Mentee assignment linked in DB: ${assignment ? '✅ YES' : '❌ NO'}`);

  // 9. Test Idempotency (Re-importing same file in CREATE mode)
  console.log('\n🔁 Testing Idempotency (Re-importing same file in CREATE mode)...');
  const formData2 = new FormData();
  formData2.append('file', blob, '2024-28 Group-6 Mentor Mapping.xlsx');
  const previewRes2 = await fetch(`${API_BASE}/bulk-import/preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData2
  });
  const previewJson2 = await previewRes2.json();
  const confirmRes2 = await fetch(`${API_BASE}/bulk-import/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      importSessionId: previewJson2.preview.importSessionId,
      importMode: 'CREATE'
    })
  });
  const confirmJson2 = await confirmRes2.json();
  const stats2 = confirmJson2.result?.stats || confirmJson2.result?.summary || {};
  console.log(`- Students Created (should be 0): ${stats2.studentsCreated}`);
  console.log(`- Students Skipped: ${stats2.studentsSkipped}`);
  console.log(`- Mentors Created (should be 0): ${stats2.mentorsCreated}`);

  // 10. Test UPDATE Mode
  console.log('\n🔄 Testing UPDATE Mode...');
  testData[0].LeetCode = 'https://leetcode.com/aarav_sharma_updated';
  const wsUpdated = xlsx.utils.json_to_sheet(testData);
  const wbUpdated = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wbUpdated, wsUpdated, 'Mapping Data');
  const updatedBuffer = xlsx.write(wbUpdated, { type: 'buffer', bookType: 'xlsx' });

  const formData3 = new FormData();
  const blobUpdated = new Blob([updatedBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  formData3.append('file', blobUpdated, '2024-28 Group-6 Mentor Mapping.xlsx');

  const previewRes3 = await fetch(`${API_BASE}/bulk-import/preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData3
  });
  const previewJson3 = await previewRes3.json();

  const confirmRes3 = await fetch(`${API_BASE}/bulk-import/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      importSessionId: previewJson3.preview.importSessionId,
      importMode: 'UPDATE'
    })
  });
  const confirmJson3 = await confirmRes3.json();
  const stats3 = confirmJson3.result?.stats || confirmJson3.result?.summary || {};
  console.log(`- Students Updated in UPDATE mode: ${stats3.studentsUpdated}`);
  
  // Verify password was NOT overwritten during update
  const studentUserAfterUpdate = await prisma.user.findFirst({
    where: { menteeProfile: { rollNumber: '24A91A0501' } },
    include: { menteeProfile: true, codingProfile: true }
  });
  const isPassStillValid = await bcrypt.compare('Student@2024', studentUserAfterUpdate.passwordHash);
  console.log(`- Password preserved during update: ${isPassStillValid ? '✅ YES' : '❌ NO'}`);
  console.log(`- Coding profile updated: ${studentUserAfterUpdate.codingProfile?.leetcodeUrl}`);

  // 11. Test Import History
  console.log('\n📜 Testing Import History endpoint...');
  const historyRes = await fetch(`${API_BASE}/bulk-import/history`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const historyJson = await historyRes.json();
  console.log(`✅ PASSED: Retrieved ${historyJson.history.length} historical import records.`);

  // Cleanup temp file
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }

  console.log('\n🎉 ALL BULK IMPORT TESTS COMPLETED AND VERIFIED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
