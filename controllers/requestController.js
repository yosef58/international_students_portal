import ServiceRequest from '../models/ServiceRequest.js';
import Service from '../models/Service.js';
import Notification from '../models/Notification.js';

import asyncwrapper from '../middlewares/asyncwrapper.js';
import AppError from '../utils/appError.js';
import httpstatustext from '../utils/httpstatustext.js';
import paginate from '../utils/pagination.js';

const priorityOrder = {  high: 1, medium: 2, low: 3 };

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
    priority: service.priority,
    requiredDocuments
  });
  
  await Notification.create({
    user: req.user.id,
    message: `Your ${request.priority} priority request for ${service.name} has been submitted successfully`
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
  const pagination = await paginate(ServiceRequest, req , filter);

  const requests = await ServiceRequest.find(filter)
  .populate("service","name category priority")
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

  const request = await ServiceRequest.findById(req.params.id)
  .populate("service", "name priority");

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
    message: `Your ${request.priority} priority request for ${request.service.name} has been ${status}${notes ? ` — ${notes}` : ''}`
  });

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: request
  });

});

// ==============================
// GET ALL REQUESTS (staff / admin)
// ==============================
const getAllRequests = asyncwrapper(async (req, res, next) => {
 
  const filter = {};
 
  // Optional filters via query params
  // ?status=Pending|Approved|Rejected|Cancelled
  if (req.query.status) {
    const allowed = ['Pending', 'Approved', 'Rejected', 'Cancelled'];
    if (!allowed.includes(req.query.status)) {
      return next(new AppError('Invalid status filter', 400, httpstatustext.FAIL));
    }
    filter.status = req.query.status;
  }
 
  // ?category=education|visa|housing|financial
  if (req.query.category) {
    const allowed = ['education', 'visa', 'housing', 'financial'];
    if (!allowed.includes(req.query.category)) {
      return next(new AppError('Invalid category filter', 400, httpstatustext.FAIL));
    }
    filter.category = req.query.category;
  }
 
  const pagination = await paginate(ServiceRequest, req, filter);
 
  const requests = await ServiceRequest.find(filter)
    .populate('student', 'name email avatar')
    .populate('service', 'name category')
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);
 
  res.status(200).json({
    status:     httpstatustext.SUCCESS,
    page:       pagination.page,
    results:    requests.length,
    totalPages: pagination.totalPages,
    data:       requests
  });
 
});

// ==============================
// GET SINGLE REQUEST
// ==============================
const getRequest = asyncwrapper(async (req, res, next) => {

  const request = await ServiceRequest.findById(req.params.id)
    .populate("service", "name category priority requiredDocuments")
    .populate("student", "name email avatar");

  if (!request) {
    return next(new AppError("Request not found", 404, httpstatustext.FAIL));
  }

  if (
    req.user.role === "student" &&
    request.student._id.toString() !== req.user.id
  ) {
    return next(new AppError("Unauthorized", 403, httpstatustext.FAIL));
  }

  // ✅ Separate uploaded and missing documents
  const uploadedDocs   = request.requiredDocuments.filter(doc => doc.isUploaded === true);
  const missingDocs    = request.requiredDocuments.filter(doc => doc.isUploaded === false);

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: {
      ...request.toObject(),
      documents: {
        uploaded: uploadedDocs,
        missing:  missingDocs,
        total:    request.requiredDocuments.length,
        uploadedCount: uploadedDocs.length,
        missingCount:  missingDocs.length
      }
    }
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

  await Notification.create({
    user: request.student,
    message: `Your ${request.priority} priority request has been cancelled successfully`
  });

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: request
  });

});


export  {
    submitRequest,
    getMyRequests,
    getAllRequests,
    getRequest,
    reviewRequest,
    cancelRequest
  };