const express = require('express');
const router = express.Router();
const { protect, adminOnly, allowBoth } = require('../middleware/auth');
const {
  getNotifications,
  markRead,
  markAllRead,
  getTodayFollowUps,
  setFollowUpDone,
  runNow,
  cronTick,
} = require('../controllers/notificationController');

// External pinger, authenticated by CRON_SECRET rather than a login
router.route('/cron').get(cronTick).post(cronTick);

router.get('/', protect, allowBoth, getNotifications);
router.patch('/read-all', protect, allowBoth, markAllRead);
router.post('/run-now', protect, adminOnly, runNow);

router.get('/followups/today', protect, adminOnly, getTodayFollowUps);
router.patch('/followups/:id', protect, adminOnly, setFollowUpDone);

router.patch('/:id/read', protect, allowBoth, markRead);

module.exports = router;
