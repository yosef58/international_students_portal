import express from 'express';
import { Studentregister,Employeeregister, login, logout} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { allowRoles } from '../middlewares/roleMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per window
  message: {
    status: 'fail',
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,     // sends RateLimit headers in the response
  legacyHeaders: false
});
router.post('/register/student', protect, allowRoles('admin','staff'), Studentregister);
router.post('/register/employee', protect, allowRoles('admin'),Employeeregister);
router.post('/login',loginLimiter, login);
router.post('/logout',protect, logout);

export default router;
