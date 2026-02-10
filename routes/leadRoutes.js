const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats
} = require('../controllers/leadController');
const {
  exportLeads,
  downloadTemplate,
  validateImport,
  importLeads
} = require('../controllers/leadImportExportController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate, leadSchema } = require('../utils/validation');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, adminOnly, getLeads)
  .post(protect, adminOnly, validate(leadSchema), createLead);

router.get('/stats', protect, adminOnly, getLeadStats);

router.get('/export', protect, adminOnly, exportLeads);
router.get('/template', protect, adminOnly, downloadTemplate);
router.post('/validate-import', protect, adminOnly, upload.single('file'), validateImport);
router.post('/import', protect, adminOnly, importLeads);

router.route('/:id')
  .get(protect, adminOnly, getLeadById)
  .put(protect, adminOnly, updateLead)
  .delete(protect, adminOnly, deleteLead);

module.exports = router;
