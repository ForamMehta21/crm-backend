const cron = require('node-cron');
const { getTodayRangeIST } = require('./dateIST');
const { runDailyDigest, runCallReminders, runDueJobs } = require('../services/followUpService');

const initCronJobs = () => {
  // 08:00 IST: 5 random follow-ups + today's scheduled calls (in-app + email)
  cron.schedule(
    '0 8 * * *',
    () => runDailyDigest().catch((err) => console.error('[CronJob] Daily digest failed:', err.message)),
    { timezone: 'Asia/Kolkata' },
  );

  // Every 5 minutes: reminders for calls starting in the next 15 minutes
  cron.schedule(
    '*/5 * * * *',
    () => runCallReminders().catch((err) => console.error('[CronJob] Call reminders failed:', err.message)),
    { timezone: 'Asia/Kolkata' },
  );

  // Catch up after a restart or after the host woke the server from sleep:
  // sends today's digest if 08:00 has passed and it has not gone out yet.
  setTimeout(() => runDueJobs({ throttle: false }), 5000);

  console.log('[CronJob] Daily 08:00 IST follow-up digest and 5-minute call reminders scheduled');
};

module.exports = { initCronJobs, getTodayRangeIST };
