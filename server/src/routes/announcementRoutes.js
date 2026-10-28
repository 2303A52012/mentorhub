import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authMiddleware.js';
import {
  getAnnouncements,
  createAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead
} from '../controllers/announcementController.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'MENTOR', 'MENTEE'));

router.get('/',        getAnnouncements);
router.post('/',       authorize('ADMIN', 'MENTOR'), createAnnouncement);
router.get('/:id',     getAnnouncementById);
router.patch('/:id',   authorize('ADMIN', 'MENTOR'), updateAnnouncement);
router.delete('/:id',  authorize('ADMIN', 'MENTOR'), deleteAnnouncement);
router.post('/:id/read', markAnnouncementRead);

export default router;
