import express from 'express';
import { Studentregister,Employeeregister, login } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { allowRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post('/register/student', Studentregister);
router.post('/register/employee', Employeeregister);
router.post('/login', login);

export default router;
