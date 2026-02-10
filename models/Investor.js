const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Investor name is required'],
    trim: true
  },
  number: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  details: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Investor', investorSchema);
