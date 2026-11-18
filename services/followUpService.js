/**
 * Daily follow-up automation and call notifications.
 *
 * - Daily digest (08:00 IST): picks 5 random open leads that were not picked in the
 *   last 7 days, lists today's scheduled calls, notifies every admin in-app and by email.
 * - Call reminders (every 5 min): notifies the assigned agent (or the admins when the
 *   lead is unassigned) about 15 minutes before a scheduled call.
 *
 * Every step is idempotent (unique keys in JobRun, FollowUpPick and Notification), so it
 * is safe to run from node-cron, from the catch-up on startup, from the notifications
 * API, and from an external pinger at the same time.
 */
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const FollowUpPick = require('../models/FollowUpPick');
const JobRun = require('../models/JobRun');
const {
  istParts, istDateKey, istDateKeyDaysAgo, getTodayRangeIST, isMidnightIST, formatTimeIST,
} = require('../utils/dateIST');
const { sendDailyDigestEmail, sendCallReminderEmail } = require('../utils/emailService');

const DAILY_PICK_COUNT = 5;
const NO_REPEAT_DAYS = 7;
const DIGEST_HOUR_IST = 8;
const REMINDER_LEAD_MINUTES = 15;
// A reminder found late (server was asleep) is still sent if the call started at most this long ago
const REMINDER_GRACE_MINUTES = 10;

// Leads in these statuses are never picked for random follow-up.
// 'booed someware else' is the old misspelling, kept until scripts/fixLeadStatusTypo.js has run.
const CLOSED_STATUSES = [
  'unqualified',
  'booked',
  'booked somewhere else',
  'booed someware else',
  'site visit planned',
];

const DAILY_JOB = 'daily-followup-digest';

const isDuplicateKey = (err) => err && err.code === 11000;
const dbReady = () => mongoose.connection.readyState === 1;

const getAdmins = () => Admin.find({ role: 'admin' }).select('name email');

// Inserts a notification; returns null when one with the same dedupeKey already exists
const createNotification = async (doc) => {
  try {
    return await Notification.create(doc);
  } catch (err) {
    if (isDuplicateKey(err)) return null;
    throw err;
  }
};

/**
 * Picks today's random follow-up leads. Reuses today's picks if they already exist
 * (for example after a crash halfway through the job).
 */
const pickDailyFollowUps = async ({ dateKey, excludeLeadIds = [] }) => {
  const existing = await FollowUpPick.find({ dateKey }).select('lead');
  if (existing.length > 0) return existing.map((p) => p.lead);

  // Picked on any of the last 7 IST days, today included, so a lead picked on a Monday
  // can come back no earlier than the next Monday
  const sinceKey = istDateKeyDaysAgo(NO_REPEAT_DAYS - 1);
  const recentlyPicked = await FollowUpPick.distinct('lead', { dateKey: { $gte: sinceKey } });

  const sampled = await Lead.aggregate([
    {
      $match: {
        _id: { $nin: [...recentlyPicked, ...excludeLeadIds] },
        leadStatus: { $nin: CLOSED_STATUSES },
      },
    },
    { $sample: { size: DAILY_PICK_COUNT } },
    { $project: { _id: 1 } },
  ]);

  const leadIds = sampled.map((l) => l._id);
  if (leadIds.length === 0) return [];

  try {
    await FollowUpPick.insertMany(
      leadIds.map((lead) => ({ lead, dateKey })),
      { ordered: false },
    );
  } catch (err) {
    if (!isDuplicateKey(err)) throw err;
  }
  // Another run may have inserted picks at the same moment; today's stored picks are the truth
  const stored = await FollowUpPick.find({ dateKey }).select('lead');
  return stored.map((p) => p.lead);
};

/**
 * Runs the morning digest for the current IST day, once.
 * `force` skips the 08:00 check (used by the admin "run now" button).
 */
const runDailyDigest = async ({ force = false } = {}) => {
  if (!dbReady()) return { skipped: 'database not connected' };

  const now = new Date();
  if (!force && istParts(now).hours < DIGEST_HOUR_IST) return { skipped: 'before 08:00 IST' };

  const dateKey = istDateKey(now);

  try {
    await JobRun.create({ job: DAILY_JOB, key: dateKey });
  } catch (err) {
    if (isDuplicateKey(err)) return { skipped: 'already ran today', dateKey };
    throw err;
  }

  try {
    const { start, end } = getTodayRangeIST(now);
    const calls = await Lead.find({ nextCallDate: { $gte: start, $lte: end } })
      .select('fullName phoneNumber leadStatus nextCallDate assignedTo')
      .populate('assignedTo', 'name email')
      .sort({ nextCallDate: 1 });

    const followUpIds = await pickDailyFollowUps({
      dateKey,
      excludeLeadIds: calls.map((c) => c._id),
    });
    const followUps = await Lead.find({ _id: { $in: followUpIds } })
      .select('fullName phoneNumber leadStatus nextCallDate assignedTo')
      .populate('assignedTo', 'name email');

    const admins = await getAdmins();
    for (const admin of admins) {
      if (followUps.length > 0) {
        await createNotification({
          recipient: admin._id,
          type: 'daily_followup',
          title: `Today's ${followUps.length} follow-up${followUps.length === 1 ? '' : 's'}`,
          message: followUps.map((l) => l.fullName || l.phoneNumber).join(', '),
          leads: followUps.map((l) => l._id),
          dateKey,
          dedupeKey: `daily_followup:${admin._id}:${dateKey}`,
        });
      }
      if (calls.length > 0) {
        await createNotification({
          recipient: admin._id,
          type: 'call_today',
          title: `${calls.length} call${calls.length === 1 ? '' : 's'} scheduled today`,
          message: calls
            .map((l) => `${l.fullName || l.phoneNumber}${isMidnightIST(l.nextCallDate) ? '' : ` at ${formatTimeIST(l.nextCallDate)}`}`)
            .join(', '),
          leads: calls.map((l) => l._id),
          dateKey,
          dedupeKey: `call_today:${admin._id}:${dateKey}`,
        });
      }
    }

    const summary = { dateKey, followUps: followUps.length, calls: calls.length, admins: admins.length };
    await JobRun.updateOne({ job: DAILY_JOB, key: dateKey }, { status: 'done', summary });
    console.log(`[FollowUps] Daily digest done for ${dateKey}:`, summary);

    // Email is best effort: a mail failure must not undo the in-app notifications
    const to = process.env.NOTIFY_EMAIL
      ? process.env.NOTIFY_EMAIL.split(',').map((s) => s.trim())
      : admins.map((a) => a.email);
    sendDailyDigestEmail({ to, followUps, calls }).catch((err) =>
      console.error('[FollowUps] Digest email failed:', err.message));

    return summary;
  } catch (err) {
    // Release today's claim so the next tick can retry
    await JobRun.deleteOne({ job: DAILY_JOB, key: dateKey }).catch(() => {});
    throw err;
  }
};

