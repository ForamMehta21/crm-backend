const mongoose = require('mongoose');

const propertyConditionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Property condition name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PropertyCondition', propertyConditionSchema);
