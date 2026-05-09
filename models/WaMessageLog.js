const mongoose = require('mongoose');

const waMessageLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WaCampaign',
    required: true,
    index: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  renderedMessage: {
    type: String
  },
  metaMessageId: {
    type: String,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'REPLIED'],
    default: 'PENDING'
  },
  failedReason: {
    type: String
  },
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  repliedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('WaMessageLog', waMessageLogSchema);
