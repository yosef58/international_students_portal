import express from 'express';
import 
{   createService,
    getServices,
    updateService,
    deleteService }
      from '../controllers/serviceController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { allowRoles } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  allowRoles('admin', 'staff'),
  upload.single('image'),
  createService
);

router.delete('/:id', protect, allowRoles('admin', 'staff'), deleteService);

router.patch('/:id', protect, allowRoles('admin', 'staff'), updateService);

router.get('/', protect, getServices);

export default router;

      