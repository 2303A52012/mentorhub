import prisma from '../config/prisma.js';

export const getTaskReports = async (req, res, next) => {
  try {
    const { format } = req.query;

    const tasks = await prisma.task.findMany({
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        problems: true,
        menteeTasks: true
      },
      orderBy: { weekNo: 'asc' }
    });

    const reportData = tasks.map((t) => {
      const assignments = t.menteeTasks;
      const total = assignments.length;
      const approved = assignments.filter((a) => a.status === 'APPROVED').length;
      const submitted = assignments.filter(
        (a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW'
      ).length;
      const overdue = assignments.filter((a) => a.status === 'OVERDUE').length;

      return {
        weekNo: t.weekNo,
        title: t.title,
        problemCount: t.problems?.length || 0,
        assignmentDate: t.assignmentDate ? new Date(t.assignmentDate).toISOString().split('T')[0] : '',
        lastDate: t.lastDate ? new Date(t.lastDate).toISOString().split('T')[0] : '',
        creator: t.createdBy?.name || 'N/A',
        totalAssigned: total,
        approvedCount: approved,
        submittedCount: submitted,
        overdueCount: overdue,
        completionRate: total > 0 ? `${Math.round((approved / total) * 100)}%` : '0%'
      };
    });

    if (format === 'csv') {
      const headers = [
        'Week',
        'Title',
        'Problems',
        'Start Date',
        'Deadline',
        'Creator',
        'Total Assigned',
        'Approved',
        'Submitted',
        'Overdue',
        'Completion Rate'
      ];

      const csvRows = [
        headers.join(','),
        ...reportData.map((r) =>
          [
            `"Week ${r.weekNo}"`,
            `"${r.title.replace(/"/g, '""')}"`,
            r.problemCount,
            r.assignmentDate,
            r.lastDate,
            `"${r.creator}"`,
            r.totalAssigned,
            r.approvedCount,
            r.submittedCount,
            r.overdueCount,
            `"${r.completionRate}"`
          ].join(',')
        )
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="task-report.csv"');
      return res.status(200).send(csvRows.join('\n'));
    }

    return res.status(200).json({
      success: true,
      report: reportData
    });
  } catch (error) {
    next(error);
  }
};

export const getMenteeReports = async (req, res, next) => {
  try {
    const { format } = req.query;
    const userId = req.user.id || req.user._id;

    let where = { role: 'MENTEE' };
    if (req.user.role === 'MENTOR') {
      const assignments = await prisma.mentorMenteeAssignment.findMany({
        where: {
          mentorId: userId,
          status: 'ACTIVE'
        },
        select: { menteeId: true }
      });
      where.id = { in: assignments.map((a) => a.menteeId) };
    } else if (req.user.role === 'TRAINER') {
      const trainerBatches = await prisma.trainerBatch.findMany({
        where: { trainerId: userId },
        select: { batchId: true }
      });
      const batchIds = trainerBatches.map((tb) => tb.batchId);
      const batchMentees = await prisma.batchMentee.findMany({
        where: { batchId: { in: batchIds } },
        select: { menteeId: true }
      });
      where.id = { in: batchMentees.map((bm) => bm.menteeId) };
    }

    const mentees = await prisma.user.findMany({
      where,
      include: {
        menteeProfile: true,
        menteeTasks: true
      }
    });

    const reportData = mentees.map((m) => {
      const profile = m.menteeProfile;
      const tasks = m.menteeTasks;
      const total = tasks.length;
      const approved = tasks.filter((t) => t.status === 'APPROVED').length;
      const overdue = tasks.filter((t) => t.status === 'OVERDUE').length;

      return {
        name: m.name,
        email: m.email,
        rollNumber: profile?.rollNumber || 'N/A',
        branch: profile?.branch || 'CSE',
        academicYear: profile?.academicYear || 2027,
        totalAssigned: total,
        approvedCount: approved,
        overdueCount: overdue,
        completionRate: total > 0 ? `${Math.round((approved / total) * 100)}%` : '0%'
      };
    });

    if (format === 'csv') {
      const headers = [
        'Name',
        'Email',
        'Roll Number',
        'Branch',
        'Academic Year',
        'Total Assigned',
        'Approved',
        'Overdue',
        'Completion Rate'
      ];

      const csvRows = [
        headers.join(','),
        ...reportData.map((r) =>
          [
            `"${r.name}"`,
            `"${r.email}"`,
            `"${r.rollNumber}"`,
            `"${r.branch}"`,
            r.academicYear,
            r.totalAssigned,
            r.approvedCount,
            r.overdueCount,
            `"${r.completionRate}"`
          ].join(',')
        )
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="mentee-report.csv"');
      return res.status(200).send(csvRows.join('\n'));
    }

    return res.status(200).json({
      success: true,
      report: reportData
    });
  } catch (error) {
    next(error);
  }
};

export const getMockReports = async (req, res, next) => {
  try {
    const { format, weekNumber, status } = req.query;
    const userId = req.user.id || req.user._id;

    const where = {};
    if (req.user.role === 'MENTOR') {
      where.OR = [
        { evaluatorId: userId },
        { section: { createdById: userId } }
      ];
    } else if (req.user.role === 'TRAINER') {
      const trainerBatches = await prisma.trainerBatch.findMany({
        where: { trainerId: userId },
        select: { batchId: true }
      });
      const batchIds = trainerBatches.map((tb) => tb.batchId);
      where.mentee = {
        menteeBatches: {
          some: { batchId: { in: batchIds } }
        }
      };
    }

    if (weekNumber) {
      where.section = { ...where.section, weekNumber: parseInt(weekNumber, 10) };
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const slots = await prisma.mockSlot.findMany({
      where,
      include: {
        section: true,
        mentee: {
          include: { menteeProfile: true }
        },
        evaluator: {
          include: { mentorProfile: true }
        },
        evaluation: true
      },
      orderBy: [
        { sessionDate: 'desc' },
        { startTime: 'asc' }
      ]
    });

    const reportData = slots.map((s) => {
      const evaluation = s.evaluation;
      const menteeProfile = s.mentee?.menteeProfile;
      const mentorProfile = s.evaluator?.mentorProfile;

      const sessionDateStr = s.sessionDate ? new Date(s.sessionDate).toISOString().split('T')[0] : '';
      const timeSlot = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.startTime || 'TBD');

      return {
        id: s.id,
        weekNumber: s.section?.weekNumber ?? 'N/A',
        sectionTitle: s.section?.title || 'Weekly Mock',
        mockType: s.section?.mockType || 'TECHNICAL',
        studentName: s.mentee?.name || 'N/A',
        studentRollNumber: menteeProfile?.rollNumber || menteeProfile?.studentId || 'N/A',
        studentEmail: s.mentee?.email || '',
        studentBranch: menteeProfile?.branch || 'CSE',
        studentSection: menteeProfile?.section || '',
        evaluatorName: s.evaluator?.name || 'N/A',
        evaluatorRollNumber: mentorProfile?.rollNumber || '',
        evaluatorEmail: s.evaluator?.email || '',
        sessionDate: sessionDateStr,
        timeSlot,
        roomNumber: s.roomNumber || 'TBD',
        status: s.status,
        technicalScore: evaluation?.technicalScore !== undefined ? evaluation.technicalScore : 'N/A',
        communicationScore: evaluation?.communicationScore !== undefined ? evaluation.communicationScore : 'N/A',
        problemSolvingScore: evaluation?.problemSolvingScore !== undefined ? evaluation.problemSolvingScore : 'N/A',
        overallScore: evaluation?.overallScore !== undefined ? evaluation.overallScore : 'N/A',
        recommendation: evaluation?.recommendation ? evaluation.recommendation.replace(/_/g, ' ') : (s.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING'),
        feedback: evaluation?.notes || ''
      };
    });

    // Summary calculations
    const totalSlots = reportData.length;
    const completedCount = reportData.filter((r) => r.status === 'COMPLETED').length;
    const scheduledCount = reportData.filter((r) => r.status === 'SCHEDULED').length;
    const missedCount = reportData.filter((r) => r.status === 'MISSED').length;
    const cancelledCount = reportData.filter((r) => r.status === 'CANCELLED').length;
    const evaluatedSlots = reportData.filter((r) => typeof r.overallScore === 'number');
    const averageScore = evaluatedSlots.length > 0
      ? (evaluatedSlots.reduce((acc, curr) => acc + curr.overallScore, 0) / evaluatedSlots.length).toFixed(1)
      : 'N/A';

    const summary = {
      totalSlots,
      completedCount,
      scheduledCount,
      missedCount,
      cancelledCount,
      evaluatedCount: evaluatedSlots.length,
      averageScore
    };

    if (format === 'csv') {
      const headers = [
        'Week',
        'Section Title',
        'Mock Type',
        'Student Name',
        'Roll Number',
        'Student Email',
        'Branch',
        'Evaluator Mentor',
        'Mentor Email',
        'Interview Date',
        'Time Slot',
        'Room / Venue',
        'Status',
        'Technical Score',
        'Communication Score',
        'Problem Solving Score',
        'Overall Score',
        'Recommendation',
        'Mentor Feedback'
      ];

      const csvRows = [
        headers.join(','),
        ...reportData.map((r) =>
          [
            `"Week ${r.weekNumber}"`,
            `"${(r.sectionTitle || '').replace(/"/g, '""')}"`,
            `"${r.mockType}"`,
            `"${(r.studentName || '').replace(/"/g, '""')}"`,
            `"${r.studentRollNumber}"`,
            `"${r.studentEmail}"`,
            `"${r.studentBranch}"`,
            `"${(r.evaluatorName || '').replace(/"/g, '""')}"`,
            `"${r.evaluatorEmail}"`,
            r.sessionDate,
            `"${r.timeSlot}"`,
            `"${(r.roomNumber || '').replace(/"/g, '""')}"`,
            r.status,
            r.technicalScore,
            r.communicationScore,
            r.problemSolvingScore,
            r.overallScore,
            `"${r.recommendation}"`,
            `"${(r.feedback || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
          ].join(',')
        )
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="mock-interviews-report.csv"');
      return res.status(200).send(csvRows.join('\n'));
    }

    return res.status(200).json({
      success: true,
      summary,
      report: reportData
    });
  } catch (error) {
    next(error);
  }
};

