import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { allowRoles } from '../middlewares/roleMiddleware.js';
import {
  submitRequest,
  getMyRequests,
  reviewRequest,
  cancelRequest,
  uploadDocuments
} from '../controllers/requestController.js';
import { uploadDocument } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// تقديم طلب جديد
router.post('/', protect, allowRoles('student'), submitRequest);

// عرض طلباتي
router.get('/my', protect, allowRoles('student'), getMyRequests);

// مراجعة طلب (staff)
router.put('/:id/review', protect, allowRoles('staff','admin'), reviewRequest);

// إلغاء طلب (student)
router.put('/:id/cancel', protect, allowRoles('student'), cancelRequest);

router.post(
  '/:id/upload',
  protect,
  allowRoles('student'),
  uploadDocument.array('document',3),
  uploadDocuments
);

export default router;