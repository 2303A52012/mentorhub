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

router.get('/',        getAnnouncements);
router.post('/',       authorize('ADMIN','TRAINER','MENTOR'), createAnnouncement);
router.get('/:id',     getAnnouncementById);
router.patch('/:id',   authorize('ADMIN','TRAINER','MENTOR'), updateAnnouncement);
router.delete('/:id',  authorize('ADMIN','TRAINER','MENTOR'), deleteAnnouncement);
router.post('/:id/read', markAnnouncementRead);

export default router;
