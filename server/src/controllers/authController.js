import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { ENV } from '../config/env.js';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  );
};

export const login = async (req, res, next) => {
  try {
    const { emailOrIdentifier, password } = req.body;

    if (!emailOrIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/identifier and password.'
      });
    }

    const trimmedInput = emailOrIdentifier.trim();
    const idPrefix = trimmedInput.toLowerCase().endsWith('@sru.edu.in')
      ? trimmedInput.slice(0, -'@sru.edu.in'.length)
      : trimmedInput.toLowerCase();
    const sruEmail = `${idPrefix}@sru.edu.in`;

    // Lookup user by direct email, sru email, or student ID / roll number
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmedInput.toLowerCase(), mode: 'insensitive' } },
          { email: { equals: sruEmail, mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      const profile = await prisma.menteeProfile.findFirst({
        where: {
          OR: [
            { studentId: { equals: trimmedInput, mode: 'insensitive' } },
            { rollNumber: { equals: trimmedInput, mode: 'insensitive' } },
            { studentId: { equals: idPrefix, mode: 'insensitive' } },
            { rollNumber: { equals: idPrefix, mode: 'insensitive' } }
          ]
        },
        include: { user: true }
      });
      if (profile && profile.user) {
        user = profile.user;
      }
    }

    if (!user) {
      const mentorProf = await prisma.mentorProfile.findFirst({
        where: {
          OR: [
            { rollNumber: { equals: trimmedInput, mode: 'insensitive' } },
            { rollNumber: { equals: idPrefix, mode: 'insensitive' } }
          ]
        },
        include: { user: true }
      });
      if (mentorProf && mentorProf.user) {
        user = mentorProf.user;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.accountStatus.toLowerCase()}. Contact platform administrator.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'LOGIN',
        resourceType: 'User',
        resourceId: user.id,
        details: { role: user.role }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.role === 'ADMIN' && user.email.toLowerCase() === 'admin@sru.edu.in',
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id || user._id },
      include: {
        menteeProfile: true,
        mentorProfile: true,
        codingProfile: true
      }
    });

    if (!fullUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let extraProfile = null;
    let codingProfile = fullUser.codingProfile || null;

    if (fullUser.role === 'MENTEE') {
      extraProfile = fullUser.menteeProfile;
    } else if (fullUser.role === 'MENTOR') {
      extraProfile = fullUser.mentorProfile;
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: fullUser.id,
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
        isSuperAdmin: fullUser.role === 'ADMIN' && fullUser.email.toLowerCase() === 'admin@sru.edu.in',
        accountStatus: fullUser.accountStatus,
        mustChangePassword: fullUser.mustChangePassword,
        profile: extraProfile,
        codingProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.'
      });
    }

    const userId = req.user.id || req.user._id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If not first-time change, verify current password
    if (!user.mustChangePassword || currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match.'
        });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'CHANGE_PASSWORD',
        resourceType: 'User',
        resourceId: userId,
        details: { timestamp: new Date() }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { emailOrIdentifier } = req.body;

    if (!emailOrIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email, Roll Number, or Faculty ID.'
      });
    }

    const trimmedInput = emailOrIdentifier.trim();

    // Lookup user by email or student ID / roll number
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: trimmedInput.toLowerCase(),
          mode: 'insensitive'
        }
      },
      include: {
        menteeProfile: true,
        mentorProfile: true,
        menteeAssignments: {
          where: { status: 'ACTIVE' },
          include: { mentor: true }
        }
      }
    });

    if (!user) {
      const profile = await prisma.menteeProfile.findFirst({
        where: {
          OR: [
            { studentId: { equals: trimmedInput, mode: 'insensitive' } },
            { rollNumber: { equals: trimmedInput, mode: 'insensitive' } }
          ]
        },
        include: {
          user: {
            include: {
              menteeProfile: true,
              mentorProfile: true,
              menteeAssignments: {
                where: { status: 'ACTIVE' },
                include: { mentor: true }
              }
            }
          }
        }
      });
      if (profile && profile.user) {
        user = profile.user;
      }
    }

    if (!user) {
      const mentorProf = await prisma.mentorProfile.findFirst({
        where: {
          rollNumber: { equals: trimmedInput, mode: 'insensitive' }
        },
        include: {
          user: {
            include: {
              menteeProfile: true,
              mentorProfile: true,
              menteeAssignments: {
                where: { status: 'ACTIVE' },
                include: { mentor: true }
              }
            }
          }
        }
      });
      if (mentorProf && mentorProf.user) {
        user = mentorProf.user;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found matching the provided identifier.'
      });
    }

    const now = new Date();

    if (user.role === 'MENTEE') {
      const assignedMentor = user.menteeAssignments[0]?.mentor;
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN', accountStatus: 'ACTIVE' }
      });

      // Target recipient for notification
      const recipientIds = assignedMentor ? [assignedMentor.id] : adminUsers.map((a) => a.id);

      for (const recipientId of recipientIds) {
        await prisma.notification.create({
          data: {
            userId: recipientId,
            type: 'PASSWORD_RESET_REQUEST',
            title: 'Mentee Password Reset Request',
            message: `${user.name} (${user.menteeProfile?.rollNumber || user.email}) has requested a password reset.`,
            link: `/mentor/mentees/${user.id}`
          }
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'PASSWORD_RESET_REQUEST',
          resourceType: 'User',
          resourceId: user.id,
          details: {
            requesterId: user.id,
            name: user.name,
            email: user.email,
            rollNumber: user.menteeProfile?.rollNumber || '',
            role: 'MENTEE',
            assignedMentorId: assignedMentor?.id || null,
            assignedMentorName: assignedMentor?.name || null,
            status: 'PENDING',
            requestedAt: now
          }
        }
      });

      return res.status(200).json({
        success: true,
        role: 'MENTEE',
        message: assignedMentor
          ? `Password reset request submitted to your assigned mentor (${assignedMentor.name}). Please contact them or wait for them to update your password.`
          : 'Password reset request submitted to the platform administrator. They will assist with resetting your password.'
      });
    }

    if (user.role === 'MENTOR') {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN', accountStatus: 'ACTIVE' }
      });

      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'PASSWORD_RESET_REQUEST',
            title: 'Mentor Password Reset Request',
            message: `Mentor ${user.name} (${user.email}) requested a password reset.`,
            link: '/admin/users'
          }
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'PASSWORD_RESET_REQUEST',
          resourceType: 'User',
          resourceId: user.id,
          details: {
            requesterId: user.id,
            name: user.name,
            email: user.email,
            department: user.mentorProfile?.department || '',
            role: 'MENTOR',
            status: 'PENDING',
            requestedAt: now
          }
        }
      });

      return res.status(200).json({
        success: true,
        role: 'MENTOR',
        message: 'Password reset request submitted to the administrator. The admin will review and reset your password.'
      });
    }

    if (user.role === 'TRAINER') {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN', accountStatus: 'ACTIVE' }
      });

      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'PASSWORD_RESET_REQUEST',
            title: 'Trainer Password Reset Request',
            message: `Corporate Trainer ${user.name} (${user.email}) requested a password reset.`,
            link: '/admin/users'
          }
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'PASSWORD_RESET_REQUEST',
          resourceType: 'User',
          resourceId: user.id,
          details: {
            requesterId: user.id,
            name: user.name,
            email: user.email,
            role: 'TRAINER',
            status: 'PENDING',
            requestedAt: now
          }
        }
      });

      return res.status(200).json({
        success: true,
        role: 'TRAINER',
        message: 'Password reset request submitted to the administrator. The admin will review and reset your password.'
      });
    }

    return res.status(200).json({
      success: true,
      role: 'ADMIN',
      message: 'Admin account detected. Please use your master credentials or contact server administrator.'
    });
  } catch (error) {
    next(error);
  }
};

