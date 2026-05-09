const mongoose = require('mongoose');

const builderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Builder name is required'],
    trim: true
  },
  number: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  runningProjects: [{
    type: String,
    trim: true
  }],
  upcomingProjects: [{
    type: String,
    trim: true
  }],
  completedProjects: [{
    type: String,
    trim: true
  }],
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Builder', builderSchema);
