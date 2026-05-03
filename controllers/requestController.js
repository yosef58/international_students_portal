import ServiceRequest from '../models/ServiceRequest.js';
import Service from '../models/Service.js';
import Notification from '../models/Notification.js';

import asyncwrapper from '../middlewares/asyncwrapper.js';
import AppError from '../utils/appError.js';
import httpstatustext from '../utils/httpstatustext.js';
import paginate from '../utils/pagination.js';


// ==============================
// SUBMIT REQUEST
// ==============================
const submitRequest = asyncwrapper(async (req, res, next) => {

  const { serviceId } = req.body;

  const service = await Service.findById(serviceId);
  if (!service) {
    return next(new AppError("Service not found", 404, httpstatustext.FAIL));
  }

  const existingRequest = await ServiceRequest.findOne({
    student: req.user.id,
    service: serviceId
  });

  if (existingRequest) {
    return next(new AppError("Request already submitted", 400, httpstatustext.FAIL));
  }

  // ✅ Build requiredDocuments from service
  const requiredDocuments = service.requiredDocuments.map(docName => ({
    name: docName,
    isUploaded: false,
    file: { filename: null, path: null }
  }));

  // ✅ Match uploaded files to required documents by index or name
  if (req.files && req.files.length > 0) {
    req.files.forEach((file, index) => {
      if (requiredDocuments[index]) {
        requiredDocuments[index].isUploaded = true;
        requiredDocuments[index].file = {
          filename: file.originalname,
          path: file.path  // Cloudinary URL
        };
      }
    });
  }

  const request = await ServiceRequest.create({
    student: req.user.id,
    service: serviceId,
    category: service.category,
    requiredDocuments
  });

  res.status(201).json({
    status: httpstatustext.SUCCESS,
    data: request
  });

});

// ==============================
// GET MY REQUESTS
// ==============================
const getMyRequests = asyncwrapper(async (req, res, next) => {

  const filter = { student: req.user.id };
  const pagination = await paginate(ServiceRequest,req);

  const requests = await ServiceRequest.find(filter)
  .populate("service","name")
  .skip(pagination.skip)
  .limit(pagination.limit);

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    page: pagination.page,
    results: requests.length,
    totalPages: pagination.totalPages,
    data: requests
  });

});


// ==============================
// REVIEW REQUEST (STAFF)
// ==============================
const reviewRequest = asyncwrapper(async (req, res, next) => {

  const { status, notes } = req.body;

  if (!["Approved","Rejected"].includes(status)) {
    return next(new AppError("Invalid status",400,httpstatustext.FAIL));
  }

  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    return next(new AppError("Request not found",404,httpstatustext.FAIL));
  }

  if (request.status !== "Pending") {
    return next(new AppError("Request already reviewed",400,httpstatustext.FAIL));
  }

  request.status = status;
  request.reviewNotes = notes;

  await request.save();

  await Notification.create({
    user: request.student,
    message: `Your request has been ${status}`
  });

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: request
  });

});


// ==============================
// CANCEL REQUEST
// ==============================
const cancelRequest = asyncwrapper(async (req, res, next) => {

  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    return next(new AppError("Request not found",404,httpstatustext.FAIL));
  }

  if (request.student.toString() !== req.user.id) {
    return next(new AppError("Unauthorized",403,httpstatustext.FAIL));
  }

  if (request.status !== "Pending") {
    return next(new AppError("Cannot cancel this request",400,httpstatustext.FAIL));
  }

  request.status = "Cancelled";

  await request.save();

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: request
  });

});


export  {
    submitRequest,
    getMyRequests,
    reviewRequest,
    cancelRequest
  };