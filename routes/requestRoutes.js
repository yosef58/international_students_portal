import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { allowRoles } from '../middlewares/roleMiddleware.js';
import {
  submitRequest,
  getMyRequests,
  getAllRequests,
  reviewRequest,
  cancelRequest
} from '../controllers/requestController.js';
import { uploadDocument } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// تقديم طلب جديد
router.post(
  '/',
  protect,
  allowRoles('student'),
  uploadDocument.array('documents', 10),
  submitRequest
);

// عرض طلباتي
router.get('/my', protect, allowRoles('student'), getMyRequests);

// عرض كل الطلبات (staff / admin) — supports ?status= and ?category= filters
router.get('/all', protect, allowRoles('staff', 'admin'), getAllRequests);

// مراجعة طلب (staff)
router.put('/:id/review', protect, allowRoles('staff','admin'), reviewRequest);

// إلغاء طلب (student)
router.put('/:id/cancel', protect, allowRoles('student'), cancelRequest);


export default router;