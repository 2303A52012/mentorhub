import express from 'express';
import {
  getAdminDashboard,
  getMentorDashboard,
  getMenteeDashboard
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/admin/dashboard', authorizeRoles('ADMIN'), getAdminDashboard);
router.get('/mentor/dashboard', authorizeRoles('ADMIN', 'MENTOR'), getMentorDashboard);
router.get('/mentee/dashboard', authorizeRoles('MENTEE'), getMenteeDashboard);

export default router;
