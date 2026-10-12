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
  getAdminProfile,
  updateAdminProfile
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Mentees routes
router.get('/mentees', authorizeRoles('ADMIN', 'MENTOR'), getMentees);
router.post('/mentees', authorizeRoles('ADMIN', 'MENTOR'), createMentee);
router.get('/mentees/:id', getMenteeById);
router.patch('/mentees/:id', updateMentee);
router.post('/mentees/:id/mentors', authorizeRoles('ADMIN'), assignMentorToMentee);

// Mentors routes
router.get('/mentors', authorizeRoles('ADMIN', 'MENTOR'), getMentors);
router.post('/mentors', authorizeRoles('ADMIN'), createMentor);
router.get('/mentors/:id', authorizeRoles('ADMIN', 'MENTOR'), getMentorById);
router.patch('/mentors/:id', authorizeRoles('ADMIN', 'MENTOR'), updateMentor);

// Admin Profile routes
router.get('/admin/profile', authorizeRoles('ADMIN'), getAdminProfile);
router.patch('/admin/profile', authorizeRoles('ADMIN'), updateAdminProfile);

export default router;
