const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const leadSchema = new mongoose.Schema({
  leadType: {
    type: String,
    required: [true, 'Lead type is required'],
    enum: ['Buyer', 'Broker', 'Seller']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },

  budget: {
    type: Number
  },
  ref: {
    type: String,
    trim: true
  },
  propertyType: {
    type: String,
    enum: ['Residential Rent', 'Residential Sell', 'Commercial Rent', 'Commercial Sell']
  },
  // Now an array of ObjectIds (multiselect)
  propertyCategory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PropertyType'
  }],
  propertyCondition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PropertyCondition'
  },
  preferredLocation: {
    type: String,
    trim: true
  },
  landmark: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Landmark'
  },
  leadStatus: {
    type: String,
    enum: ['New', 'Attempted 1', 'Attempted 2', 'Attempted 3', 'Follow-up', 'unqualified', 'warm', 'hot', 'site visit planned', 'site visit done', 'booked', 'booed someware else'],
    default: 'New'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Assigned admin is required']
  },
  remarks: {
    type: String,
    trim: true
  },
  nextCallDate: {
    type: Date
  },
  purposeOfBuying: {
    type: String,
    enum: ['Personal Use', 'Investment', 'Second Home', 'Gift']
  },
  // Updated: New / Resell
  propertyPreference: {
    type: String,
    enum: ['New', 'Resell'],
    trim: true
  },
  // New field: Age of property (for resell or ready)
  ageOfProperty: {
    type: String,
    enum: ['Under Construction', '01-05', '5-10', '11-15', '15-25', '25+'],
    trim: true
  },
  // New field: Timeline to buy
  timelineToBuy: {
    type: String,
    enum: ['0-15 days', '15-25 days', '25-30 days', '30-60 days', '90+ days'],
    trim: true
  },
  // Comments (with date-time)
  comments: [commentSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);
