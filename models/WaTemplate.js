const mongoose = require('mongoose');

const waTemplateSchema = new mongoose.Schema({
  metaTemplateId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    default: 'en'
  },
  category: {
    type: String,
    enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'],
    required: true
  },
  status: {
    type: String,
    enum: ['APPROVED', 'PENDING', 'REJECTED'],
    default: 'PENDING'
  },
  components: [
    {
      type: { type: String },
      format: { type: String },
      text: { type: String },
      example: { type: mongoose.Schema.Types.Mixed }
    }
  ],
  variables: [String],
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WaTemplate', waTemplateSchema);