export const getPasswordResetRequests = async (req, res, next) => {
  try {
    const actorId = req.user.id || req.user._id;
    const role = req.user.role;

    const requests = await prisma.auditLog.findMany({
      where: {
        action: 'PASSWORD_RESET_REQUEST'
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const pendingRequests = [];
    const seenUserIds = new Set();

    for (const r of requests) {
      const targetUserId = r.resourceId || r.details?.requesterId;
      if (!targetUserId || seenUserIds.has(targetUserId)) continue;
      seenUserIds.add(targetUserId);

      // Check if there was any resolution, reset, or password change on or after this request
      const resolutionLog = await prisma.auditLog.findFirst({
        where: {
          resourceId: targetUserId,
          action: {
            in: [
              'PASSWORD_RESET_RESOLVED',
              'ADMIN_PASSWORD_RESET',
              'CHANGE_PASSWORD',
              'PASSWORD_RESET_DISMISSED'
            ]
          },
          createdAt: { gte: r.createdAt }
        }
      });

      if (!resolutionLog) {
        pendingRequests.push({
          id: r.id,
          ...r.details,
          status: 'PENDING',
          createdAt: r.createdAt
        });
      }
    }

    let formatted = pendingRequests;

    if (role === 'MENTOR') {
      formatted = formatted.filter(
        (reqItem) => reqItem.role === 'MENTEE' && reqItem.assignedMentorId === actorId
      );
    }

    return res.status(200).json({
      success: true,
      requests: formatted
    });
  } catch (error) {
    next(error);
  }
};

export const mentorResetMenteePassword = async (req, res, next) => {
  try {
    const { menteeId, newPassword } = req.body;
    const mentorId = req.user.id || req.user._id;

    if (!menteeId || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid mentee ID and a new password (min 6 characters).'
      });
    }

    // Check that user is a mentee
    const mentee = await prisma.user.findFirst({
      where: { id: menteeId, role: 'MENTEE' }
    });

    if (!mentee) {
      return res.status(404).json({ success: false, message: 'Mentee not found.' });
    }

    // Check if mentor is assigned or admin
    if (req.user.role === 'MENTOR') {
      const assignment = await prisma.mentorMenteeAssignment.findFirst({
        where: { mentorId, menteeId, status: 'ACTIVE' }
      });
      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'You can only reset passwords for your assigned mentees.'
        });
      }
    }

    // Verify there is a password reset request or mentor permission
    const pendingRequest = await prisma.auditLog.findFirst({
      where: {
        action: 'PASSWORD_RESET_REQUEST',
        resourceId: menteeId
      },
      orderBy: { createdAt: 'desc' }
    });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: menteeId },
      data: {
        passwordHash,
        mustChangePassword: true
      }
    });

    if (pendingRequest) {
      await prisma.auditLog.create({
        data: {
          actorId: mentorId,
          action: 'PASSWORD_RESET_RESOLVED',
          resourceType: 'User',
          resourceId: menteeId,
          details: {
            resolvedBy: mentorId,
            resolvedByName: req.user.name,
            resolvedAt: new Date()
          }
        }
      });
    }

    await prisma.notification.create({
      data: {
        userId: menteeId,
        type: 'PASSWORD_RESET_RESOLVED',
        title: 'Password Reset by Mentor',
        message: `Your mentor ${req.user.name} has updated your password. Please log in with the new password.`
      }
    });

    return res.status(200).json({
      success: true,
      message: `Password for ${mentee.name} has been successfully reset to: ${newPassword}`
    });
  } catch (error) {
    next(error);
  }
};

