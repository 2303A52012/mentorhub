import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import prisma from '../config/prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please log in again.'
      });
    }

    if (user.accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.accountStatus.toLowerCase()}. Contact platform admin.`
      });
    }

    // Ensure backwards compatibility with _id and attach isSuperAdmin
    user._id = user.id;
    user.isSuperAdmin = user.role === 'ADMIN' && user.email?.toLowerCase() === 'admin@sru.edu.in';
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of: ${roles.join(', ')}.`
    });
  }
  next();
};
