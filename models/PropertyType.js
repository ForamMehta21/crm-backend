const mongoose = require('mongoose');

const propertyTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Property type name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Residential', 'Commercial'],
    required: [true, 'Category is required']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PropertyType', propertyTypeSchema);
