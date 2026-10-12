import express from 'express';
import {
  getMockSections,
  createMockSection,
  getMockSectionById,
  updateMockSection,
  assignSlot,
  updateSlot,
  cancelSlot,
  markSlotMissed,
  publishSection,
  recordEvaluation,
  getMenteeMocks,
  getMenteeMockHistory,
  getMentorAvailability
} from '../controllers/mockController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply auth to all mock routes
router.use(authenticate);

// ==========================================
// MENTOR & ADMIN ENDPOINTS
// ==========================================
router.get(
  '/mentor/mocks',
  authorizeRoles('MENTOR', 'ADMIN'),
  getMockSections
);

router.post(
  '/mentor/mocks',
  authorizeRoles('MENTOR', 'ADMIN'),
  createMockSection
);

router.get(
  '/mentor/mocks/availability',
  authorizeRoles('MENTOR', 'ADMIN'),
  getMentorAvailability
);

router.get(
  '/mentor/mocks/:id',
  authorizeRoles('MENTOR', 'ADMIN'),
  getMockSectionById
);

router.put(
  '/mentor/mocks/:id',
  authorizeRoles('MENTOR', 'ADMIN'),
  updateMockSection
);

router.post(
  '/mentor/mocks/:id/slots',
  authorizeRoles('MENTOR', 'ADMIN'),
  assignSlot
);

router.put(
  '/mentor/mocks/slots/:slotId',
  authorizeRoles('MENTOR', 'ADMIN'),
  updateSlot
);

router.delete(
  '/mentor/mocks/slots/:slotId',
  authorizeRoles('MENTOR', 'ADMIN'),
  cancelSlot
);

router.post(
  '/mentor/mocks/slots/:slotId/missed',
  authorizeRoles('MENTOR', 'ADMIN'),
  markSlotMissed
);

router.post(
  '/mentor/mocks/:id/publish',
  authorizeRoles('MENTOR', 'ADMIN'),
  publishSection
);

router.post(
  '/mentor/mocks/slots/:slotId/evaluate',
  authorizeRoles('MENTOR', 'ADMIN'),
  recordEvaluation
);

router.get(
  '/mentor/mentees/:menteeId/mock-history',
  authorizeRoles('MENTOR', 'ADMIN'),
  getMenteeMockHistory
);

// ==========================================
// MENTEE ENDPOINTS
// ==========================================
router.get(
  '/mentee/mocks',
  authorizeRoles('MENTEE'),
  getMenteeMocks
);

export default router;
