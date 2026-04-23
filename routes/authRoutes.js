import express from 'express';
import { Studentregister,Employeeregister, login, logout} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { allowRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post('/register/student', protect, allowRoles('admin','staff'), Studentregister);
router.post('/register/employee', protect, allowRoles('admin'),Employeeregister);
router.post('/login', login);
router.post('/logout',protect, logout);

export default router;
