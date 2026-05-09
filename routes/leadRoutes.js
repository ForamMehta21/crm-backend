const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  addComment,
  getFBAdsLeads,
  logWhatsApp,
  getTodayCalls,
} = require('../controllers/leadController');
const {
  exportLeads,
  downloadTemplate,
  validateImport,
  importLeads
} = require('../controllers/leadImportExportController');
const { protect, adminOnly, allowBoth } = require('../middleware/auth');
const { validate, leadSchema } = require('../utils/validation');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, allowBoth, getLeads)
  .post(protect, allowBoth, createLead);

router.get('/fb-ads', protect, allowBoth, getFBAdsLeads);

router.get('/stats', protect, allowBoth, getLeadStats);

router.get('/export', protect, adminOnly, exportLeads);
router.get('/template', protect, allowBoth, downloadTemplate);
router.post('/validate-import', protect, adminOnly, upload.single('file'), validateImport);
router.post('/import', protect, adminOnly, importLeads);

// WhatsApp bulk log — must be BEFORE /:id so Express doesn't treat 'whatsapp-log' as an ID
router.post('/whatsapp-log', protect, allowBoth, logWhatsApp);

// Today's calls — leads where nextCallDate is today
router.get('/today-calls', protect, allowBoth, getTodayCalls);

router.route('/:id')
  .get(protect, allowBoth, getLeadById)
  .put(protect, allowBoth, updateLead)
  .delete(protect, adminOnly, deleteLead);

// Comments
router.post('/:id/comments', protect, allowBoth, addComment);

module.exports = router;
