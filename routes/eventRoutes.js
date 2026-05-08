import express from 'express' ;
import { protect } from '../middlewares/authMiddleware.js';
import { allowRoles } from '../middlewares/roleMiddleware.js';
import { uploadEventImage } from '../middlewares/uploadMiddleware.js';
import { createEvent, getEvents,getEvent,updateEvent, deleteEvent, reserveEvent, cancelReservation, getEventReservations} from '../controllers/eventController.js';

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
router.post('/:id/reserve',protect, allowRoles('student'),reserveEvent);
router.delete('/:id/reserve',protect, allowRoles('student'),cancelReservation);
router.get('/:id/reservations',protect, allowRoles('admin', 'staff'), getEventReservations);
router.delete('/:id', protect, allowRoles('admin', 'staff'), deleteEvent);
router.get('/:id', protect, getEvent);
router.get('/', getEvents);

export default router;


  