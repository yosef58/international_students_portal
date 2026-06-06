import ServiceRequest from '../models/ServiceRequest.js';
import Service from '../models/Service.js';
import asyncwrapper from '../middlewares/asyncwrapper.js';

import { createNotification, createBulkNotifications } from '../utils/createNotification.js';
import getLeastBusyStaff from '../utils/getLeastBusyStaff.js';
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

  //  Build requiredDocuments from service
  const requiredDocuments = service.requiredDocuments.map(docName => ({
    name: docName,
    isUploaded: false,
    file: { filename: null, path: null }
  }));

  //  Match uploaded files to required documents by index
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
  
  const assignedStaff = await getLeastBusyStaff();

  if (!assignedStaff) {
    return next(new AppError("No staff available", 404, httpstatustext.FAIL));
  }

  const expireDays = service.expireDays || 7;
  const expiresAt  = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);

  const request = await ServiceRequest.create({
    student: req.user.id,
    service: serviceId,
    category: service.category,
    priority: service.priority,
    assignedTo: assignedStaff,
    requiredDocuments,
    expiresAt
  });
  
  await createNotification({
    userId: req.user.id,
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
  const pagination = await paginate(ServiceRequest, req, filter);

  const requests = await ServiceRequest.find(filter)
    .populate("service", "name category priority expireDays")
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

  if (!["Approved", "Rejected"].includes(status)) {
    return next(new AppError("Invalid status", 400, httpstatustext.FAIL));
  }

  const request = await ServiceRequest.findById(req.params.id)
    .populate("service", "name priority");

  if (!request) {
    return next(new AppError("Request not found", 404, httpstatustext.FAIL));
  }

  if (request.status !== "Pending") {
    return next(new AppError("Request already reviewed", 400, httpstatustext.FAIL));
  }

  const updatedRequest = await ServiceRequest.findByIdAndUpdate(
    req.params.id,
    {
      status,
      reviewNotes: notes || ""
    },
    { new: true }
  ).populate("service", "name priority");
 
  const notesPart = notes ? ` — Staff note: "${notes}"` : '';
  await createNotification({
    userId:  updatedRequest.student,
    message: `Your ${updatedRequest.priority} priority request for "${updatedRequest.service.name}" has been ${status}.${notesPart}`
  });

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: updatedRequest
  });

});

// ==============================
// GET ALL REQUESTS (staff / admin)
// ==============================
const getAllRequests = asyncwrapper(async (req, res, next) => {

  const filter = {};

  if (req.user.role === "staff") {
    filter.assignedTo = new mongoose.Types.ObjectId(req.user.id); // ✅ cast to ObjectId
  }

  if (req.query.status) {
    const allowed = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Expired'];
    if (!allowed.includes(req.query.status)) {
      return next(new AppError('Invalid status filter', 400, httpstatustext.FAIL));
    }
    filter.status = req.query.status;
  }

  if (req.query.category) {
    const allowed = ['education', 'visa', 'housing', 'financial'];
    if (!allowed.includes(req.query.category)) {
      return next(new AppError('Invalid category filter', 400, httpstatustext.FAIL));
    }
    filter.category = req.query.category;
  }

  if (req.query.priority) {
    const allowed = ['low', 'medium', 'high'];
    if (!allowed.includes(req.query.priority)) {
      return next(new AppError('Invalid priority filter', 400, httpstatustext.FAIL));
    }
    filter.priority = req.query.priority;
  }

  const pagination = await paginate(ServiceRequest, req, filter);

  const requests = await ServiceRequest.aggregate([
    { $match: filter }, // ✅ now assignedTo is ObjectId, match works correctly
    {
      $addFields: {
        priorityWeight: {
          $switch: {
            branches: [
              { case: { $eq: ["$priority", "high"]   }, then: 1 },
              { case: { $eq: ["$priority", "medium"] }, then: 2 },
              { case: { $eq: ["$priority", "low"]    }, then: 3 }
            ],
            default: 4
          }
        }
      }
    },
    { $sort: { priorityWeight: 1, createdAt: -1 } },
    { $skip: pagination.skip },
    { $limit: pagination.limit },
    {
      $lookup: {
        from: "users",
        localField: "student",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },
    {
      $lookup: {
        from: "services",
        localField: "service",
        foreignField: "_id",
        as: "service"
      }
    },
    { $unwind: "$service" },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo"
      }
    },
    {
      $unwind: {
        path: "$assignedTo",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        priorityWeight: 0,
        "student.password": 0,
        "assignedTo.password": 0
      }
    }
  ]);

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
    .populate("service", "name category priority requiredDocuments expireDays")
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
  const uploadedDocs = request.requiredDocuments.filter(doc => doc.isUploaded === true);
  const missingDocs  = request.requiredDocuments.filter(doc => doc.isUploaded === false);

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: {
      ...request.toObject(),
      documents: {
        uploaded:      uploadedDocs,
        missing:       missingDocs,
        total:         request.requiredDocuments.length,
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
    return next(new AppError("Request not found", 404, httpstatustext.FAIL));
  }

  if (request.student.toString() !== req.user.id) {
    return next(new AppError("Unauthorized", 403, httpstatustext.FAIL));
  }

  if (request.status !== "Pending") {
    return next(new AppError("Cannot cancel this request", 400, httpstatustext.FAIL));
  }

  request.status = "Cancelled";
  await request.save();
  
  await createNotification({
    userId: request.student,
    message: `Your ${request.priority} priority request has been cancelled successfully`
  });

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: request
  });

});


export {
  submitRequest,
  getMyRequests,
  getAllRequests,
  getRequest,
  reviewRequest,
  cancelRequest
};