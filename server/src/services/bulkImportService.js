import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import {
  STANDARD_FIELDS,
  autoDetectMapping,
  sanitizeCellValue
} from '../utils/columnMapper.js';

// In-memory import session cache (expires after 1 hour)
const importSessions = new Map();
const SESSION_TTL_MS = 60 * 60 * 1000;

const cleanupExpiredSessions = () => {
  const now = Date.now();
  for (const [id, session] of importSessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      importSessions.delete(id);
    }
  }
};

setInterval(cleanupExpiredSessions, 15 * 60 * 1000);

/**
 * Validate URL format (permits standard URLs or user handles/relative domains)
 */
const isValidUrl = (str) => {
  if (!str) return true;
  const trimmed = str.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'N/A' || trimmed === '-') {
    return true;
  }
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      new URL(trimmed);
      return true;
    }
    // Allow profile links like linkedin.com/in/... or leetcode.com/...
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      new URL(`https://${trimmed}`);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Format profile URL nicely
 */
const normalizeUrl = (str) => {
  if (!str) return '';
  const trimmed = str.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'N/A' || trimmed === '-') {
    return '';
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

/**
 * Stage A & B: Parse uploaded buffer, detect columns, and validate records
 */
export const parseAndValidateFile = async (buffer, fileName, customMapping = null) => {
  cleanupExpiredSessions();

  if (!buffer || buffer.length === 0) {
    throw new Error('Uploaded file is empty or corrupted.');
  }

  // Parse worksheet safely preserving strings
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    raw: false,
    cellDates: true,
    dense: true
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('No worksheets found in the uploaded file.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawMatrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false
  });

  if (!rawMatrix || rawMatrix.length === 0) {
    throw new Error('The spreadsheet does not contain any data.');
  }

  // Find header row (first non-empty row)
  let headerRowIndex = 0;
  while (
    headerRowIndex < rawMatrix.length &&
    (!rawMatrix[headerRowIndex] || rawMatrix[headerRowIndex].filter((c) => String(c).trim()).length === 0)
  ) {
    headerRowIndex++;
  }

  if (headerRowIndex >= rawMatrix.length) {
    throw new Error('Could not find a valid header row in the file.');
  }

  const rawHeaders = rawMatrix[headerRowIndex].map((h) => String(h || '').trim()).filter(Boolean);
  const detectedMapping = customMapping || autoDetectMapping(rawHeaders);

  // Extract raw data rows
  const dataRows = rawMatrix.slice(headerRowIndex + 1);

  // Build mapped objects
  const parsedRecords = [];
  const rollNumberCounts = new Map();

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
    const row = dataRows[rowIndex];
    // Check if entire row is empty
    if (!row || row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')) {
      continue;
    }

    const record = {
      _rowIndex: headerRowIndex + 2 + rowIndex, // 1-indexed for user visibility
      slNo: '',
      rollNumber: '',
      name: '',
      branch: 'Computer Science & Engineering',
      batch: '',
      mentorRollNumber: '',
      mentorName: '',
      leetcode: '',
      codeforces: '',
      hackerrank: '',
      linkedin: '',
      github: '',
      resume: '',
      raw: {}
    };

    rawHeaders.forEach((header, colIndex) => {
      const cellVal = sanitizeCellValue(row[colIndex]);
      record.raw[header] = cellVal;

      const fieldKey = detectedMapping[header];
      if (fieldKey && fieldKey in record) {
        record[fieldKey] = cellVal;
      }
    });

    if (record.rollNumber) {
      record.rollNumber = record.rollNumber.trim().toUpperCase();
      rollNumberCounts.set(record.rollNumber, (rollNumberCounts.get(record.rollNumber) || 0) + 1);
    }
    if (record.name) {
      record.name = record.name.trim();
    }
    if (record.mentorRollNumber) {
      record.mentorRollNumber = record.mentorRollNumber.trim().toUpperCase();
    }
    if (record.mentorName) {
      record.mentorName = record.mentorName.trim();
    }
    if (record.batch) {
      record.batch = record.batch.trim();
    }
    if (record.branch) {
      record.branch = record.branch.trim();
    }

    parsedRecords.push(record);
  }

  if (parsedRecords.length === 0) {
    throw new Error('No data rows found in the uploaded spreadsheet.');
  }

  // Query existing database state to detect new vs existing accounts and mentor assignments
  const allRollNumbers = parsedRecords.map((r) => r.rollNumber).filter(Boolean);
  const existingMenteeProfiles = await prisma.menteeProfile.findMany({
    where: { rollNumber: { in: allRollNumbers } },
    include: {
      user: {
        include: {
          menteeAssignments: {
            where: { status: 'ACTIVE' },
            include: {
              mentor: {
                include: { mentorProfile: true }
              }
            }
          }
        }
      }
    }
  });

  const existingStudentMap = new Map();
  existingMenteeProfiles.forEach((mp) => {
    existingStudentMap.set(mp.rollNumber.toUpperCase(), mp);
  });

  // Query existing mentors by rollNumber or name
  const existingMentorProfiles = await prisma.mentorProfile.findMany({
    include: { user: true }
  });

  const existingMentorRollMap = new Map();
  const existingMentorNameMap = new Map();

  existingMentorProfiles.forEach((mp) => {
    if (mp.rollNumber) {
      existingMentorRollMap.set(mp.rollNumber.toUpperCase(), mp.user);
    }
    if (mp.user?.name) {
      existingMentorNameMap.set(mp.user.name.toLowerCase().trim(), mp.user);
    }
  });

  // Validate records
  const validatedRows = [];
  const uniqueMentorsMap = new Map();
  const duplicateRollsInFile = new Set();
  const conflicts = [];
  let validCount = 0;
  let invalidCount = 0;
  let newStudentsCount = 0;
  let existingStudentsCount = 0;

  for (const record of parsedRecords) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!record.rollNumber) {
      errors.push('Missing student roll number.');
    }
    if (!record.name) {
      errors.push('Missing student name.');
    }

    // Check duplicate roll number in same file
    if (record.rollNumber && rollNumberCounts.get(record.rollNumber) > 1) {
      duplicateRollsInFile.add(record.rollNumber);
      warnings.push(`Duplicate roll number (${record.rollNumber}) appears multiple times in file.`);
    }

    // URL validations
    const urlFields = ['leetcode', 'codeforces', 'hackerrank', 'linkedin', 'github', 'resume'];
    for (const uField of urlFields) {
      if (record[uField] && !isValidUrl(record[uField])) {
        warnings.push(`Invalid URL format for ${uField}: "${record[uField]}".`);
      }
    }

    // Existing student check
    const existingStudent = record.rollNumber ? existingStudentMap.get(record.rollNumber) : null;
    const isExisting = !!existingStudent;

    if (isExisting) {
      existingStudentsCount++;
      // Check mentor assignment conflict
      const activeAssignment = existingStudent.user?.menteeAssignments?.[0];
      if (
        activeAssignment &&
        activeAssignment.mentor &&
        record.mentorRollNumber &&
        activeAssignment.mentor.mentorProfile?.rollNumber &&
        activeAssignment.mentor.mentorProfile.rollNumber.toUpperCase() !== record.mentorRollNumber.toUpperCase()
      ) {
        const conflictDesc = `Student is currently assigned to mentor ${activeAssignment.mentor.name} (${activeAssignment.mentor.mentorProfile.rollNumber}), but file specifies ${record.mentorName || record.mentorRollNumber}.`;
        warnings.push(`Assignment conflict: ${conflictDesc}`);
        conflicts.push({
          rowIndex: record._rowIndex,
          rollNumber: record.rollNumber,
          studentName: record.name,
          currentMentor: activeAssignment.mentor.name,
          uploadedMentor: record.mentorName || record.mentorRollNumber
        });
      }
    } else if (record.rollNumber && record.name) {
      newStudentsCount++;
    }

    // Mentor tracking
    if (record.mentorRollNumber || record.mentorName) {
      const mentorKey = (record.mentorRollNumber || record.mentorName).toUpperCase();
      if (!uniqueMentorsMap.has(mentorKey)) {
        const isMentorExisting =
          (record.mentorRollNumber && existingMentorRollMap.has(record.mentorRollNumber)) ||
          (record.mentorName && existingMentorNameMap.has(record.mentorName.toLowerCase()));

        uniqueMentorsMap.set(mentorKey, {
          rollNumber: record.mentorRollNumber || 'N/A',
          name: record.mentorName || 'Mentor',
          isExisting: !!isMentorExisting
        });
      }
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }

    validatedRows.push({
      ...record,
      isValid,
      isExisting,
      errors,
      warnings,
      status: !isValid ? 'INVALID' : isExisting ? 'EXISTING' : 'NEW'
    });
  }

  // Create session object
  const importId = crypto.randomUUID();
  const sessionData = {
    importId,
    createdAt: Date.now(),
    fileName,
    fileSize: buffer.length,
    rawHeaders,
    detectedMapping,
    records: parsedRecords,
    validatedRows,
    summary: {
      totalRows: parsedRecords.length,
      validRows: validCount,
      invalidRows: invalidCount,
      newStudentsCount,
      existingStudentsCount,
      uniqueMentorsCount: uniqueMentorsMap.size,
      duplicateRollsCount: duplicateRollsInFile.size,
      conflictsCount: conflicts.length
    },
    uniqueMentors: Array.from(uniqueMentorsMap.values()),
    conflicts
  };

  importSessions.set(importId, sessionData);

  return {
    importId,
    fileName,
    fileSize: buffer.length,
    rawHeaders,
    detectedMapping,
    standardFields: STANDARD_FIELDS,
    summary: sessionData.summary,
    uniqueMentors: sessionData.uniqueMentors,
    conflicts: sessionData.conflicts,
    previewRows: validatedRows.slice(0, 100)
  };
};

