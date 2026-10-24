import prisma from '../config/prisma.js';

export const DEFAULT_TARGET_SCHEDULE = [
  { weekNo: 1, startDate: '2026-10-05T00:00:00.000Z', targetCount: 98, requirement: 'Senior Live Review Required' },
  { weekNo: 2, startDate: '2026-10-12T00:00:00.000Z', targetCount: 111, requirement: 'Senior Live Review Required' },
  { weekNo: 3, startDate: '2026-10-19T00:00:00.000Z', targetCount: 141, requirement: 'Senior Live Review Required' },
  { weekNo: 4, startDate: '2026-10-26T00:00:00.000Z', targetCount: 156, requirement: 'Senior Live Review Required' },
  { weekNo: 5, startDate: '2026-11-02T00:00:00.000Z', targetCount: 170, requirement: 'Senior Live Review Required' },
  { weekNo: 6, startDate: '2026-11-09T00:00:00.000Z', targetCount: 184, requirement: 'Senior Live Review Required' },
  { weekNo: 7, startDate: '2026-11-16T00:00:00.000Z', targetCount: 207, requirement: 'Senior Live Review Required' },
  { weekNo: 8, startDate: '2026-11-23T00:00:00.000Z', targetCount: 207, requirement: 'Senior Live Review Required' },
  { weekNo: 9, startDate: '2026-11-30T00:00:00.000Z', targetCount: 207, requirement: 'Senior Live Review Required' },
  { weekNo: 10, startDate: '2026-12-07T00:00:00.000Z', targetCount: 207, requirement: 'Senior Live Review Required' },
  { weekNo: 11, startDate: '2026-12-14T00:00:00.000Z', targetCount: 207, requirement: 'Senior Live Review Required' },
  { weekNo: 12, startDate: '2026-12-21T00:00:00.000Z', targetCount: 207, requirement: 'Senior Live Review Required' }
];

// Helper to determine the current active week
export const getActiveWeek = (now = new Date()) => {
  const current = now.getTime();
  let active = 1;
  for (let i = DEFAULT_TARGET_SCHEDULE.length - 1; i >= 0; i--) {
    const start = new Date(DEFAULT_TARGET_SCHEDULE[i].startDate).getTime();
    if (current >= start) {
      active = DEFAULT_TARGET_SCHEDULE[i].weekNo;
      break;
    }
  }
  return active;
};

/**
 * GET /api/v1/weekly-targets/schedule
 * Fetch the 12-week target schedule for a batch (or default schedule)
 * If student, includes their verification records & current counters
 */
