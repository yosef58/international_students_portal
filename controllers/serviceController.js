import Service from '../models/Service.js';
import asyncwrapper from '../middlewares/asyncwrapper.js';
import AppError from '../utils/appError.js';
import httpstatustext from '../utils/httpstatustext.js';
import paginate from '../utils/pagination.js';

// ==============================
// CREATE SERVICE
// ==============================
const createService = asyncwrapper(async (req, res, next) => {
  

  const { name, description, category, priority, price, requiredDocuments ,expireDays } = req.body;

  let parsedDocuments = requiredDocuments;
  if (typeof requiredDocuments === 'string') {
    try {
      parsedDocuments = JSON.parse(requiredDocuments);
    } catch {
      parsedDocuments = [requiredDocuments];
    }
  }

  const parsedExpireDays = expireDays ? Number(expireDays) : 7; 
  if (isNaN(parsedExpireDays) || parsedExpireDays < 1) {
    return next(new AppError("expireDays must be a number greater than 0", 400, httpstatustext.FAIL));
  }
  const service = await Service.create({
    name,
    description,
    category,
    priority,
    price: Number(price),
    requiredDocuments: parsedDocuments,
    expireDays: parsedExpireDays,
    image: req.file ? req.file.path : null
  });

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

  const { name, description, priority, category, price, requiredDocuments, expireDays } = req.body;
  const updateData = { name, description, category, price,priority, requiredDocuments };

    if (expireDays !== undefined) {
    const parsed = Number(expireDays);
    if (isNaN(parsed) || parsed < 1) {
      return next(new AppError("expireDays must be a number greater than 0", 400, httpstatustext.FAIL));
    }
    updateData.expireDays = parsed;
  }

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