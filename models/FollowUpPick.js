const mongoose = require('mongoose');

// One row per lead picked for the daily random follow-up list.
// Also the history that stops a lead being picked again within 7 days.
const followUpPickSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  // IST day the lead was picked for, 'YYYY-MM-DD'
  dateKey: { type: String, required: true },
  done: { type: Boolean, default: false },
  doneAt: { type: Date, default: null },
  doneBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
  },
}, {
  timestamps: true,
});

followUpPickSchema.index({ lead: 1, dateKey: 1 }, { unique: true });
followUpPickSchema.index({ dateKey: 1 });

module.exports = mongoose.model('FollowUpPick', followUpPickSchema);
