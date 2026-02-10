const mongoose = require('mongoose');

const landmarkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Landmark name is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  area: {
    type: String,
    required: [true, 'Area is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Landmark', landmarkSchema);
