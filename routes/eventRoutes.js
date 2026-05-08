import express from 'express' ;
import { protect } from '../middlewares/authMiddleware.js';
import { allowRoles } from '../middlewares/roleMiddleware.js';
import { uploadEventImage } from '../middlewares/uploadMiddleware.js';
import { createEvent, getEvents,getEvent,updateEvent, deleteEvent} from '../controllers/eventController.js';

const router = express.Router();

router.post(
  '/',
  protect,
  allowRoles('admin', 'staff'),
  uploadEventImage.single('image'),  // ✅
  createEvent
);

router.patch(
  '/:id',
  protect,
  allowRoles('admin', 'staff'),
  uploadEventImage.single('image'),  // ✅
  updateEvent
);

router.delete('/:id', protect, allowRoles('admin', 'staff'), deleteEvent);
router.get('/:id', protect, getEvent);
router.get('/', getEvents);

export default router;


  