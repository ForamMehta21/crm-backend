const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select('-password');
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }

  if (!req.admin) {
    res.status(401);
    throw new Error('Not authorized, admin not found');
  }

  next();
});

const adminOnly = (req, res, next) => {
  if (req.admin && req.admin.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied. Admin only.');
  }
};

const agentOnly = (req, res, next) => {
  if (req.admin && req.admin.role === 'agent') {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied. Agent only.');
  }
};

const allowBoth = (req, res, next) => {
  if (req.admin && (req.admin.role === 'admin' || req.admin.role === 'agent')) {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied.');
  }
};

module.exports = { protect, adminOnly, agentOnly, allowBoth };
