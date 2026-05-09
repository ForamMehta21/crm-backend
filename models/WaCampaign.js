const mongoose = require('mongoose');

const waCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WaTemplate',
    required: [true, 'Template is required']
  },
  variableMapping: {
    type: Object,
    default: {}
  },
  filters: {
    status: [String],
    propertyType: [String],
    budgetMin: Number,
    budgetMax: Number,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    dateFrom: Date,
    dateTo: Date
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED'],
    default: 'DRAFT'
  },
  stats: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    replied: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WaCampaign', waCampaignSchema);
