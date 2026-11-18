const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const FollowUpPick = require('../models/FollowUpPick');
const { istDateKey } = require('../utils/dateIST');
const { runDueJobs, runDailyDigest, runCallReminders } = require('../services/followUpService');

const LEAD_FIELDS = 'fullName phoneNumber email leadStatus nextCallDate assignedTo';

// GET /api/notifications?limit=20&page=1&unread=true
const getNotifications = asyncHandler(async (req, res) => {
  // Opening the CRM also catches up on missed jobs (the host may have slept through 08:00).
  // Throttled to once a minute inside the service.
  await runDueJobs().catch(() => {});

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const query = { recipient: req.admin._id };
  if (req.query.unread === 'true') query.read = false;

  const [data, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'leads', select: LEAD_FIELDS, populate: { path: 'assignedTo', select: 'name' } }),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: req.admin._id, read: false }),
  ]);

  res.json({ success: true, data, total, page, pages: Math.ceil(total / limit), unreadCount });
});

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.admin._id },
    { read: true, readAt: new Date() },
    { new: true },
  );
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json({ success: true, data: notification });
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.admin._id, read: false },
    { read: true, readAt: new Date() },
  );
  res.json({ success: true, updated: result.modifiedCount });
});

// GET /api/notifications/followups/today — today's random follow-up leads (admins only)
const getTodayFollowUps = asyncHandler(async (req, res) => {
  const dateKey = istDateKey();
  const picks = await FollowUpPick.find({ dateKey })
    .sort({ createdAt: 1 })
    .populate({ path: 'lead', select: LEAD_FIELDS, populate: { path: 'assignedTo', select: 'name' } })
    .populate('doneBy', 'name');

  // A lead deleted after it was picked leaves an empty pick behind
  const data = picks.filter((p) => p.lead);
  res.json({
    success: true,
    dateKey,
    total: data.length,
    done: data.filter((p) => p.done).length,
    data,
  });
});

// PATCH /api/notifications/followups/:id — body { done: true|false }
const setFollowUpDone = asyncHandler(async (req, res) => {
  const done = req.body.done !== false;
  const pick = await FollowUpPick.findByIdAndUpdate(
    req.params.id,
    done
      ? { done: true, doneAt: new Date(), doneBy: req.admin._id }
      : { done: false, doneAt: null, doneBy: null },
    { new: true },
  ).populate('doneBy', 'name');

  if (!pick) {
    res.status(404);
    throw new Error('Follow-up not found');
  }
  res.json({ success: true, data: pick });
});

// POST /api/notifications/run-now — admin: run today's digest now (even before 08:00) and check reminders
const runNow = asyncHandler(async (req, res) => {
  const digest = await runDailyDigest({ force: true });
  const reminders = await runCallReminders();
  res.json({ success: true, digest, reminders });
});

// GET|POST /api/notifications/cron?key=CRON_SECRET (or header x-cron-secret)
// For an external pinger (for example cron-job.org every 5 minutes): wakes a sleeping
// server and runs whatever is due. Disabled unless CRON_SECRET is set.
const cronTick = asyncHandler(async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const given = String(req.get('x-cron-secret') || req.query.key || '');
  const ok = secret
    && given.length === secret.length
    && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) {
    res.status(404);
    throw new Error('Not found');
  }
  const result = await runDueJobs({ throttle: false });
  res.json({ success: true, ...result });
});

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  getTodayFollowUps,
  setFollowUpDone,
  runNow,
  cronTick,
};
