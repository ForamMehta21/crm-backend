const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  type: {
    type: String,
    enum: ['daily_followup', 'call_today', 'call_reminder'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  leads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }],
  // IST day this notification belongs to, 'YYYY-MM-DD'
  dateKey: { type: String, required: true },
  // Unique per logical notification so retries, restarts and catch-up runs never duplicate one
  dedupeKey: { type: String, required: true, unique: true },
  read: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
// Old notifications clean themselves up after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