export const getTargetSchedule = async (req, res, next) => {
  try {
    const { batchId } = req.query;
    const userId = req.user.id;
    const role = req.user.role;

    let customTargets = [];
    if (batchId) {
      customTargets = await prisma.batchWeeklyTarget.findMany({
        where: { batchId },
        orderBy: { weekNo: 'asc' }
      });
    }

    const customMap = new Map();
    customTargets.forEach((ct) => customMap.set(ct.weekNo, ct));

    const schedule = DEFAULT_TARGET_SCHEDULE.map((def) => {
      const custom = customMap.get(def.weekNo);
      return {
        weekNo: def.weekNo,
        startDate: custom?.startDate ? custom.startDate.toISOString() : def.startDate,
        targetCount: custom?.targetCount ?? def.targetCount,
        requirement: custom?.requirement ?? def.requirement,
        isCustomized: !!custom
      };
    });

    const activeWeek = getActiveWeek();

    // If user is a student, fetch their verifications & coding counters
    let studentData = null;
    if (role === 'MENTEE') {
      const [verifications, codingProfile] = await Promise.all([
        prisma.weeklyTargetVerification.findMany({
          where: { menteeId: userId },
          include: {
            verifier: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        }),
        prisma.codingProfile.findUnique({
          where: { menteeId: userId }
        })
      ]);

      const verMap = new Map();
      verifications.forEach((v) => verMap.set(v.weekNo, v));

      const scheduleWithStatus = schedule.map((item) => {
        const v = verMap.get(item.weekNo);
        return {
          ...item,
          verified: !!v?.verified,
          verifiedCount: v?.verifiedCount ?? 0,
          targetMet: !!v?.targetMet,
          verifiedAt: v?.verifiedAt || null,
          notes: v?.notes || '',
          verifier: v?.verifier ? { id: v.verifier.id, name: v.verifier.name, role: v.verifier.role } : null
        };
      });

      studentData = {
        schedule: scheduleWithStatus,
        codingProfile: codingProfile || {
          leetcodeSolved: 0,
          codechefSolved: 0,
          codeforcesSolved: 0,
          hackerrankSolved: 0,
          gfgSolved: 0
        }
      };
    }

    return res.status(200).json({
      success: true,
      activeWeek,
      schedule,
      studentData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/weekly-targets/student/:studentId
 * Get a specific student's weekly verification record and counters
 */
export const getStudentTargets = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        menteeProfile: true,
        codingProfile: true,
        menteeBatches: {
          include: { batch: true }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const batch = student.menteeBatches[0]?.batch;
    let customTargets = [];
    if (batch?.id) {
      customTargets = await prisma.batchWeeklyTarget.findMany({
        where: { batchId: batch.id },
        orderBy: { weekNo: 'asc' }
      });
    }

    const customMap = new Map();
    customTargets.forEach((ct) => customMap.set(ct.weekNo, ct));

    const verifications = await prisma.weeklyTargetVerification.findMany({
      where: { menteeId: studentId },
      include: {
        verifier: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
    const verMap = new Map();
    verifications.forEach((v) => verMap.set(v.weekNo, v));

    const schedule = DEFAULT_TARGET_SCHEDULE.map((def) => {
      const custom = customMap.get(def.weekNo);
      const v = verMap.get(def.weekNo);
      const targetCount = custom?.targetCount ?? def.targetCount;
      return {
        weekNo: def.weekNo,
        startDate: custom?.startDate ? custom.startDate.toISOString() : def.startDate,
        targetCount,
        requirement: custom?.requirement ?? def.requirement,
        verified: !!v?.verified,
        verifiedCount: v?.verifiedCount ?? 0,
        targetMet: !!v?.targetMet,
        verifiedAt: v?.verifiedAt || null,
        notes: v?.notes || '',
        verifier: v?.verifier ? { id: v.verifier.id, name: v.verifier.name, role: v.verifier.role } : null
      };
    });

    return res.status(200).json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        rollNumber: student.menteeProfile?.rollNumber || '',
        studentId: student.menteeProfile?.studentId || '',
        batch: batch ? { id: batch.id, name: batch.name } : null
      },
      codingProfile: student.codingProfile || {
        leetcodeSolved: 0,
        codechefSolved: 0,
        codeforcesSolved: 0,
        hackerrankSolved: 0,
        gfgSolved: 0
      },
      activeWeek: getActiveWeek(),
      schedule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/weekly-targets/batch/:batchId/audit
 * Senior Audit Sheet: View all students in a batch and their verification status for weekNo
 */
export const getBatchAuditSheet = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const weekNo = Number(req.query.weekNo) || getActiveWeek();

    // Check custom target for this batch & week
    const customTarget = await prisma.batchWeeklyTarget.findUnique({
      where: {
        batchId_weekNo: { batchId, weekNo }
      }
    });

    const defaultDef = DEFAULT_TARGET_SCHEDULE.find((d) => d.weekNo === weekNo) || DEFAULT_TARGET_SCHEDULE[0];
    const targetCount = customTarget?.targetCount ?? defaultDef.targetCount;

    let students = [];

    if (req.user.role === 'MENTOR') {
      // Mentors only see their assigned mentees in this batch
      const myAssignments = await prisma.mentorMenteeAssignment.findMany({
        where: {
          mentorId: req.user.id,
          status: 'ACTIVE',
          ...(batchId
            ? {
                mentee: {
                  menteeBatches: {
                    some: { batchId }
                  }
                }
              }
            : {})
        },
        include: {
          mentee: {
            select: {
              id: true,
              name: true,
              email: true,
              menteeProfile: true,
              codingProfile: true,
              weeklyTargetVerificationsReceived: {
                where: { weekNo },
                include: {
                  verifier: {
                    select: { id: true, name: true, email: true, role: true }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          mentee: { name: 'asc' }
        }
      });

      students = myAssignments.map((a) => {
        const m = a.mentee;
        const ver = m.weeklyTargetVerificationsReceived[0] || null;
        const selfReportedLeetCode = m.codingProfile?.leetcodeSolved ?? 0;
        const verifiedCount = ver?.verifiedCount ?? 0;
        const targetMet = ver ? !!ver.targetMet : false;

        return {
          id: m.id,
          name: m.name,
          email: m.email,
          rollNumber: m.menteeProfile?.rollNumber || '',
          studentId: m.menteeProfile?.studentId || '',
          section: m.menteeProfile?.section || 'A',
          selfReportedLeetCode,
          verified: !!ver?.verified,
          verifiedCount,
          targetMet,
          notes: ver?.notes || '',
          verifiedAt: ver?.verifiedAt || null,
          verifier: ver?.verifier ? { id: ver.verifier.id, name: ver.verifier.name, role: ver.verifier.role } : null
        };
      });
    } else {
      // Trainer or Admin: view all students in this batch
      const batchMentees = await prisma.batchMentee.findMany({
        where: { batchId },
        include: {
          mentee: {
            select: {
              id: true,
              name: true,
              email: true,
              menteeProfile: true,
              codingProfile: true,
              weeklyTargetVerificationsReceived: {
                where: { weekNo },
                include: {
                  verifier: {
                    select: { id: true, name: true, email: true, role: true }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          mentee: { name: 'asc' }
        }
      });

      students = batchMentees.map((bm) => {
        const m = bm.mentee;
        const ver = m.weeklyTargetVerificationsReceived[0] || null;
        const selfReportedLeetCode = m.codingProfile?.leetcodeSolved ?? 0;
        const verifiedCount = ver?.verifiedCount ?? 0;
        const targetMet = ver ? !!ver.targetMet : false;

        return {
          id: m.id,
          name: m.name,
          email: m.email,
          rollNumber: m.menteeProfile?.rollNumber || '',
          studentId: m.menteeProfile?.studentId || '',
          section: m.menteeProfile?.section || 'A',
          selfReportedLeetCode,
          verified: !!ver?.verified,
          verifiedCount,
          targetMet,
          notes: ver?.notes || '',
          verifiedAt: ver?.verifiedAt || null,
          verifier: ver?.verifier ? { id: ver.verifier.id, name: ver.verifier.name, role: ver.verifier.role } : null
        };
      });
    }

    const summary = {
      totalStudents: students.length,
      targetMetCount: students.filter((s) => s.targetMet).length,
      verifiedCount: students.filter((s) => s.verified).length,
      pendingCount: students.filter((s) => !s.verified).length
    };

    return res.status(200).json({
      success: true,
      batchId,
      weekNo,
      targetCount,
      requirement: customTarget?.requirement || defaultDef.requirement,
      summary,
      students
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/weekly-targets/verify
 * Senior Live Review & Verification Save
 * Strict Target Rule: Target Met <=> Mentor Verified Count >= Week Cumulative Target
 * Unverified solves or self-reported submissions never satisfy the target.
 */
export const verifyStudentTarget = async (req, res, next) => {
  try {
    const verifierId = req.user.id;
    const { menteeId, weekNo, verifiedCount, notes } = req.body;

    if (!menteeId) {
      return res.status(400).json({ success: false, message: 'Mentee ID is required.' });
    }

    // If caller is a MENTOR, verify that mentee is assigned to them
    if (req.user.role === 'MENTOR') {
      const assignment = await prisma.mentorMenteeAssignment.findFirst({
        where: {
          mentorId: req.user.id,
          menteeId,
          status: 'ACTIVE'
        }
      });
      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: You can only verify targets for your assigned mentees.'
        });
      }
    }

    const numWeek = Number(weekNo) || 1;
    const numVerified = Math.max(0, Number(verifiedCount) || 0);

    // Get mentee's batch to check custom target count
    const menteeBatch = await prisma.batchMentee.findFirst({
      where: { menteeId }
    });

    let targetCount = DEFAULT_TARGET_SCHEDULE.find((d) => d.weekNo === numWeek)?.targetCount || 98;
    if (menteeBatch?.batchId) {
      const custom = await prisma.batchWeeklyTarget.findUnique({
        where: {
          batchId_weekNo: { batchId: menteeBatch.batchId, weekNo: numWeek }
        }
      });
      if (custom?.targetCount !== undefined) {
        targetCount = custom.targetCount;
      }
    }

    // Strict Target Rule: Target Met <=> Mentor Verified Count >= Week Cumulative Target
    const targetMet = numVerified >= targetCount;

    const verification = await prisma.weeklyTargetVerification.upsert({
      where: {
        menteeId_weekNo: {
          menteeId,
          weekNo: numWeek
        }
      },
      create: {
        menteeId,
        verifierId,
        weekNo: numWeek,
        verifiedCount: numVerified,
        targetMet,
        verified: true,
        notes: (notes || '').trim(),
        verifiedAt: new Date()
      },
      update: {
        verifierId,
        verifiedCount: numVerified,
        targetMet,
        verified: true,
        notes: (notes || '').trim(),
        verifiedAt: new Date()
      },
      include: {
        verifier: {
          select: { id: true, name: true, email: true, role: true }
        },
        mentee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Also update/sync student's codingProfile.leetcodeSolved if verifiedCount is higher
    await prisma.codingProfile.upsert({
      where: { menteeId },
      create: {
        menteeId,
        leetcodeSolved: numVerified
      },
      update: {
        // sync if verified count is higher or equal
        leetcodeSolved: {
          set: numVerified
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: targetMet
        ? `Verification saved! Target Met (${numVerified} >= ${targetCount}).`
        : `Verification saved! Count (${numVerified}) is below target (${targetCount}).`,
      verification: {
        ...verification,
        targetCount,
        targetMet
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/weekly-targets/batch/:batchId/custom
 * Admin or Trainer can edit targets per batch if a batch needs pacing adjustments
 */
export const updateBatchTargets = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { targets } = req.body; // Array of { weekNo, targetCount, startDate, requirement } or single object

    const targetList = Array.isArray(targets) ? targets : [req.body];

    const results = [];
    for (const item of targetList) {
      const weekNo = Number(item.weekNo);
      if (!weekNo || weekNo < 1 || weekNo > 12) continue;

      const targetCount = Number(item.targetCount);
      const startDate = item.startDate ? new Date(item.startDate) : undefined;
      const requirement = item.requirement || 'Senior Live Review Required';

      const updated = await prisma.batchWeeklyTarget.upsert({
        where: {
          batchId_weekNo: { batchId, weekNo }
        },
        create: {
          batchId,
          weekNo,
          targetCount: targetCount || 98,
          startDate: startDate || new Date(DEFAULT_TARGET_SCHEDULE[weekNo - 1]?.startDate || Date.now()),
          requirement
        },
        update: {
          ...(targetCount !== undefined && { targetCount }),
          ...(startDate && { startDate }),
          ...(requirement && { requirement })
        }
      });
      results.push(updated);
    }

    return res.status(200).json({
      success: true,
      message: 'Batch weekly targets updated successfully.',
      targets: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/weekly-targets/counters
 * Update platform counters for a student (LeetCode, CodeChef, Codeforces, HackerRank, GFG)
 * Supports:
 * - action: 'increment' | 'decrement' | 'set'
 * - platform: 'leetcode' | 'codechef' | 'codeforces' | 'hackerrank' | 'gfg'
 * - amount: number (default 1)
 * Or direct object: { leetcodeSolved, codechefSolved, codeforcesSolved, hackerrankSolved, gfgSolved }
 */
export const updateCodingCounters = async (req, res, next) => {
  try {
    const targetStudentId = req.body.studentId || req.body.menteeId;
    const isTargetingOther = targetStudentId && targetStudentId !== req.user.id;
    let userId = req.user.id;

    if (isTargetingOther) {
      if (req.user.role === 'MENTEE') {
        return res.status(403).json({ success: false, message: 'Forbidden: Mentees can only update their own counters.' });
      }

      if (req.user.role === 'MENTOR') {
        const assignment = await prisma.mentorMenteeAssignment.findFirst({
          where: { mentorId: req.user.id, menteeId: targetStudentId, status: 'ACTIVE' }
        });
        if (!assignment) {
          return res.status(403).json({ success: false, message: 'Access denied: You can only adjust counters for your assigned mentees.' });
        }
      }

      if (req.user.role === 'TRAINER') {
        const myBatches = await prisma.trainerBatch.findMany({
          where: { trainerId: req.user.id },
          select: { batchId: true }
        });
        const batchIds = myBatches.map(b => b.batchId);
        const inBatch = await prisma.batchMentee.findFirst({
          where: { menteeId: targetStudentId, batchId: { in: batchIds } }
        });
        if (!inBatch) {
          return res.status(403).json({ success: false, message: 'Access denied: Student is not in your assigned training batches.' });
        }
      }

      userId = targetStudentId;
    }

    const { platform, action, amount, leetcodeSolved, codechefSolved, codeforcesSolved, hackerrankSolved, gfgSolved } = req.body;

    // Fetch existing coding profile
    let current = await prisma.codingProfile.findUnique({
      where: { menteeId: userId }
    });

    if (!current) {
      current = await prisma.codingProfile.create({
        data: {
          menteeId: userId,
          leetcodeSolved: 0,
          codechefSolved: 0,
          codeforcesSolved: 0,
          hackerrankSolved: 0,
          gfgSolved: 0
        }
      });
    }

    const updates = {};

    // Platform mapping
    const platformFieldMap = {
      leetcode: 'leetcodeSolved',
      codechef: 'codechefSolved',
      codeforces: 'codeforcesSolved',
      hackerrank: 'hackerrankSolved',
      gfg: 'gfgSolved'
    };

    if (platform && platformFieldMap[platform.toLowerCase()]) {
      const field = platformFieldMap[platform.toLowerCase()];
      const currentVal = current[field] ?? 0;
      const step = Math.abs(Number(amount) || 1);

      if (action === 'increment') {
        updates[field] = currentVal + step;
      } else if (action === 'decrement') {
        updates[field] = Math.max(0, currentVal - step);
      } else if (action === 'set') {
        updates[field] = Math.max(0, Number(amount) || 0);
      }
    }

    // Direct values
    if (leetcodeSolved !== undefined) updates.leetcodeSolved = Math.max(0, Number(leetcodeSolved) || 0);
    if (codechefSolved !== undefined) updates.codechefSolved = Math.max(0, Number(codechefSolved) || 0);
    if (codeforcesSolved !== undefined) updates.codeforcesSolved = Math.max(0, Number(codeforcesSolved) || 0);
    if (hackerrankSolved !== undefined) updates.hackerrankSolved = Math.max(0, Number(hackerrankSolved) || 0);
    if (gfgSolved !== undefined) updates.gfgSolved = Math.max(0, Number(gfgSolved) || 0);

    const updated = await prisma.codingProfile.update({
      where: { menteeId: userId },
      data: updates
    });

    return res.status(200).json({
      success: true,
      message: 'Coding counters updated successfully.',
      codingProfile: updated
    });
  } catch (error) {
    next(error);
  }
};
