import User  from'../models/User.js';
import Student  from'../models/Student.js';
import Employee  from'../models/Employee.js';

import bcrypt from 'bcrypt';
import jwt  from'jsonwebtoken';

import asyncwrapper  from'../middlewares/asyncwrapper.js';
import AppError  from'../utils/appError.js';
import httpstatustext  from'../utils/httpstatustext.js';
import paginate from '../utils/pagination.js';

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

  const avatar = req.file ? req.file.path : null;
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
    role: "student",
    avatar
  });

  await Student.create({
    user: user._id,
    studentId,
    passportNumber,
    nationality,
    phone,
    gender
  });



  res.status(201).json({
    status: httpstatustext.SUCCESS,
    message: "Student registered successfully",
    email: user.email
  });

});


// =============================
// EMPLOYEE REGISTER
// =============================
const Employeeregister = asyncwrapper(async (req, res, next) => {

  const avatar = req.file ? req.file.path : null;
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
    role,
    avatar
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
      new AppError(`${role} not allow to login`, 403, httpstatustext.FAIL)
    );
  }

  const token = generateToken(user._id);

  res.cookie("token", token, {
  httpOnly: true,
  secure: true,       // production لازم https
  sameSite: "none",   // مهم مع cross-origin
  maxAge: 7 * 24 * 60 * 60 * 1000
});

 let extraData = {};
  
 if (user.role === "student") {
  const student = await Student.findOne({ user: user._id });
  if (student) {  
    extraData = {
        studentId: student.studentId,
        passportNumber: student.passportNumber,
        nationality: student.nationality,
        phone: student.phone,
        gender: student.gender
      };
    }
  }
  
  await User.findByIdAndUpdate(user._id, {
    isActive: true,
    lastSeen: new Date()
  });

  res.json({
    status: httpstatustext.SUCCESS,
    message: "Logged in successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: true,
      ...extraData
    }
  });
});



// =============================
// // LOGOUT
// =============================
const logout = asyncwrapper(async (req, res, next) =>  {
  
  await User.findByIdAndUpdate(req.user._id, {
    isActive: false,
    lastSeen: new Date()
  });

  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });

  res.json({
    status: "success",
    message: "Logged out successfully"
  });
});

// =============================
// GET ALL USERS (admin only)
// =============================
const getAllUsers = asyncwrapper(async (req, res, next) => {
 
  // Optional filter by role: /users?role=student
  const filter = {};
  if (req.query.role) {
    const allowed = ["student", "staff", "admin"];
    if (!allowed.includes(req.query.role)) {
      return next(new AppError("Invalid role filter", 400, httpstatustext.FAIL));
    }
    filter.role = req.query.role;
  }
 
  const pagination = await paginate(User, req, filter);
 
  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);
 
  res.status(200).json({
    status:     httpstatustext.SUCCESS,
    page:       pagination.page,
    results:    users.length,
    totalPages: pagination.totalPages,
    data:       users
  });
 
});
 
// =============================
// DELETE USER (admin only)
// =============================
const deleteUser = asyncwrapper(async (req, res, next) => {
 
  const { id } = req.params;
 
  // Prevent admin from deleting themselves
  if (id === req.user.id) {
    return next(new AppError("You cannot delete your own account", 400, httpstatustext.FAIL));
  }
 
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("User not found", 404, httpstatustext.FAIL));
  }
 
  // Delete the associated profile (Student or Employee) as well
  if (user.role === "student") {
    await Student.findOneAndDelete({ user: id });
  } else {
    await Employee.findOneAndDelete({ user: id });
  }
 
  await User.findByIdAndDelete(id);
 
  res.status(200).json({
    status:  httpstatustext.SUCCESS,
    message: `User '${user.name}' and their profile deleted successfully`
  });
 
});

// =============================
// ACTIVE STAFF (admin only)
// =============================
const activestaff =asyncwrapper(async (req, res) => {
  const onlineStaff = await User.find(
    { role: "staff", isActive: true },
    "name email avatar isActive lastSeen"
  );
  res.json({
    status: "success",
    results: onlineStaff.length,
    data: onlineStaff
  });
});

export  {
   login,
   Studentregister,
   Employeeregister,
   logout,
   deleteUser,
   getAllUsers,
   activestaff
};