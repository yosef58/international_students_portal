import express from 'express';
import { Studentregister,Employeeregister, login, logout , getAllUsers , deleteUser, activestaff} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { allowRoles } from '../middlewares/roleMiddleware.js';
import rateLimit from 'express-rate-limit';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';

const router = express.Router();


router.post('/register/student', protect, allowRoles('admin'), uploadAvatar.single('avatar'),Studentregister);
router.post('/register/employee', protect, allowRoles('admin'),uploadAvatar.single('avatar'),Employeeregister);
router.post('/login', login);
router.post('/logout',protect, logout);
router.get('/users', protect, allowRoles('admin'), getAllUsers);
router.delete('/users/:id', protect, allowRoles('admin'), deleteUser);
router.get('/staff/online', protect, allowRoles('admin'), activestaff)
export default router;
