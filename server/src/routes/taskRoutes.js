import express from 'express';
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  assignTaskToRecipients,
  getTaskProgress
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/', authorizeRoles('ADMIN', 'MENTOR'), createTask);
router.get('/:id', getTaskById);
router.patch('/:id', authorizeRoles('ADMIN', 'MENTOR'), updateTask);
router.delete('/:id', authorizeRoles('ADMIN', 'MENTOR'), deleteTask);
router.post('/:id/assign', authorizeRoles('ADMIN', 'MENTOR'), assignTaskToRecipients);
router.get('/:id/progress', authorizeRoles('ADMIN', 'MENTOR'), getTaskProgress);

export default router;
