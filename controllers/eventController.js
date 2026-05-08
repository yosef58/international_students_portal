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
  
  const { title, description, date, location,capacity } = req.body;
  if (!capacity || capacity < 1) {
    return next(new AppError("Capacity must be at least 1", 400, httpstatustext.FAIL));
  }
  const event = await Event.create({ title, 
    description, 
    date, 
    location,
    capacity,
    image: req.file ? req.file.path : null,
    createdBy: req.user.id });
  
    res.status(201).json({
      status: httpstatustext.SUCCESS,
      data: event
    });

  // إرسال إشعار لكل الطلاب
  const students = await User.find({ role: "student" }, "_id");
  if (students.length > 0) {
      await createBulkNotifications({
        userIds: students.map(s => s._id),
        message: `New event created: ${event.title}`
      });
}});


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
    data: {
      ...event.toObject(),
      availableSeats: event.capacity - event.reservedCount,
      isFull: event.reservedCount >= event.capacity
    }
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

// ==============================
// RESERVE EVENT (STUDENT)
// ==============================
const reserveEvent = asyncwrapper(async (req, res, next) => {

  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError("Event not found", 404, httpstatustext.FAIL));
  }

  // ✅ Check if already reserved
  const alreadyReserved = event.reservations.some(
    r => r.student.toString() === req.user.id
  );

  if (alreadyReserved) {
    return next(new AppError("You already reserved this event", 400, httpstatustext.FAIL));
  }

  // ✅ Check if event is full
  if (event.reservedCount >= event.capacity) {
    return next(new AppError("Event is fully booked", 400, httpstatustext.FAIL));
  }

  // ✅ Add reservation
  event.reservations.push({ student: req.user.id });
  event.reservedCount += 1;
  await event.save();

  // ✅ Notify student
  await createNotification({
    userId: req.user.id,
    message: `Your reservation for "${event.title}" is confirmed`
  });

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    message: "Reservation confirmed",
    data: {
      eventTitle:     event.title,
      date:           event.date,
      location:       event.location,
      availableSeats: event.capacity - event.reservedCount
    }
  });

});

// ==============================
// CANCEL RESERVATION (STUDENT)
// ==============================
const cancelReservation = asyncwrapper(async (req, res, next) => {

  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError("Event not found", 404, httpstatustext.FAIL));
  }

  // ✅ Check if reserved
  const reservationIndex = event.reservations.findIndex(
    r => r.student.toString() === req.user.id
  );

  if (reservationIndex === -1) {
    return next(new AppError("You have not reserved this event", 400, httpstatustext.FAIL));
  }

  // ✅ Remove reservation
  event.reservations.splice(reservationIndex, 1);
  event.reservedCount -= 1;
  await event.save();

  // ✅ Notify student
  await createNotification({
    userId: req.user.id,
    message: `Your reservation for "${event.title}" has been cancelled`
  });

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    message: "Reservation cancelled",
    data: {
      eventTitle:     event.title,
      availableSeats: event.capacity - event.reservedCount
    }
  });

});

// ==============================
// GET EVENT RESERVATIONS (STAFF/ADMIN)
// ==============================
const getEventReservations = asyncwrapper(async (req, res, next) => {

  const event = await Event.findById(req.params.id)
    .populate("reservations.student", "name email avatar");

  if (!event) {
    return next(new AppError("Event not found", 404, httpstatustext.FAIL));
  }

  res.status(200).json({
    status:         httpstatustext.SUCCESS,
    eventTitle:     event.title,
    capacity:       event.capacity,
    reservedCount:  event.reservedCount,
    availableSeats: event.capacity - event.reservedCount,
    data:           event.reservations
  });

});

export  {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  reserveEvent,
  cancelReservation,
  getEventReservations
};