const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');

// Get all users (admin only)
const getUsers = asyncHandler(async (req, res) => {
  const users = await Admin.find({}).select('-password').sort({ createdAt: -1 });
  res.json({
    success: true,
    count: users.length,
    data: users
  });
});

// Get user by ID (admin only)
const getUserById = asyncHandler(async (req, res) => {
  const user = await Admin.findById(req.params.id).select('-password');
  if (user) {
    res.json({
      success: true,
      data: user
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Create new user (admin only)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user exists
  const userExists = await Admin.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  // Validate role
  const validRoles = ['admin', 'agent'];
  if (role && !validRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role. Must be admin or agent');
  }

  // Create user
  const user = await Admin.create({
    name,
    email,
    password,
    role: role || 'agent'
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// Update user (admin only)
const updateUser = asyncHandler(async (req, res) => {
  const user = await Admin.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, email, role, password } = req.body;

  // Validate role if provided
  if (role) {
    const validRoles = ['admin', 'agent'];
    if (!validRoles.includes(role)) {
      res.status(400);
      throw new Error('Invalid role. Must be admin or agent');
    }
    user.role = role;
  }

  // Update other fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = password;

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    }
  });
});

// Delete user (admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await Admin.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent deleting yourself
  if (user._id.toString() === req.admin._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  await user.deleteOne();
  res.json({
    success: true,
    message: 'User removed'
  });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
