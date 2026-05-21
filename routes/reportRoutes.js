import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { allowRoles } from '../middlewares/roleMiddleware.js';
import {
  requestsByStatus,
  requestsPerService,
  requestsPerStudent,
  dashboardSummary,
  totalRevenue
} from '../controllers/reportController.js';

const router = express.Router();

// التقارير متاحة Admin فقط
router.get('/status', protect, allowRoles('admin'), requestsByStatus);
router.get('/services', protect, allowRoles('admin'), requestsPerService);
router.get('/students', protect, allowRoles('admin'), requestsPerStudent);
router.get('/summary', protect, allowRoles('admin'), dashboardSummary);
router.get('/revenue',  protect, allowRoles('admin'), totalRevenue);

export default router;
