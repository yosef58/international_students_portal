import Notification  from '../models/Notification.js';

import asyncwrapper  from '../middlewares/asyncwrapper.js';
import AppError  from '../utils/appError.js';
import httpstatustext  from '../utils/httpstatustext.js';
import paginate  from '../utils/pagination.js';


// ==============================
// GET MY NOTIFICATIONS
// ==============================
const getMyNotifications = asyncwrapper(async (req, res, next) => {

  const filter = { user: req.user.id };
  const pagination = await paginate(Notification, req);

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    page: pagination.page,
    results: notifications.length,
    totalPages: pagination.totalPages,
    data: notifications
  });

});


// ==============================
// MARK NOTIFICATION AS READ
// ==============================
const markAsRead = asyncwrapper(async (req, res, next) => {

  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new AppError("Notification not found", 404, httpstatustext.FAIL)
    );
  }

  if (notification.user.toString() !== req.user.id) {
    return next(
      new AppError("Unauthorized", 403, httpstatustext.FAIL)
    );
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: notification
  });

});

export  {
    markAsRead,
    getMyNotifications
};