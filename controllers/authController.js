const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email }).select('+password');

  if (admin && (await admin.matchPassword(password))) {
    res.json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id)
      }
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

const getProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  
  if (admin) {
    res.json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } else {
    res.status(404);
    throw new Error('Admin not found');
  }
});

module.exports = { login, getProfile };
