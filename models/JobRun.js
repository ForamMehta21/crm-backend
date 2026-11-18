const mongoose = require('mongoose');

// Records that a scheduled job ran for a given key (for example the IST day),
// so the job runs exactly once even with restarts, catch-up runs or several server instances.
const jobRunSchema = new mongoose.Schema({
  job: { type: String, required: true },
  key: { type: String, required: true },
  status: { type: String, enum: ['running', 'done'], default: 'running' },
  summary: { type: mongoose.Schema.Types.Mixed, default: null },
}, {
  timestamps: true,
});

jobRunSchema.index({ job: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('JobRun', jobRunSchema);