/**
 * Sends a reminder for each call starting within the next 15 minutes.
 * Calls stored at exactly midnight IST have no real time and get no reminder.
 */
const runCallReminders = async () => {
  if (!dbReady()) return { skipped: 'database not connected' };

  const now = Date.now();
  const leads = await Lead.find({
    nextCallDate: {
      $gte: new Date(now - REMINDER_GRACE_MINUTES * 60 * 1000),
      $lte: new Date(now + REMINDER_LEAD_MINUTES * 60 * 1000),
    },
  })
    .select('fullName phoneNumber leadStatus nextCallDate assignedTo')
    .populate('assignedTo', 'name email');

  const due = leads.filter((l) => !isMidnightIST(l.nextCallDate));
  if (due.length === 0) return { sent: 0 };

  let admins = null;
  let sent = 0;

  for (const lead of due) {
    let recipients;
    if (lead.assignedTo) {
      recipients = [lead.assignedTo];
    } else {
      admins = admins || (await getAdmins());
      recipients = admins;
    }

    const time = formatTimeIST(lead.nextCallDate);
    for (const recipient of recipients) {
      const created = await createNotification({
        recipient: recipient._id,
        type: 'call_reminder',
        title: `Call at ${time}: ${lead.fullName || lead.phoneNumber}`,
        message: `${lead.phoneNumber}${lead.leadStatus ? ` · ${lead.leadStatus}` : ''}`,
        leads: [lead._id],
        dateKey: istDateKey(lead.nextCallDate),
        // Includes the call time, so rescheduling a call gives it a fresh reminder
        dedupeKey: `call_reminder:${recipient._id}:${lead._id}:${lead.nextCallDate.getTime()}`,
      });
      if (created) {
        sent += 1;
        sendCallReminderEmail({ to: recipient.email, lead }).catch((err) =>
          console.error('[FollowUps] Call reminder email failed:', err.message));
      }
    }
  }

  if (sent > 0) console.log(`[FollowUps] Sent ${sent} call reminder(s)`);
  return { sent };
};

/**
 * Runs whatever is due: today's digest if it was missed, plus call reminders.
 * Throttled in-process so frequent callers (the bell polling every minute) stay cheap.
 */
let lastTickAt = 0;
let tickInFlight = null;
const TICK_THROTTLE_MS = 60 * 1000;

const runDueJobs = async ({ throttle = true } = {}) => {
  if (tickInFlight) return tickInFlight;
  if (throttle && Date.now() - lastTickAt < TICK_THROTTLE_MS) return { skipped: 'throttled' };
  lastTickAt = Date.now();

  tickInFlight = (async () => {
    const result = {};
    try {
      result.digest = await runDailyDigest();
    } catch (err) {
      console.error('[FollowUps] Daily digest failed:', err.message);
      result.digest = { error: err.message };
    }
    try {
      result.reminders = await runCallReminders();
    } catch (err) {
      console.error('[FollowUps] Call reminders failed:', err.message);
      result.reminders = { error: err.message };
    }
    return result;
  })();

  try {
    return await tickInFlight;
  } finally {
    tickInFlight = null;
  }
};

/**
 * Marks a lead's follow-up pick for today as done. Called when someone comments on
 * or updates a picked lead; does nothing if the lead was not picked today.
 */
const markFollowUpDone = async (leadId, adminId) => {
  if (!leadId) return null;
  return FollowUpPick.findOneAndUpdate(
    { lead: leadId, dateKey: istDateKey(), done: false },
    { done: true, doneAt: new Date(), doneBy: adminId || null },
    { new: true },
  );
};

module.exports = {
  CLOSED_STATUSES,
  DAILY_PICK_COUNT,
  NO_REPEAT_DAYS,
  pickDailyFollowUps,
  runDailyDigest,
  runCallReminders,
  runDueJobs,
  markFollowUpDone,
};
