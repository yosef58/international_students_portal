import express from 'express';
import 
{   createService,
    getServices,
    updateService,
    deleteService }
      from '../controllers/serviceController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { allowRoles } from '../middlewares/roleMiddleware.js';
import { uploadServiceImage } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  allowRoles('admin', 'staff'),
  uploadServiceImage.single('image'),
  createService
);

router.delete('/:id', protect, allowRoles('admin', 'staff'), deleteService);

router.patch(
  '/:id',
  protect, 
  allowRoles('admin', 'staff'), 
  uploadServiceImage.single('image'),
  updateService);

router.get('/', getServices);

export default router;

      