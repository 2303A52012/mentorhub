import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

export const getMentees = async (req, res, next) => {
  try {
    const { batchId, search, status, completionFilter, mentorId } = req.query;
    const userId = req.user.id || req.user._id;

    let menteeUserIds = null;

    if (req.user.role === 'MENTOR') {
      const assignments = await prisma.mentorMenteeAssignment.findMany({
        where: {
          mentorId: userId,
          status: 'ACTIVE'
        },
        select: { menteeId: true }
      });
      menteeUserIds = assignments.map((a) => a.menteeId);
    } else if (req.user.role === 'TRAINER') {
      const trainerBatches = await prisma.trainerBatch.findMany({
        where: { trainerId: userId },
        select: { batchId: true }
      });
      const trainerBatchIds = trainerBatches.map((tb) => tb.batchId);
      const batchMentees = await prisma.batchMentee.findMany({
        where: { batchId: { in: trainerBatchIds } },
        select: { menteeId: true }
      });
      menteeUserIds = batchMentees.map((bm) => bm.menteeId);
    } else if (mentorId && mentorId !== 'ALL') {
      const assignments = await prisma.mentorMenteeAssignment.findMany({
        where: {
          mentorId: mentorId,
          status: 'ACTIVE'
        },
        select: { menteeId: true }
      });
      menteeUserIds = assignments.map((a) => a.menteeId);
    }

    const where = {
      role: 'MENTEE'
    };

    if (menteeUserIds) {
      where.id = { in: menteeUserIds };
    }

    if (batchId && batchId !== 'ALL') {
      where.menteeBatches = {
        some: { batchId }
      };
    }

    if (status) {
      where.accountStatus = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    const mentees = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        menteeProfile: true,
        codingProfile: true,
        menteeBatches: {
          include: {
            batch: { select: { id: true, name: true, academicYear: true } }
          }
        },
        menteeAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            mentor: { select: { id: true, name: true, email: true } }
          }
        },
        menteeTasks: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedMentees = mentees.map((mentee) => {
      const totalAssigned = mentee.menteeTasks.length;
      const approvedCount = mentee.menteeTasks.filter((t) => t.status === 'APPROVED').length;
      const submittedCount = mentee.menteeTasks.filter(
        (t) => t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW'
      ).length;
      const pendingCount = mentee.menteeTasks.filter(
        (t) => t.status === 'IN_PROGRESS' || t.status === 'RESUBMISSION_REQUIRED'
      ).length;
      const overdueCount = mentee.menteeTasks.filter((t) => t.status === 'OVERDUE').length;

      const completionRate =
        totalAssigned > 0 ? Math.round((approvedCount / totalAssigned) * 100) : 0;

      const isAtRisk = (totalAssigned >= 2 && completionRate < 40) || overdueCount >= 2;

      const batches = mentee.menteeBatches.map((mb) => ({
        ...mb.batch,
        _id: mb.batch.id
      }));

      const mentors = mentee.menteeAssignments.map((a) => ({
        ...a.mentor,
        _id: a.mentor.id
      }));

      return {
        _id: mentee.id,
        id: mentee.id,
        name: mentee.name,
        email: mentee.email,
        role: mentee.role,
        accountStatus: mentee.accountStatus,
        createdAt: mentee.createdAt,
        profile: mentee.menteeProfile || {},
        codingProfile: mentee.codingProfile || {},
        batches,
        mentors,
        stats: {
          totalAssigned,
          approvedCount,
          submittedCount,
          pendingCount,
          overdueCount,
          completionRate,
          isAtRisk
        }
      };
    });

    let result = enrichedMentees;
    if (batchId) {
      result = result.filter((m) =>
        m.batches.some((b) => b._id.toString() === batchId.toString() || b.id === batchId)
      );
    }

    if (completionFilter) {
      if (completionFilter === 'low') {
        result = result.filter((m) => m.stats.completionRate < 50);
      } else if (completionFilter === 'high') {
        result = result.filter((m) => m.stats.completionRate >= 75);
      } else if (completionFilter === 'at-risk') {
        result = result.filter((m) => m.stats.isAtRisk);
      }
    }

    return res.status(200).json({
      success: true,
      count: result.length,
      mentees: result
    });
  } catch (error) {
    next(error);
  }
};

