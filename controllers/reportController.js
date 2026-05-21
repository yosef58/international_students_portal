import ServiceRequest from '../models/ServiceRequest.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

import asyncwrapper from '../middlewares/asyncwrapper.js';
import httpstatustext from '../utils/httpstatustext.js';


// ==============================
//  REQUESTS BY STATUS
// ==============================
const requestsByStatus = asyncwrapper(async (req, res, next) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const totalData = await ServiceRequest.aggregate([
    {
      $group: {
        _id: "$status"
      }
    }
  ]);

  const report = await ServiceRequest.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    page,
    results: report.length,
    totalPages: Math.ceil(totalData.length / limit),
    data: report.map(r => ({
      status: r._id,
      count: r.count
    }))
  });

});


// ==============================
//  REQUESTS PER SERVICE
// ==============================
const requestsPerService = asyncwrapper(async (req, res, next) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const totalData = await ServiceRequest.aggregate([
    {
      $group: { _id: "$service" }
    }
  ]);

  const report = await ServiceRequest.aggregate([
    {
      $group: {
        _id: "$service",
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "services",
        localField: "_id",
        foreignField: "_id",
        as: "serviceInfo"
      }
    },
    { $unwind: "$serviceInfo" },
    {
      $project: {
        serviceName: "$serviceInfo.name",
        count: 1
      }
    },
    { $sort: { count: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    page,
    results: report.length,
    totalPages: Math.ceil(totalData.length / limit),
    data: report
  });

});

// ==============================
//  REQUESTS PER STUDENT
// ==============================
const requestsPerStudent = asyncwrapper(async (req, res, next) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const totalData = await ServiceRequest.aggregate([
    {
      $group: { _id: "$student" }
    }
  ]);

  const report = await ServiceRequest.aggregate([
    {
      $group: {
        _id: "$student",
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "studentInfo"
      }
    },
    { $unwind: "$studentInfo" },
    {
      $project: {
        studentName: "$studentInfo.name",
        count: 1
      }
    },
    { $sort: { count: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    page,
    results: report.length,
    totalPages: Math.ceil(totalData.length / limit),
    data: report
  });

});

// ==============================
//  TOTAL REVENUE (APPROVED REQUESTS)
// ==============================
const totalRevenue = asyncwrapper(async (req, res, next) => {

  const result = await ServiceRequest.aggregate([
    {
      $match: { status: "Approved" }
    },
    {
      $lookup: {
        from: "services",
        localField: "service",
        foreignField: "_id",
        as: "serviceInfo"
      }
    },
    { $unwind: "$serviceInfo" },
    {
      $group: {
        _id: null,
        totalRevenue:    { $sum: "$serviceInfo.price" },
        approvedCount:   { $sum: 1 },
        averagePrice:    { $avg: "$serviceInfo.price" }
      }
    },
    {
      $project: {
        _id:           0,
        totalRevenue:  1,
        approvedCount: 1,
        averagePrice:  { $round: ["$averagePrice", 2] }
      }
    }
  ]);

  const data = result[0] || {
    totalRevenue:  0,
    approvedCount: 0,
    averagePrice:  0
  };

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data
  });

});


// ==============================
//  DASHBOARD SUMMARY
// ==============================
const dashboardSummary = asyncwrapper(async (req, res, next) => {

  const [totalRequests, totalServices, totalStudents] = await Promise.all([
    ServiceRequest.countDocuments(),
    Service.countDocuments(),
    User.countDocuments({ role: "student" })
  ]);

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: {
      totalRequests,
      totalServices,
      totalStudents
    }
  });

});
export  {
    dashboardSummary,
    requestsPerStudent,
    requestsByStatus,
    requestsPerService,
    totalRevenue
};