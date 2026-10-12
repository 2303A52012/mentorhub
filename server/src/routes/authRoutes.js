import express from 'express';
import {
  login,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  getPasswordResetRequests,
  mentorResetMenteePassword,
  adminResetPassword,
  dismissPasswordResetRequest
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.post('/forgot-password', forgotPassword);

// Password Reset Delegation & Management
router.get('/reset-requests', authenticate, authorizeRoles('ADMIN', 'MENTOR'), getPasswordResetRequests);
router.post('/reset-requests/dismiss', authenticate, authorizeRoles('ADMIN', 'MENTOR'), dismissPasswordResetRequest);
router.post('/mentor-reset-mentee-password', authenticate, authorizeRoles('ADMIN', 'MENTOR'), mentorResetMenteePassword);
router.post('/admin-reset-password', authenticate, authorizeRoles('ADMIN'), adminResetPassword);

export default router;

