const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminExists = await Admin.findOne({ email: 'admin@realestate.com' });
    
    if (adminExists) {
      console.log('Admin already exists');
      process.exit();
    }
    
    const admin = await Admin.create({
      name: 'Admin',
      email: 'admin@realestate.com',
      password: 'admin123',
      role: 'admin'
    });
    
    console.log('Admin created successfully');
    console.log('Email: admin@realestate.com');
    console.log('Password: admin123');
    
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
