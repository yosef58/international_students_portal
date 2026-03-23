import User  from'../models/User.js';
import Student  from'../models/student.js';
import Employee  from'../models/Employee.js';

import bcrypt from 'bcrypt';
import jwt  from'jsonwebtoken';

import asyncwrapper  from'../middlewares/asyncwrapper.js';
import AppError  from'../utils/appError.js';
import httpstatustext  from'../utils/httpstatustext.js';


// =============================
// Generate Token
// =============================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};


// =============================
// STUDENT REGISTER
// =============================
const Studentregister = asyncwrapper(async (req, res, next) => {

  const {
    name,
    email,
    password,
    studentId,
    passportNumber,
    nationality,
    phone,
    gender
  } = req.body;

  if (!name || !email || !password) {
    return next(
      new AppError("Data are required", 400, httpstatustext.FAIL)
    );
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(
      new AppError("Email already exists", 400, httpstatustext.FAIL)
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "student"
  });

  await Student.create({
    user: user._id,
    studentId,
    passportNumber,
    nationality,
    phone,
    gender
  });

  const token = generateToken(user._id);

  res.status(201).json({
    status: httpstatustext.SUCCESS,
    message: "Student registered successfully",
    token,
    email: user.email
  });

});


// =============================
// EMPLOYEE REGISTER
// =============================
const Employeeregister = asyncwrapper(async (req, res, next) => {

  const {
    name,
    email,
    password,
    employeeId,
    role,
    department
  } = req.body;

  if (!name || !email || !password) {
    return next(
      new AppError("Data are required", 400, httpstatustext.FAIL)
    );
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(
      new AppError("Email already exists", 400, httpstatustext.FAIL)
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role
  });

  const employee = await Employee.create({
    user: user._id,
    employeeId,
    role,
    department
  });

  res.status(201).json({
    status: httpstatustext.SUCCESS,
    message: "Employee created",
    email: user.email,
    role: employee.role
  });

});


// =============================
// LOGIN
// =============================
const login = asyncwrapper(async (req, res, next) => {

  const { email, password,role } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(
      new AppError("Invalid credentials", 401, httpstatustext.FAIL)
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  
    if (!isMatch ) {
      return next(
        new AppError("Invalid credentials", 401, httpstatustext.FAIL)
      );
    }


  if (!role || role!==user.role) {
    return next(
      new AppError(`${role}not allow to login`, 403, httpstatustext.FAIL)
    );
  }

  const token = generateToken(user._id);

  res.json({
    status: httpstatustext.SUCCESS,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });

});


export  {
   login,
   Studentregister,
   Employeeregister
};