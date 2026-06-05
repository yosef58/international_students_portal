import Message from '../models/Message.js';
import User from '../models/User.js';
import asyncwrapper from '../middlewares/asyncwrapper.js';
import AppError from '../utils/appError.js';
import httpstatustext from '../utils/httpstatustext.js';
import paginate from '../utils/pagination.js';



// ==============================
// SEND MESSAGE (student → least-busy staff)
// ==============================
const sendMessage = asyncwrapper(async (req, res, next) => {
 
  const { message } = req.body;
 
  if (!message) {
    return next(new AppError('Message is required', 400, httpstatustext.FAIL));
  }
 
  // Get all staff members
  const allStaff = await User.find({ role: 'staff' }).select('_id');
 
  if (!allStaff.length) {
    return next(new AppError('No staff available', 404, httpstatustext.FAIL));
  }

  const staffIds = allStaff.map(s => s._id);

  // ✅ Single aggregate: count distinct active student senders per staff member
  // Two-stage group: first get unique (receiver, sender) pairs, then count per receiver
  const loads = await Message.aggregate([
    { $match: { receiver: { $in: staffIds } } },
    { $group: { _id: { receiver: "$receiver", sender: "$sender" } } },
    { $group: { _id: "$_id.receiver", activeConversations: { $sum: 1 } } }
  ]);

  // Build lookup map — staff with no messages won't appear in aggregate results
  const loadMap = {};
  loads.forEach(l => { loadMap[l._id.toString()] = l.activeConversations; });

  // ✅ Pick staff member with fewest active conversations (default 0 if absent)
  const assigned = staffIds.reduce((min, staffId) => {
    const count    = loadMap[staffId.toString()] || 0;
    const minCount = loadMap[min.toString()]      || 0;
    return count < minCount ? staffId : min;
  });

  const newMessage = await Message.create({
    sender:   req.user.id,
    receiver: assigned,
    message
  });
 
  res.status(201).json({
    status: httpstatustext.SUCCESS,
    data:   newMessage
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

  // ✅ Step 1: count unread from in-memory snapshot BEFORE marking read
  const conversations = {};

  messages.forEach(msg => {
    const otherPerson =
      msg.sender._id.toString() === req.user.id
        ? msg.receiver
        : msg.sender;

    const key = otherPerson._id.toString();

    if (!conversations[key]) {
      conversations[key] = {
        with: otherPerson,
        messages: [],
        unreadCount: 0
      };
    }

    conversations[key].messages.push(msg);

    // ✅ isRead reflects DB state at fetch time — reliable, no race condition
    if (!msg.isRead && msg.receiver._id.toString() === req.user.id) {
      conversations[key].unreadCount++;
    }
  });

  // ✅ Step 2: mark as read AFTER counting
  await Message.updateMany(
    { receiver: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    page: pagination.page,
    results: Object.keys(conversations).length,
    totalPages: pagination.totalPages,
    data: Object.values(conversations)
  });

});


// ==============================
// GET ALL MESSAGES (staff sees all students messages)
// ==============================
const getAllMessages = asyncwrapper(async (req, res, next) => {
 
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

  // ✅ Step 1: count unread from in-memory snapshot BEFORE marking read
  const conversations = {};

  messages.forEach(msg => {
    const otherPerson =
      msg.sender._id.toString() === req.user.id
        ? msg.receiver   // staff sent → other is receiver
        : msg.sender;    // staff received → other is sender

    const key = otherPerson._id.toString();

    if (!conversations[key]) {
      conversations[key] = {
        with: otherPerson,
        messages: [],
        unreadCount: 0
      };
    }

    conversations[key].messages.push(msg);

    // ✅ isRead reflects DB state at fetch time — reliable, no race condition
    if (!msg.isRead && msg.receiver._id.toString() === req.user.id) {
      conversations[key].unreadCount++;
    }
  });

  // ✅ Step 2: mark as read AFTER counting
  await Message.updateMany(
    { receiver: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    page: pagination.page,
    results: Object.keys(conversations).length,
    totalPages: pagination.totalPages,
    data: Object.values(conversations)
  });

});


export {
  sendMessage,
  replyMessage,
  getMyMessages,
  getAllMessages
};