/**
 * Stage D: Confirm and write imported data to PostgreSQL
 */
export const executeImport = async (importId, importMode = 'CREATE', customMapping = null, actorId) => {
  cleanupExpiredSessions();

  const session = importSessions.get(importId);
  if (!session) {
    throw new Error('Import session expired or not found. Please upload the file again.');
  }

  const { fileName, fileSize, records, rawHeaders } = session;
  const activeMapping = customMapping || session.detectedMapping;

  // Default initial password hash for imported accounts (Password@123 or ENV.DEFAULT_USER_PASSWORD)
  const defaultUserPassword = process.env.DEFAULT_USER_PASSWORD || 'Password@123';
  const defaultPasswordHash = await bcrypt.hash(defaultUserPassword, 10);

  // Stats accumulators
  let studentsCreated = 0;
  let studentsUpdated = 0;
  let studentsSkipped = 0;
  let mentorsCreated = 0;
  let mentorsUpdated = 0;
  let relationshipsCreated = 0;
  let relationshipsUpdated = 0;
  let failedCount = 0;
  const errorDetails = [];

  // Cache for resolved mentors and batches to minimize database hits
  const mentorIdCache = new Map(); // mentorRollNumber.toUpperCase() -> User.id
  const batchIdCache = new Map(); // batchName.toUpperCase() -> Batch.id

  // 1. Process Unique Mentors
  const uniqueMentorEntries = new Map();
  for (const row of records) {
    const mRoll = (row.mentorRollNumber || '').trim().toUpperCase();
    const mName = (row.mentorName || '').trim();
    if (mRoll || mName) {
      const key = mRoll || mName.toUpperCase();
      if (!uniqueMentorEntries.has(key)) {
        uniqueMentorEntries.set(key, {
          rollNumber: mRoll || '',
          name: mName || `Mentor ${mRoll}`,
          branch: row.branch || 'Computer Science & Engineering'
        });
      }
    }
  }

  for (const [key, mentorData] of uniqueMentorEntries.entries()) {
    try {
      // Find existing mentor by rollNumber in MentorProfile or by email
      let mentorUser = null;
      if (mentorData.rollNumber) {
        const existingProfile = await prisma.mentorProfile.findFirst({
          where: { rollNumber: mentorData.rollNumber },
          include: { user: true }
        });
        if (existingProfile?.user) {
          mentorUser = existingProfile.user;
        }
      }

      if (!mentorUser && mentorData.name) {
        mentorUser = await prisma.user.findFirst({
          where: {
            role: 'MENTOR',
            name: { equals: mentorData.name, mode: 'insensitive' }
          }
        });
      }

      if (!mentorUser) {
        // Generate mentor email as id@sru.edu.in (e.g. 2303a52012@sru.edu.in)
        const mentorEmail = mentorData.rollNumber
          ? `${mentorData.rollNumber.trim().toLowerCase()}@sru.edu.in`
          : `${mentorData.name.trim().replace(/\s+/g, '.').toLowerCase()}@sru.edu.in`;

        // Check if email is already taken
        const existingEmail = await prisma.user.findFirst({
          where: { email: mentorEmail }
        });
        const finalEmail = existingEmail
          ? `${mentorData.rollNumber ? mentorData.rollNumber.trim().toLowerCase() : mentorData.name.trim().replace(/\s+/g, '.').toLowerCase()}.${crypto.randomUUID().substring(0, 4)}@sru.edu.in`
          : mentorEmail;

        const _auditRandomToken = crypto.randomBytes(24).toString('base64url');
        const mentorPasswordHash = defaultPasswordHash;

        const newMentor = await prisma.user.create({
          data: {
            name: mentorData.name,
            email: finalEmail,
            passwordHash: mentorPasswordHash,
            role: 'MENTOR',
            accountStatus: 'ACTIVE',
            mustChangePassword: true,
            mentorProfile: {
              create: {
                rollNumber: mentorData.rollNumber || '',
                department: mentorData.branch || 'Computer Science & Engineering',
                designation: 'Technical Mentor',
                maxMentees: 50,
                bio: 'Assigned faculty and technical mentor.'
              }
            }
          }
        });
        mentorIdCache.set(key, newMentor.id);
        mentorsCreated++;
      } else {
        mentorIdCache.set(key, mentorUser.id);
        if (importMode === 'UPDATE' && mentorData.name && mentorUser.name !== mentorData.name) {
          await prisma.user.update({
            where: { id: mentorUser.id },
            data: { name: mentorData.name }
          });
          mentorsUpdated++;
        }
      }
    } catch (err) {
      console.error(`Error processing mentor ${key}:`, err);
      errorDetails.push({
        type: 'MENTOR_ERROR',
        mentor: mentorData,
        message: err.message
      });
    }
  }

  // 2. Process Batches
  const uniqueBatches = new Set();
  for (const row of records) {
    if (row.batch && row.batch.trim()) {
      uniqueBatches.add(row.batch.trim());
    }
  }

  for (const batchName of uniqueBatches) {
    try {
      let batch = await prisma.batch.findFirst({
        where: { name: { equals: batchName, mode: 'insensitive' } }
      });

      if (!batch) {
        batch = await prisma.batch.create({
          data: {
            name: batchName,
            academicYear: 2027,
            description: `Imported cohort: ${batchName}`,
            createdById: actorId
          }
        });
      }
      batchIdCache.set(batchName.toUpperCase(), batch.id);
    } catch (err) {
      console.error(`Error processing batch ${batchName}:`, err);
    }
  }

  // 3. Process Students & Mentor Assignments
  for (const row of records) {
    if (!row.rollNumber || !row.name) {
      failedCount++;
      errorDetails.push({
        rowIndex: row._rowIndex,
        rollNumber: row.rollNumber,
        name: row.name,
        message: 'Missing roll number or student name.'
      });
      continue;
    }

    try {
      const cleanRoll = row.rollNumber.trim().toUpperCase();
      const cleanName = row.name.trim();
      const cleanBranch = row.branch?.trim() || 'Computer Science & Engineering';
      const cleanBatch = row.batch?.trim() || '';
      const batchId = cleanBatch ? batchIdCache.get(cleanBatch.toUpperCase()) : null;

      // Find existing student by MenteeProfile.rollNumber OR User.email
      let existingProfile = await prisma.menteeProfile.findFirst({
        where: { rollNumber: cleanRoll },
        include: { user: true }
      });

      const studentEmail = `${cleanRoll.toLowerCase()}@sru.edu.in`;
      let existingUserByEmail = null;
      if (!existingProfile) {
        existingUserByEmail = await prisma.user.findFirst({
          where: { email: { equals: studentEmail, mode: 'insensitive' } },
          include: { menteeProfile: true }
        });
        if (existingUserByEmail?.menteeProfile) {
          existingProfile = existingUserByEmail.menteeProfile;
          existingProfile.user = existingUserByEmail;
        }
      }

      let studentUserId = null;

      if (!existingProfile && !existingUserByEmail) {
        const studentPasswordHash = defaultPasswordHash;
        const finalEmail = studentEmail;

        const newUser = await prisma.user.create({
          data: {
            name: cleanName,
            email: finalEmail,
            passwordHash: studentPasswordHash,
            role: 'MENTEE',
            accountStatus: 'ACTIVE',
            mustChangePassword: true,
            menteeProfile: {
              create: {
                studentId: cleanRoll,
                rollNumber: cleanRoll,
                branch: cleanBranch,
                section: cleanBatch || 'A',
                academicYear: 2028
              }
            },
            codingProfile: {
              create: {
                leetcodeUrl: normalizeUrl(row.leetcode),
                codeforcesUrl: normalizeUrl(row.codeforces),
                hackerrankUrl: normalizeUrl(row.hackerrank),
                linkedinUrl: normalizeUrl(row.linkedin),
                githubUrl: normalizeUrl(row.github),
                resumeUrl: normalizeUrl(row.resume)
              }
            }
          }
        });

        studentUserId = newUser.id;
        studentsCreated++;

        if (batchId) {
          await prisma.batchMentee.upsert({
            where: { batchId_menteeId: { batchId, menteeId: studentUserId } },
            create: { batchId, menteeId: studentUserId },
            update: {}
          });
        }
      } else {
        studentUserId = existingProfile?.userId || existingUserByEmail?.id;

        if (importMode === 'CREATE') {
          studentsSkipped++;
        } else if (importMode === 'UPDATE') {
          // Update student info without overwriting passwords or wiping non-empty existing data
          if (cleanName && existingProfile.user?.name !== cleanName) {
            await prisma.user.update({
              where: { id: studentUserId },
              data: { name: cleanName }
            });
          }

          await prisma.menteeProfile.update({
            where: { userId: studentUserId },
            data: {
              ...(cleanBranch && { branch: cleanBranch }),
              ...(cleanBatch && { section: cleanBatch })
            }
          });

          const updateCodingData = {};
          if (row.leetcode && normalizeUrl(row.leetcode)) updateCodingData.leetcodeUrl = normalizeUrl(row.leetcode);
          if (row.codeforces && normalizeUrl(row.codeforces)) updateCodingData.codeforcesUrl = normalizeUrl(row.codeforces);
          if (row.hackerrank && normalizeUrl(row.hackerrank)) updateCodingData.hackerrankUrl = normalizeUrl(row.hackerrank);
          if (row.linkedin && normalizeUrl(row.linkedin)) updateCodingData.linkedinUrl = normalizeUrl(row.linkedin);
          if (row.github && normalizeUrl(row.github)) updateCodingData.githubUrl = normalizeUrl(row.github);
          if (row.resume && normalizeUrl(row.resume)) updateCodingData.resumeUrl = normalizeUrl(row.resume);

          if (Object.keys(updateCodingData).length > 0) {
            await prisma.codingProfile.upsert({
              where: { menteeId: studentUserId },
              create: {
                menteeId: studentUserId,
                ...updateCodingData
              },
              update: updateCodingData
            });
          }

          if (batchId) {
            await prisma.batchMentee.upsert({
              where: { batchId_menteeId: { batchId, menteeId: studentUserId } },
              create: { batchId, menteeId: studentUserId },
              update: {}
            });
          }

          studentsUpdated++;
        }
      }

      // 4. Mentor Assignment
      const mKey = (row.mentorRollNumber || row.mentorName || '').trim().toUpperCase();
      const mentorUserId = mentorIdCache.get(mKey);

      if (studentUserId && mentorUserId) {
        const existingAssignment = await prisma.mentorMenteeAssignment.findUnique({
          where: {
            mentorId_menteeId: {
              mentorId: mentorUserId,
              menteeId: studentUserId
            }
          }
        });

        if (!existingAssignment) {
          // If already assigned to a different mentor, check if reassignment in UPDATE mode
          const otherAssignment = await prisma.mentorMenteeAssignment.findFirst({
            where: { menteeId: studentUserId, status: 'ACTIVE' }
          });

          if (otherAssignment && importMode === 'UPDATE') {
            await prisma.mentorMenteeAssignment.update({
              where: { id: otherAssignment.id },
              data: {
                mentorId: mentorUserId,
                batchId: batchId || otherAssignment.batchId,
                status: 'ACTIVE',
                assignedAt: new Date()
              }
            });
            relationshipsUpdated++;
          } else if (!otherAssignment) {
            await prisma.mentorMenteeAssignment.upsert({
              where: {
                mentorId_menteeId: {
                  mentorId: mentorUserId,
                  menteeId: studentUserId
                }
              },
              create: {
                mentorId: mentorUserId,
                menteeId: studentUserId,
                batchId: batchId || null,
                status: 'ACTIVE',
                assignedAt: new Date()
              },
              update: {
                batchId: batchId || undefined,
                status: 'ACTIVE'
              }
            });
            relationshipsCreated++;
          }
        } else if (importMode === 'UPDATE') {
          if (batchId && existingAssignment.batchId !== batchId) {
            await prisma.mentorMenteeAssignment.update({
              where: { id: existingAssignment.id },
              data: { batchId, status: 'ACTIVE' }
            });
            relationshipsUpdated++;
          }
        }

        // Also ensure mentor is linked to the batch
        if (batchId) {
          await prisma.batchMentor.upsert({
            where: { batchId_mentorId: { batchId, mentorId: mentorUserId } },
            create: { batchId, mentorId: mentorUserId },
            update: {}
          });
        }
      }
    } catch (err) {
      console.error(`Error importing row ${row._rowIndex} (${row.rollNumber}):`, err);
      failedCount++;
      errorDetails.push({
        rowIndex: row._rowIndex,
        rollNumber: row.rollNumber,
        name: row.name,
        message: err.message
      });
    }
  }

  const finalStatus = failedCount === 0 ? 'COMPLETED' : studentsCreated + studentsUpdated > 0 ? 'PARTIAL' : 'FAILED';

  const summaryDetails = {
    fileName,
    importMode,
    totalRows: records.length,
    studentsCreated,
    studentsUpdated,
    studentsSkipped,
    mentorsCreated,
    mentorsUpdated,
    relationshipsCreated,
    relationshipsUpdated,
    failedCount
  };

  // Persist Import History in database
  const history = await prisma.importHistory.create({
    data: {
      fileName,
      fileSize,
      fileType: fileName.endsWith('.csv') ? 'csv' : 'xlsx',
      importMode,
      actorId,
      totalRows: records.length,
      validRows: records.length - failedCount,
      invalidRows: failedCount,
      studentsCreated,
      studentsUpdated,
      studentsSkipped,
      mentorsCreated,
      mentorsUpdated,
      relationshipsCreated,
      relationshipsUpdated,
      failedCount,
      status: finalStatus,
      summaryDetails,
      errorDetails
    }
  });

  // Create Audit Log
  await prisma.auditLog.create({
    data: {
      actorId,
      action: 'BULK_IMPORT',
      resourceType: 'ImportHistory',
      resourceId: history.id,
      details: summaryDetails
    }
  });

  // Clean up session
  importSessions.delete(importId);

  return {
    success: true,
    importId: history.id,
    historyId: history.id,
    status: finalStatus,
    stats: summaryDetails,
    summary: summaryDetails,
    errorDetails
  };
};

