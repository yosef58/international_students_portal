import Service from '../models/Service.js';
import asyncwrapper from '../middlewares/asyncwrapper.js';
import AppError from '../utils/appError.js';
import httpstatustext from '../utils/httpstatustext.js';
import paginate from '../utils/pagination.js';

// ==============================
// CREATE SERVICE
// ==============================
const createService = asyncwrapper(async (req, res, next) => {

  const { name, description, category, price, requiredDocuments } = req.body;
  const service = await Service.create({
    name,
    description,
    category,
    price,
    requiredDocuments,
    image: req.file ? req.file.path : null
  });
  
  if (!service) {
    return next(new AppError("Service creation failed", 500, httpstatustext.ERROR));
  }

  res.status(201).json({
    status: httpstatustext.SUCCESS,
    data: service
  });

});

// ==============================
// GET ALL SERVICES
// ==============================
const getServices = asyncwrapper(async (req, res, next) => {

  const pagination = await paginate(Service, req);

  const services = await Service.find()
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    page: pagination.page,
    results: services.length,
    totalPages: pagination.totalPages,
    data: services
  });

});


// ==============================
// UPDATE SERVICE
// ==============================
const updateService = asyncwrapper(async (req, res, next) => {

  const { name, description, category, price, requiredDocuments } = req.body;
  const updateData = { name, description, category, price, requiredDocuments };

  if (req.file) updateData.image = req.file.path;


  if (req.file) {
    updateData.image = req.file.path;
  }

  const service = await Service.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!service) {
    return next(new AppError("Service not found", 404, httpstatustext.FAIL));
  }

  res.status(200).json({
    status: httpstatustext.SUCCESS,
    data: service
  });

});

// ==============================
// DELETE SERVICE
// ==============================
const deleteService = asyncwrapper(async (req, res, next) => {

  const { id } = req.params;

  const service = await Service.findByIdAndDelete(id);

  if (!service) {
    return next(new AppError("Service not found", 404, httpstatustext.FAIL));
  }
  
  res.status(200).json({
    status: httpstatustext.SUCCESS,
    message: "Service deleted successfully"
  });
  
});

  
export  {
      getServices,
      createService,
      updateService,
      deleteService
    };