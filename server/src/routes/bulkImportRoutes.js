import express from 'express';
import multer from 'multer';
import {
  previewImport,
  confirmImport,
  getImportHistory,
  getImportHistoryById,
  exportImportErrors,
  downloadTemplate
} from '../controllers/bulkImportController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Configure multer in-memory upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.originalname.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only .xlsx, .xls, and .csv files are supported.'), false);
    }
  }
});

// All bulk-import routes are STRICTLY ADMIN-ONLY
router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/template', downloadTemplate);
router.post('/preview', upload.single('file'), previewImport);
router.post('/confirm', confirmImport);
router.get('/history', getImportHistory);
router.get('/history/:id', getImportHistoryById);
router.get('/history/:id/export-errors', exportImportErrors);

export default router;
