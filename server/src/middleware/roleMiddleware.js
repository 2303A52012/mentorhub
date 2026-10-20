import prisma from '../config/prisma.js';

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role ${req.user?.role || 'Guest'} is not permitted to access this resource.`
      });
    }
    next();
  };
};

export const isSuperAdmin = (user) => {
  return (
    user &&
    user.role === 'ADMIN' &&
    user.email?.toLowerCase() === 'admin@sru.edu.in'
  );
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || !isSuperAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Super Administrator privileges required (admin@sru.edu.in).'
    });
  }
  next();
};

export const checkMentorMenteeAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const menteeId = req.params.id || req.params.menteeId || req.body.menteeId;
    if (!menteeId) {
      return next();
    }

    const userId = req.user.id || req.user._id;

    if (req.user.role === 'MENTEE') {
      if (userId?.toString() !== menteeId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only access your own mentee data.'
        });
      }
      return next();
    }

    if (req.user.role === 'MENTOR') {
      const assignment = await prisma.mentorMenteeAssignment.findFirst({
        where: {
          mentorId: userId,
          menteeId: menteeId,
          status: 'ACTIVE'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not assigned as mentor for this mentee.'
        });
      }
      return next();
    }

    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (error) {
    return next(error);
  }
};
