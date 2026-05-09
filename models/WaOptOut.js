const mongoose = require('mongoose');

const waOptOutSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  reason: {
    type: String,
    default: 'User sent STOP'
  },
  optedOutAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WaOptOut', waOptOutSchema);
