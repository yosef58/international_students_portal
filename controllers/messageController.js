import Message from '../models/Message.js';
import User from '../models/User.js';
import asyncwrapper from '../middlewares/asyncwrapper.js';
import AppError from '../utils/appError.js';
import httpstatustext from '../utils/httpstatustext.js';
import paginate from '../utils/pagination.js';


// ==============================
// SEND MESSAGE (student → staff)
// ==============================
const sendMessage = asyncwrapper(async (req, res, next) => {

  const { message } = req.body;

  if (!message) {
    return next(new AppError("Message is required", 400, httpstatustext.FAIL));
  }

  // ✅ Pick any available staff member to receive the message
  const staff = await User.findOne({ role: "staff" });

  if (!staff) {
    return next(new AppError("No staff available", 404, httpstatustext.FAIL));
  }

  const newMessage = await Message.create({
    sender: req.user.id,
    receiver: staff._id,
    message
  });

  res.status(201).json({
    status: httpstatustext.SUCCESS,
    data: newMessage
  });

});


// ==============================
// REPLY TO MESSAGE (staff → student)
// ==============================
const replyMessage = asyncwrapper(async (req, res, next) => {

  const { message, studentId } = req.body;

  if (!message || !studentId) {
    return next(new AppError("Message and studentId are required", 400, httpstatustext.FAIL));
  }

  const student = await User.findById(studentId);

  if (!student || student.role !== "student") {
    return next(new AppError("Student not found", 404, httpstatustext.FAIL));
  }

  const newMessage = await Message.create({
    sender: req.user.id,
    receiver: studentId,
    message
  });

  res.status(201).json({
    status: httpstatustext.SUCCESS,
    data: newMessage
  });

});


// ==============================
// GET MY MESSAGES (student sees his conversation)
// ==============================
const getMyMessages = asyncwrapper(async (req, res, next) => {

  const filter = {
    $or: [
      { sender: req.user.id },
      { receiver: req.user.id }
    ]
  };

  const pagination = await paginate(Message, req, filter);

  
  const messages = await Message.find(filter)
    .populate("sender", "name role avatar")
    .populate("receiver", "name role avatar")
    .sort({ createdAt: 1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    page: pagination.page,
    results: messages.length,
    totalPages: pagination.totalPages,
    data: messages
  });

});

// ==============================
// GET ALL MESSAGES (staff sees all students messages)
// ==============================
const getAllMessages = asyncwrapper(async (req, res, next) => {

    const filter = { $or: [{ sender: req.user.id }, { receiver: req.user.id }] };    
    const pagination = await paginate(Message, req, filter);

    const messages = await Message.find(filter)
    .populate("sender", "name role avatar")
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

 
    res.status(200).json({
        status: httpstatustext.SUCCESS,
        page: pagination.page,
        results: messages.length,
        totalPages: pagination.totalPages,
        data: messages
    });
});


export {
  sendMessage,
  replyMessage,
  getMyMessages,
  getAllMessages
};