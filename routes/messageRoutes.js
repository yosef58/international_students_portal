// import express from 'express';
// import { protect } from '../middlewares/authMiddleware.js';
// import { allowRoles } from '../middlewares/roleMiddleware.js';
// import {
//   sendMessage,
//   replyMessage,
//   getMyMessages,
//   getAllMessages
// } from '../controllers/messageController.js';

// const router = express.Router();

// router.post('/',protect, allowRoles('student'),       sendMessage);
// router.post('/reply',protect, allowRoles('staff', 'admin'), replyMessage);
// router.get('/my',protect, allowRoles('student'),       getMyMessages);
// router.get('/all',protect, allowRoles('staff', 'admin'), getAllMessages);

// export default router;