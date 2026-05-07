import Event  from '../models/Event.js';
import User  from '../models/User.js';
import { createBulkNotifications } from '../utils/createNotification.js';

import asyncwrapper  from '../middlewares/asyncwrapper.js';
import AppError  from '../utils/appError.js';
import httpstatustext  from '../utils/httpstatustext.js';
import paginate  from '../utils/pagination.js';


// ==============================
// CREATE EVENT
// ==============================
const createEvent = asyncwrapper(async (req, res, next) => {
  
  const { title, description, date, location } = req.body;
  const event = await Event.create({ title, 
    description, 
    date, 
    location, 
    image: req.file ? req.file.path : null,
    createdBy: req.user.id });
  
    res.status(201).json({
      status: httpstatustext.SUCCESS,
      data: event
    });

  // إرسال إشعار لكل الطلاب
  const students = await User.find({ role: "student" }, "_id");
  await createBulkNotifications({
    userIds: students.map(s => s._id),
    message: `New event created: ${event.title}`
  });
});


// ==============================
// GET ALL EVENTS
// ==============================
const getEvents = asyncwrapper(async (req, res, next) => {

  const pagination = await paginate(Event, req);

  const events = await Event.find()
    .sort({ date: 1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    page: pagination.page,
    results: events.length,
    totalPages: pagination.totalPages,
    data: events
  });

});

// ==============================
// GET SINGLE EVENT
// ==============================
const getEvent = asyncwrapper(async (req, res, next) => {

  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(
      new AppError("Event not found", 404, httpstatustext.FAIL)
    );
  }

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: event
  });

});

// ==============================
// UPDATE EVENT
// ==============================
const updateEvent = asyncwrapper(async (req, res, next) => {

  const { title, description, date, location } = req.body;

  const updateData = { title, description, date, location };

  if (req.file) {
    updateData.image = req.file.path;
  }

  const event = await Event.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!event) {
    return next(new AppError("Event not found", 404, httpstatustext.FAIL));
  }

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    message: "Event updated successfully",
    data: event
  });

});

// ==============================
// DELETE EVENT
// ==============================
const deleteEvent = asyncwrapper(async (req, res, next) => {

  const event = await Event.findByIdAndDelete(req.params.id);

  if (!event) {
    return next(
      new AppError("Event not found", 404, httpstatustext.FAIL)
    );
  }

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    message: "Event deleted successfully"
  });

});

export  {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent
};