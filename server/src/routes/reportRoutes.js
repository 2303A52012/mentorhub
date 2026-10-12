import express from 'express';
import { getTaskReports, getMenteeReports, getMockReports } from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('ADMIN', 'MENTOR'));

router.get('/tasks', getTaskReports);
router.get('/mentees', getMenteeReports);
router.get('/mocks', getMockReports);

export default router;
