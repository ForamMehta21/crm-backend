/**
 * WhatsApp Business API Routes
 * Mount: /api/whatsapp
 *
 * Webhook Setup Instructions:
 * 1. Go to Meta Developer Console → your App → WhatsApp → Configuration
 * 2. Set Callback URL: https://your-domain.com/api/whatsapp/webhook
 * 3. Set Verify Token: same as WA_WEBHOOK_VERIFY_TOKEN in .env
 * 4. Subscribe to: messages, message_deliveries, message_reads
 * 5. For local dev: use ngrok → ngrok http 5000
 */

const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  syncTemplates,
  getTemplates,
  createCampaign,
  previewAudience,
  sendCampaign,
  getCampaigns,
  getCampaignDetail,
  getCampaignLogs,
  handleWebhookVerify,
  handleWebhookPost,
  exportCampaignReport
} = require('../controllers/whatsappController');

router.get('/templates', protect, getTemplates);
router.post('/templates/sync', protect, adminOnly, syncTemplates);

router.post('/campaigns', protect, adminOnly, createCampaign);
router.get('/campaigns', protect, getCampaigns);
router.get('/campaigns/:id', protect, getCampaignDetail);
router.post('/campaigns/:id/preview', protect, previewAudience);
router.post('/campaigns/:id/send', protect, adminOnly, sendCampaign);
router.get('/campaigns/:id/logs', protect, getCampaignLogs);
router.get('/campaigns/:id/export', protect, exportCampaignReport);

router.get('/webhook', handleWebhookVerify);
router.post('/webhook', handleWebhookPost);

module.exports = router;