/**
 * Generate Sample Excel / CSV template matching the actual 13-column format
 */
export const generateSampleTemplate = (format = 'xlsx') => {
  const headers = [
    'Sl No',
    'Roll No',
    'Student Name',
    'Branch',
    'Nbatch',
    'Mentor Roll No',
    'Mentor Name',
    'LeetCode',
    'Codeforce',
    'Hackerrank',
    'Linkedin',
    'Github',
    'Resume'
  ];

  const sampleRows = [
    [
      1,
      '24A91A0501',
      'John Doe',
      'Computer Science & Engineering',
      'G6-B1',
      'EMP101',
      'Dr. Alan Turing',
      'https://leetcode.com/u/johndoe/',
      'https://codeforces.com/profile/johndoe',
      'https://www.hackerrank.com/profile/johndoe',
      'https://linkedin.com/in/johndoe',
      'https://github.com/johndoe',
      'https://drive.google.com/file/d/sample-resume-1/view'
    ],
    [
      2,
      '24A91A0502',
      'Jane Smith',
      'Computer Science & Engineering',
      'G6-B1',
      'EMP101',
      'Dr. Alan Turing',
      'https://leetcode.com/u/janesmith/',
      '',
      'https://www.hackerrank.com/profile/janesmith',
      'https://linkedin.com/in/janesmith',
      'https://github.com/janesmith',
      ''
    ],
    [
      3,
      '24A91A0503',
      'Rahul Verma',
      'Information Technology',
      'G6-B2',
      'EMP102',
      'Prof. Grace Hopper',
      'https://leetcode.com/u/rahulv/',
      'https://codeforces.com/profile/rahulv',
      '',
      'https://linkedin.com/in/rahulverma',
      'https://github.com/rahulverma',
      'https://drive.google.com/file/d/sample-resume-3/view'
    ]
  ];

  const worksheetData = [headers, ...sampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set nice column widths
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 22 },
    { wch: 30 },
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 32 },
    { wch: 32 },
    { wch: 32 },
    { wch: 32 },
    { wch: 30 },
    { wch: 40 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mentor Mapping');

  if (format === 'csv') {
    return XLSX.utils.sheet_to_csv(worksheet);
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};
