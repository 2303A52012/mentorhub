import express from 'express';
import {
  getMentees,
  createMentee,
  getMenteeById,
  updateMentee,
  getMentors,
  createMentor,
  getMentorById,
  updateMentor,
  assignMentorToMentee,
  reallocateMentor,
  getAdminProfile,
  updateAdminProfile,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles, requireSuperAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Super Admin Exclusive Administrator Management Routes
router.get('/admins', requireSuperAdmin, getAdmins);
router.post('/admins', requireSuperAdmin, createAdmin);
router.patch('/admins/:id', requireSuperAdmin, updateAdmin);
router.delete('/admins/:id', requireSuperAdmin, deleteAdmin);

// Administrator Management Aliases (/users/admins)
router.get('/users/admins', requireSuperAdmin, getAdmins);
router.post('/users/admins', requireSuperAdmin, createAdmin);
router.patch('/users/admins/:id', requireSuperAdmin, updateAdmin);
router.delete('/users/admins/:id', requireSuperAdmin, deleteAdmin);

// Mentor Reallocation Routes (Accessible by Admin and Super Admin)
router.post('/reallocate-mentor', authorizeRoles('ADMIN'), reallocateMentor);
router.post('/users/reallocate-mentor', authorizeRoles('ADMIN'), reallocateMentor);

// Mentees routes
router.get('/mentees', authorizeRoles('ADMIN', 'MENTOR'), getMentees);
router.post('/mentees', authorizeRoles('ADMIN', 'MENTOR'), createMentee);
router.get('/mentees/:id', getMenteeById);
router.patch('/mentees/:id', updateMentee);
router.post('/mentees/:id/mentors', authorizeRoles('ADMIN'), assignMentorToMentee);
router.post('/users/mentees/:id/mentors', authorizeRoles('ADMIN'), assignMentorToMentee);

// Mentors routes
router.get('/mentors', authorizeRoles('ADMIN', 'MENTOR'), getMentors);
router.post('/mentors', authorizeRoles('ADMIN'), createMentor);
router.get('/mentors/:id', authorizeRoles('ADMIN', 'MENTOR'), getMentorById);
router.patch('/mentors/:id', authorizeRoles('ADMIN', 'MENTOR'), updateMentor);

// Admin Profile routes
router.get('/admin/profile', authorizeRoles('ADMIN'), getAdminProfile);
router.patch('/admin/profile', authorizeRoles('ADMIN'), updateAdminProfile);

export default router;
