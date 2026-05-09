const cron = require('node-cron');
const Lead = require('../models/Lead');
const { sendTodayCallsEmail } = require('./emailService');

// Returns the UTC start and end of today in IST (UTC+5:30)
const getTodayRangeIST = () => {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowUTC = Date.now();

  // Shift to IST to get today's date components
  const istNow = new Date(nowUTC + IST_OFFSET_MS);
  const y = istNow.getUTCFullYear();
  const m = istNow.getUTCMonth();
  const d = istNow.getUTCDate();

  // Midnight IST in UTC
  const startUTC = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - IST_OFFSET_MS);
  // End of day IST in UTC
  const endUTC = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - IST_OFFSET_MS);

  return { start: startUTC, end: endUTC };
};

const fetchAndEmailTodayCalls = async () => {
  try {
    const { start, end } = getTodayRangeIST();
    console.log(`[CronJob] Checking today's calls between ${start.toISOString()} and ${end.toISOString()}`);

    const leads = await Lead.find({
      nextCallDate: { $gte: start, $lte: end },
    })
      .populate('assignedTo', 'name email')
      .sort({ nextCallDate: 1 });

    console.log(`[CronJob] Found ${leads.length} lead(s) with calls today`);

    await sendTodayCallsEmail(leads);
  } catch (err) {
    console.error('[CronJob] Error in today-calls cron job:', err.message);
  }
};

const initCronJobs = () => {
  // Run every day at 8:00 AM IST
  cron.schedule(
    '0 8 * * *',
    fetchAndEmailTodayCalls,
    { timezone: 'Asia/Kolkata' }
  );

  console.log('[CronJob] Daily 8:00 AM IST email reminder scheduled');
};

module.exports = { initCronJobs, getTodayRangeIST, fetchAndEmailTodayCalls };