export const adminResetPassword = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;
    const adminId = req.user.id || req.user._id;

    if (!userId || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user ID and a new password (min 6 characters).'
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Only Super Admin can reset an Administrator account password
    const isCallerSuperAdmin = req.user.role === 'ADMIN' && req.user.email?.toLowerCase() === 'admin@sru.edu.in';
    if (targetUser.role === 'ADMIN' && !isCallerSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the Super Administrator (admin@sru.edu.in) can reset passwords for administrator accounts.'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'ADMIN_PASSWORD_RESET',
        resourceType: 'User',
        resourceId: userId,
        details: {
          targetEmail: targetUser.email,
          targetRole: targetUser.role,
          resetAt: new Date()
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'PASSWORD_RESET_RESOLVED',
        resourceType: 'User',
        resourceId: userId,
        details: {
          resolvedBy: adminId,
          resolvedByName: req.user.name,
          resolvedAt: new Date(),
          method: 'ADMIN_RESET'
        }
      }
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'PASSWORD_RESET_RESOLVED',
        title: 'Password Reset by Administrator',
        message: 'An administrator has reset your password. Please log in and change your password.'
      }
    });

    return res.status(200).json({
      success: true,
      message: `Password for ${targetUser.name} (${targetUser.role}) has been reset successfully.`
    });
  } catch (error) {
    next(error);
  }
};

export const dismissPasswordResetRequest = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const actorId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'PASSWORD_RESET_DISMISSED',
        resourceType: 'User',
        resourceId: userId,
        details: {
          dismissedBy: actorId,
          dismissedByName: req.user.name,
          dismissedAt: new Date()
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset request dismissed.'
    });
  } catch (error) {
    next(error);
  }
};