export const createMentee = async (req, res, next) => {
  try {
    const {
      name,
      email,
      studentId,
      rollNumber,
      password,
      mobile,
      branch,
      academicYear,
      section,
      skills,
      interests,
      batchId,
      mentorId,
      resumeUrl
    } = req.body;

    const actorId = req.user.id || req.user._id;

    if (!name || !email || !studentId || !rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, student ID, and roll number are required.'
      });
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase().trim(), mode: 'insensitive' } }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    const initialPassword = password || 'Welcome@123';
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'MENTEE',
        mustChangePassword: true,
        menteeProfile: {
          create: {
            studentId: studentId.trim(),
            rollNumber: rollNumber.trim(),
            mobile: mobile || '',
            branch: branch || 'Computer Science & Engineering',
            academicYear: Number(academicYear) || 2027,
            section: section || 'A',
            skills: Array.isArray(skills) ? skills : [],
            interests: Array.isArray(interests) ? interests : []
          }
        },
        codingProfile: {
          create: {
            resumeUrl: resumeUrl || ''
          }
        }
      },
      include: {
        menteeProfile: true
      }
    });

    if (batchId) {
      await prisma.batchMentee.upsert({
        where: { batchId_menteeId: { batchId, menteeId: user.id } },
        create: { batchId, menteeId: user.id },
        update: {}
      });
    }

    const assignedMentorId = mentorId || (req.user.role === 'MENTOR' ? actorId : null);
    if (assignedMentorId) {
      await prisma.mentorMenteeAssignment.upsert({
        where: {
          mentorId_menteeId: { mentorId: assignedMentorId, menteeId: user.id }
        },
        create: {
          mentorId: assignedMentorId,
          menteeId: user.id,
          batchId: batchId || null
        },
        update: {
          batchId: batchId || null,
          status: 'ACTIVE'
        }
      });

      await prisma.notification.create({
        data: {
          userId: assignedMentorId,
          type: 'MENTEE_ASSIGNED',
          title: 'New Mentee Assigned',
          message: `${user.name} (${rollNumber}) was assigned to you.`
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'CREATE_MENTEE',
        resourceType: 'User',
        resourceId: user.id,
        details: { email: user.email, rollNumber }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Mentee account created successfully.',
      mentee: {
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        temporaryPassword: initialPassword,
        profile: user.menteeProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMenteeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const mentee = await prisma.user.findFirst({
      where: { id, role: 'MENTEE' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        menteeProfile: true,
        codingProfile: true,
        menteeBatches: {
          include: {
            batch: { select: { id: true, name: true, academicYear: true } }
          }
        },
        menteeAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            mentor: { select: { id: true, name: true, email: true } }
          }
        },
        menteeTasks: {
          include: {
            task: {
              include: { problems: true }
            },
            reviewer: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!mentee) {
      return res.status(404).json({
        success: false,
        message: 'Mentee not found.'
      });
    }

    const approvedCount = mentee.menteeTasks.filter((t) => t.status === 'APPROVED').length;
    const totalAssigned = mentee.menteeTasks.length;
    const completionRate =
      totalAssigned > 0 ? Math.round((approvedCount / totalAssigned) * 100) : 0;

    const formattedTasks = mentee.menteeTasks.map((t) => ({
      ...t,
      _id: t.id,
      taskId: {
        ...t.task,
        _id: t.task.id,
        problems: t.task.problems.map((p) => ({ ...p, _id: p.id }))
      },
      reviewerId: t.reviewer ? { ...t.reviewer, _id: t.reviewer.id } : null
    }));

    return res.status(200).json({
      success: true,
      mentee: {
        _id: mentee.id,
        id: mentee.id,
        name: mentee.name,
        email: mentee.email,
        role: mentee.role,
        accountStatus: mentee.accountStatus,
        createdAt: mentee.createdAt,
        profile: mentee.menteeProfile || {},
        codingProfile: mentee.codingProfile || {},
        batches: mentee.menteeBatches.map((mb) => ({ ...mb.batch, _id: mb.batch.id })),
        mentors: mentee.menteeAssignments.map((a) => ({ ...a.mentor, _id: a.mentor.id })),
        tasks: formattedTasks,
        stats: {
          totalAssigned,
          approvedCount,
          completionRate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMentee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, accountStatus, profile, codingProfile } = req.body;
    const actorId = req.user.id || req.user._id;

    const mentee = await prisma.user.findFirst({
      where: { id, role: 'MENTEE' }
    });

    if (!mentee) {
      return res.status(404).json({
        success: false,
        message: 'Mentee not found.'
      });
    }

    if (req.user.role === 'MENTEE' && actorId !== mentee.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const userData = {};
    if (name) userData.name = name.trim();
    if (accountStatus && req.user.role === 'ADMIN') {
      userData.accountStatus = accountStatus;
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id },
        data: userData
      });
    }

    if (profile) {
      await prisma.menteeProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          studentId: profile.studentId || 'STU',
          rollNumber: profile.rollNumber || 'ROLL',
          mobile: profile.mobile || '',
          branch: profile.branch || 'CSE',
          academicYear: Number(profile.academicYear) || 2027,
          section: profile.section || 'A',
          skills: Array.isArray(profile.skills) ? profile.skills : [],
          interests: Array.isArray(profile.interests) ? profile.interests : []
        },
        update: {
          ...(profile.studentId && { studentId: profile.studentId }),
          ...(profile.rollNumber && { rollNumber: profile.rollNumber }),
          ...(profile.mobile !== undefined && { mobile: profile.mobile }),
          ...(profile.branch && { branch: profile.branch }),
          ...(profile.academicYear && { academicYear: Number(profile.academicYear) }),
          ...(profile.section && { section: profile.section }),
          ...(Array.isArray(profile.skills) && { skills: profile.skills }),
          ...(Array.isArray(profile.interests) && { interests: profile.interests })
        }
      });
    }

    if (codingProfile) {
      await prisma.codingProfile.upsert({
        where: { menteeId: id },
        create: {
          menteeId: id,
          linkedinUrl: codingProfile.linkedinUrl || '',
          githubUrl: codingProfile.githubUrl || '',
          leetcodeUrl: codingProfile.leetcodeUrl || '',
          codechefUrl: codingProfile.codechefUrl || '',
          codeforcesUrl: codingProfile.codeforcesUrl || '',
          hackerrankUrl: codingProfile.hackerrankUrl || '',
          gfgUrl: codingProfile.gfgUrl || '',
          resumeUrl: codingProfile.resumeUrl || '',
          customProfiles: codingProfile.customProfiles || []
        },
        update: {
          ...(codingProfile.linkedinUrl !== undefined && { linkedinUrl: codingProfile.linkedinUrl }),
          ...(codingProfile.githubUrl !== undefined && { githubUrl: codingProfile.githubUrl }),
          ...(codingProfile.leetcodeUrl !== undefined && { leetcodeUrl: codingProfile.leetcodeUrl }),
          ...(codingProfile.codechefUrl !== undefined && { codechefUrl: codingProfile.codechefUrl }),
          ...(codingProfile.codeforcesUrl !== undefined && { codeforcesUrl: codingProfile.codeforcesUrl }),
          ...(codingProfile.hackerrankUrl !== undefined && { hackerrankUrl: codingProfile.hackerrankUrl }),
          ...(codingProfile.gfgUrl !== undefined && { gfgUrl: codingProfile.gfgUrl }),
          ...(codingProfile.resumeUrl !== undefined && { resumeUrl: codingProfile.resumeUrl }),
          ...(codingProfile.customProfiles !== undefined && { customProfiles: codingProfile.customProfiles })
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Mentee profile updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const getMentors = async (req, res, next) => {
  try {
    const mentors = await prisma.user.findMany({
      where: { role: 'MENTOR' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        mentorProfile: true,
        mentorBatches: {
          include: {
            batch: { select: { id: true, name: true, academicYear: true } }
          }
        },
        mentorAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            mentee: {
              select: {
                id: true,
                name: true,
                email: true,
                menteeProfile: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const enrichedMentors = mentors.map((m) => ({
      _id: m.id,
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      accountStatus: m.accountStatus,
      profile: m.mentorProfile || {},
      activeMenteesCount: m.mentorAssignments.length,
      batches: m.mentorBatches.map((mb) => ({ ...mb.batch, _id: mb.batch.id })),
      assignedMentees: m.mentorAssignments.map((a) => ({
        id: a.mentee?.id,
        _id: a.mentee?.id,
        name: a.mentee?.name,
        email: a.mentee?.email,
        rollNumber: a.mentee?.menteeProfile?.rollNumber
      }))
    }));

    return res.status(200).json({
      success: true,
      mentors: enrichedMentors
    });
  } catch (error) {
    next(error);
  }
};

export const createMentor = async (req, res, next) => {
  try {
    const { name, email, password, department, designation, maxMentees, bio } = req.body;
    const actorId = req.user.id || req.user._id;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required.'
      });
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase().trim(), mode: 'insensitive' } }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    const initialPassword = password || 'Mentor@123';
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const mentor = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'MENTOR',
        mustChangePassword: true,
        mentorProfile: {
          create: {
            department: department || 'Computer Science & Engineering',
            designation: designation || 'Technical Mentor',
            maxMentees: Number(maxMentees) || 50,
            bio: bio || ''
          }
        }
      },
      include: {
        mentorProfile: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'CREATE_MENTOR',
        resourceType: 'User',
        resourceId: mentor.id,
        details: { email: mentor.email }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Mentor account created successfully.',
      mentor: {
        _id: mentor.id,
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        temporaryPassword: initialPassword,
        profile: mentor.mentorProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMentorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.id || req.user._id;

    if (req.user.role === 'MENTOR' && actorId !== id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const mentor = await prisma.user.findFirst({
      where: { id, role: 'MENTOR' },
      include: {
        mentorProfile: true,
        mentorBatches: {
          include: {
            batch: {
              include: {
                _count: { select: { mentees: true } }
              }
            }
          }
        },
        mentorAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            mentee: {
              select: {
                id: true,
                name: true,
                email: true,
                accountStatus: true,
                menteeProfile: true
              }
            }
          }
        },
        tasksCreated: {
          select: { id: true, title: true, weekNo: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        },
        createdMockSections: {
          select: { id: true, title: true, weekNumber: true, status: true, mockType: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        },
        evaluatorMockEvaluations: {
          select: { id: true, overallScore: true, recommendation: true, createdAt: true }
        }
      }
    });

    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor not found.' });
    }

    const evaluationsCount = mentor.evaluatorMockEvaluations.length;
    const avgEvaluationScore = evaluationsCount > 0
      ? (mentor.evaluatorMockEvaluations.reduce((acc, ev) => acc + ev.overallScore, 0) / evaluationsCount).toFixed(1)
      : null;

    return res.status(200).json({
      success: true,
      mentor: {
        id: mentor.id,
        _id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        role: mentor.role,
        accountStatus: mentor.accountStatus,
        createdAt: mentor.createdAt,
        profile: mentor.mentorProfile || {},
        batches: mentor.mentorBatches.map((mb) => ({
          id: mb.batch.id,
          _id: mb.batch.id,
          name: mb.batch.name,
          academicYear: mb.batch.academicYear,
          menteeCount: mb.batch._count?.mentees || 0
        })),
        assignedMentees: mentor.mentorAssignments.map((a) => ({
          id: a.mentee?.id,
          _id: a.mentee?.id,
          name: a.mentee?.name,
          email: a.mentee?.email,
          accountStatus: a.mentee?.accountStatus,
          rollNumber: a.mentee?.menteeProfile?.rollNumber || '',
          studentId: a.mentee?.menteeProfile?.studentId || '',
          branch: a.mentee?.menteeProfile?.branch || 'CSE',
          section: a.mentee?.menteeProfile?.section || 'A'
        })),
        tasksCreated: mentor.tasksCreated,
        mockSectionsCreated: mentor.createdMockSections,
        stats: {
          activeMenteesCount: mentor.mentorAssignments.length,
          batchesCount: mentor.mentorBatches.length,
          tasksCreatedCount: mentor.tasksCreated.length,
          mockSectionsCount: mentor.createdMockSections.length,
          evaluationsConducted: evaluationsCount,
          avgEvaluationScore
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMentor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, accountStatus, profile } = req.body;
    const actorId = req.user.id || req.user._id;

    if (req.user.role === 'MENTOR' && actorId !== id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const mentor = await prisma.user.findFirst({
      where: { id, role: 'MENTOR' }
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found.'
      });
    }

    const userData = {};
    if (name) userData.name = name.trim();
    if (accountStatus && req.user.role === 'ADMIN') {
      userData.accountStatus = accountStatus;
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id },
        data: userData
      });
    }

    if (profile) {
      await prisma.mentorProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          rollNumber: profile.rollNumber || '',
          department: profile.department || 'Computer Science & Engineering',
          designation: profile.designation || 'Technical Mentor',
          maxMentees: Number(profile.maxMentees) || 50,
          bio: profile.bio || ''
        },
        update: {
          ...(profile.rollNumber !== undefined && { rollNumber: profile.rollNumber }),
          ...(profile.department && { department: profile.department }),
          ...(profile.designation && { designation: profile.designation }),
          ...(profile.maxMentees && { maxMentees: Number(profile.maxMentees) }),
          ...(profile.bio !== undefined && { bio: profile.bio })
        }
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id },
      include: { mentorProfile: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Mentor updated successfully.',
      mentor: {
        id: updated.id,
        _id: updated.id,
        name: updated.name,
        email: updated.email,
        profile: updated.mentorProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id || req.user._id;
    const admin = await prisma.user.findFirst({
      where: { id: adminId, role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    // Platform-wide aggregate metrics
    const [
      totalUsers,
      totalMentees,
      totalMentors,
      totalBatches,
      totalTasks,
      totalMockSections,
      recentAuditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'MENTEE' } }),
      prisma.user.count({ where: { role: 'MENTOR' } }),
      prisma.batch.count(),
      prisma.task.count(),
      prisma.mockSection.count(),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } }
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        _id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        accountStatus: admin.accountStatus,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        designation: 'Senior Platform Administrator',
        department: 'Academic Operations & Governance',
        stats: {
          totalUsers,
          totalMentees,
          totalMentors,
          totalBatches,
          totalTasks,
          totalMockSections
        },
        recentAuditLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id || req.user._id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    const updated = await prisma.user.update({
      where: { id: adminId },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        updatedAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'UPDATE_ADMIN_PROFILE',
        resourceType: 'User',
        resourceId: adminId,
        details: { name: updated.name }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Admin profile updated successfully.',
      admin: {
        ...updated,
        _id: updated.id
      }
    });
  } catch (error) {
    next(error);
  }
};

export const assignMentorToMentee = async (req, res, next) => {
  try {
    const { id: menteeId } = req.params;
    const { mentorId, batchId } = req.body;

    if (!mentorId) {
      return res.status(400).json({
        success: false,
        message: 'mentorId is required.'
      });
    }

    const targetMentor = await prisma.user.findUnique({
      where: { id: mentorId }
    });

    if (!targetMentor || targetMentor.role !== 'MENTOR') {
      return res.status(404).json({
        success: false,
        message: 'Target mentor not found.'
      });
    }

    // Deactivate previous active mentor assignments for this mentee
    await prisma.mentorMenteeAssignment.updateMany({
      where: {
        menteeId,
        mentorId: { not: mentorId },
        status: 'ACTIVE'
      },
      data: {
        status: 'INACTIVE'
      }
    });

    const assignment = await prisma.mentorMenteeAssignment.upsert({
      where: {
        mentorId_menteeId: { mentorId, menteeId }
      },
      create: {
        mentorId,
        menteeId,
        batchId: batchId || null,
        status: 'ACTIVE',
        assignedAt: new Date()
      },
      update: {
        batchId: batchId || null,
        status: 'ACTIVE',
        assignedAt: new Date()
      }
    });

    const mentee = await prisma.user.findUnique({ where: { id: menteeId } });

    // Notify new mentor
    await prisma.notification.create({
      data: {
        userId: mentorId,
        type: 'MENTEE_ASSIGNED',
        title: 'Mentee Assigned',
        message: `${mentee?.name || 'A student'} was assigned to you.`
      }
    });

    // Notify mentee
    await prisma.notification.create({
      data: {
        userId: menteeId,
        type: 'SYSTEM',
        title: 'Mentor Assigned',
        message: `Your technical mentor has been assigned to ${targetMentor.name}.`
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id || req.user._id,
        action: 'ASSIGN_MENTOR',
        resourceType: 'MentorMenteeAssignment',
        resourceId: assignment.id,
        details: {
          menteeId,
          menteeName: mentee?.name,
          mentorId,
          mentorName: targetMentor.name
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: `Mentor ${targetMentor.name} assigned to ${mentee?.name || 'student'} successfully.`,
      assignment: { ...assignment, _id: assignment.id }
    });
  } catch (error) {
    next(error);
  }
};

export const reallocateMentor = async (req, res, next) => {
  try {
    const { sourceMentorId, targetMentorId, menteeIds, deactivateSourceMentor, reason } = req.body;
    const actorId = req.user.id || req.user._id;

    if (!sourceMentorId || !targetMentorId) {
      return res.status(400).json({
        success: false,
        message: 'Both sourceMentorId and targetMentorId are required.'
      });
    }

    if (sourceMentorId === targetMentorId) {
      return res.status(400).json({
        success: false,
        message: 'Source mentor and target mentor must be different.'
      });
    }

    const [sourceMentor, targetMentor] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sourceMentorId },
        include: { mentorProfile: true }
      }),
      prisma.user.findUnique({
        where: { id: targetMentorId },
        include: { mentorProfile: true }
      })
    ]);

    if (!sourceMentor || sourceMentor.role !== 'MENTOR') {
      return res.status(404).json({
        success: false,
        message: 'Source mentor was not found.'
      });
    }

    if (!targetMentor || targetMentor.role !== 'MENTOR') {
      return res.status(404).json({
        success: false,
        message: 'Target mentor was not found.'
      });
    }

    // Find active assignments of the source mentor
    const assignmentWhere = {
      mentorId: sourceMentorId,
      status: 'ACTIVE'
    };

    if (Array.isArray(menteeIds) && menteeIds.length > 0) {
      assignmentWhere.menteeId = { in: menteeIds };
    }

    const activeAssignments = await prisma.mentorMenteeAssignment.findMany({
      where: assignmentWhere,
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            menteeProfile: true
          }
        }
      }
    });

    if (activeAssignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active mentees found under mentor '${sourceMentor.name}' to reallocate.`
      });
    }

    const reallocatedMenteeIds = activeAssignments.map((a) => a.menteeId);

    // 1. Mark source assignments as INACTIVE
    await prisma.mentorMenteeAssignment.updateMany({
      where: {
        mentorId: sourceMentorId,
        menteeId: { in: reallocatedMenteeIds }
      },
      data: {
        status: 'INACTIVE'
      }
    });

    // 2. Also ensure any other old active assignments for these mentees are deactivated
    await prisma.mentorMenteeAssignment.updateMany({
      where: {
        menteeId: { in: reallocatedMenteeIds },
        mentorId: { not: targetMentorId },
        status: 'ACTIVE'
      },
      data: {
        status: 'INACTIVE'
      }
    });

    // 3. Upsert assignments for target mentor
    for (const a of activeAssignments) {
      await prisma.mentorMenteeAssignment.upsert({
        where: {
          mentorId_menteeId: {
            mentorId: targetMentorId,
            menteeId: a.menteeId
          }
        },
        create: {
          mentorId: targetMentorId,
          menteeId: a.menteeId,
          batchId: a.batchId || null,
          status: 'ACTIVE',
          assignedAt: new Date()
        },
        update: {
          batchId: a.batchId || null,
          status: 'ACTIVE',
          assignedAt: new Date()
        }
      });
    }

    // 4. Optionally deactivate the source mentor (e.g. mentor left the institution)
    let sourceDeactivated = false;
    if (deactivateSourceMentor) {
      await prisma.user.update({
        where: { id: sourceMentorId },
        data: { accountStatus: 'INACTIVE' }
      });
      sourceDeactivated = true;
    }

    // 5. Notify the target mentor
    await prisma.notification.create({
      data: {
        userId: targetMentorId,
        type: 'MENTEE_ASSIGNED',
        title: 'Mentees Reallocated',
        message: `${activeAssignments.length} student(s) have been reallocated to you from ${sourceMentor.name}.`
      }
    });

    // 6. Notify each student
    for (const a of activeAssignments) {
      await prisma.notification.create({
        data: {
          userId: a.menteeId,
          type: 'SYSTEM',
          title: 'Mentor Reallocated',
          message: `Your technical mentor has been reallocated from ${sourceMentor.name} to ${targetMentor.name}.`
        }
      });
    }

    // 7. Record Audit Log
    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'MENTOR_REALLOCATION',
        resourceType: 'MentorMenteeAssignment',
        resourceId: targetMentorId,
        details: {
          sourceMentorId,
          sourceMentorName: sourceMentor.name,
          targetMentorId,
          targetMentorName: targetMentor.name,
          reallocatedCount: activeAssignments.length,
          reallocatedMenteeIds,
          sourceDeactivated,
          reason: reason || 'Administrative reallocation'
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: `Successfully reallocated ${activeAssignments.length} student(s) from ${sourceMentor.name} to ${targetMentor.name}.`,
      reallocatedCount: activeAssignments.length,
      sourceMentor: {
        id: sourceMentor.id,
        name: sourceMentor.name,
        email: sourceMentor.email,
        accountStatus: sourceDeactivated ? 'INACTIVE' : sourceMentor.accountStatus
      },
      targetMentor: {
        id: targetMentor.id,
        name: targetMentor.name,
        email: targetMentor.email
      },
      reallocatedMentees: activeAssignments.map((a) => ({
        id: a.mentee.id,
        name: a.mentee.name,
        email: a.mentee.email,
        rollNumber: a.mentee.menteeProfile?.rollNumber || ''
      }))
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// SUPER ADMIN EXCLUSIVE: ADMINISTRATOR MANAGEMENT
// ============================================================================

export const getAdmins = async (req, res, next) => {
  try {
    const isSuperAdminCaller =
      req.user.role === 'ADMIN' && req.user.email?.toLowerCase() === 'admin@sru.edu.in';

    if (!isSuperAdminCaller) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the Super Administrator (admin@sru.edu.in) can view the platform administrators directory.'
      });
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const enrichedAdmins = admins.map((admin) => ({
      ...admin,
      _id: admin.id,
      isSuperAdmin: admin.email.toLowerCase() === 'admin@sru.edu.in'
    }));

    return res.status(200).json({
      success: true,
      count: enrichedAdmins.length,
      admins: enrichedAdmins
    });
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req, res, next) => {
  try {
    const isSuperAdminCaller =
      req.user.role === 'ADMIN' && req.user.email?.toLowerCase() === 'admin@sru.edu.in';

    if (!isSuperAdminCaller) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the Super Administrator (admin@sru.edu.in) can create new administrators.'
      });
    }

    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Administrator name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Administrator email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `An account with email '${normalizedEmail}' already exists (Current Role: ${existingUser.role}).`
      });
    }

    if (!password || typeof password !== 'string' || password.trim().length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A secure password of at least 8 characters is required to provision an administrator.'
      });
    }

    if (password.trim() === 'Password@123') {
      return res.status(400).json({
        success: false,
        message: 'Default or predictable passwords like "Password@123" are not permitted.'
      });
    }

    const tempPassword = password.trim();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const newAdmin = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        mustChangePassword: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id || req.user._id,
        action: 'CREATE_ADMIN',
        resourceType: 'User',
        resourceId: newAdmin.id,
        details: {
          createdAdminEmail: newAdmin.email,
          createdAdminName: newAdmin.name,
          createdBy: req.user.email
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: `Administrator '${newAdmin.name}' created successfully with temporary password: ${tempPassword}`,
      admin: {
        ...newAdmin,
        _id: newAdmin.id,
        isSuperAdmin: false
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const isSuperAdminCaller =
      req.user.role === 'ADMIN' && req.user.email?.toLowerCase() === 'admin@sru.edu.in';

    if (!isSuperAdminCaller) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the Super Administrator (admin@sru.edu.in) can modify administrator accounts.'
      });
    }

    const { id } = req.params;
    const { name, accountStatus } = req.body;

    const targetAdmin = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetAdmin || targetAdmin.role !== 'ADMIN') {
      return res.status(404).json({ success: false, message: 'Administrator not found.' });
    }

    if (targetAdmin.email.toLowerCase() === 'admin@sru.edu.in') {
      if (accountStatus && accountStatus !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: 'The primary Super Administrator (admin@sru.edu.in) cannot be deactivated or suspended.'
        });
      }
    }

    const dataToUpdate = {};
    if (name && name.trim()) dataToUpdate.name = name.trim();
    if (accountStatus) dataToUpdate.accountStatus = accountStatus;

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        updatedAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id || req.user._id,
        action: 'UPDATE_ADMIN',
        resourceType: 'User',
        resourceId: id,
        details: {
          updatedEmail: targetAdmin.email,
          changes: dataToUpdate
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Administrator account updated successfully.',
      admin: {
        ...updated,
        _id: updated.id,
        isSuperAdmin: updated.email.toLowerCase() === 'admin@sru.edu.in'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdmin = async (req, res, next) => {
  try {
    const isSuperAdminCaller =
      req.user.role === 'ADMIN' && req.user.email?.toLowerCase() === 'admin@sru.edu.in';

    if (!isSuperAdminCaller) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the Super Administrator (admin@sru.edu.in) can delete administrator accounts.'
      });
    }

    const { id } = req.params;

    const targetAdmin = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetAdmin || targetAdmin.role !== 'ADMIN') {
      return res.status(404).json({ success: false, message: 'Administrator not found.' });
    }

    if (targetAdmin.email.toLowerCase() === 'admin@sru.edu.in') {
      return res.status(400).json({
        success: false,
        message: 'The primary Super Administrator (admin@sru.edu.in) cannot be deleted.'
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id || req.user._id,
        action: 'DELETE_ADMIN',
        resourceType: 'User',
        resourceId: id,
        details: {
          deletedAdminEmail: targetAdmin.email,
          deletedAdminName: targetAdmin.name
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: `Administrator '${targetAdmin.name}' (${targetAdmin.email}) has been permanently deleted.`
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMentee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mentee = await prisma.user.findUnique({
      where: { id }
    });

    if (!mentee || mentee.role !== 'MENTEE') {
      return res.status(404).json({ success: false, message: 'Mentee not found.' });
    }

    await prisma.user.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id || req.user._id,
        action: 'DELETE_MENTEE',
        resourceType: 'User',
        resourceId: id,
        details: {
          deletedMenteeEmail: mentee.email,
          deletedMenteeName: mentee.name
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: `Student '${mentee.name}' has been permanently deleted.`
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMentor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mentor = await prisma.user.findUnique({
      where: { id }
    });

    if (!mentor || mentor.role !== 'MENTOR') {
      return res.status(404).json({ success: false, message: 'Mentor not found.' });
    }

    await prisma.user.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id || req.user._id,
        action: 'DELETE_MENTOR',
        resourceType: 'User',
        resourceId: id,
        details: {
          deletedMentorEmail: mentor.email,
          deletedMentorName: mentor.name
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: `Faculty mentor '${mentor.name}' has been permanently deleted.`
    });
  } catch (error) {
    next(error);
  }
};

