const asyncHandler = require('express-async-handler');
const ExcelJS = require('exceljs');
const WaTemplate = require('../models/WaTemplate');
const WaCampaign = require('../models/WaCampaign');
const WaMessageLog = require('../models/WaMessageLog');
const WaOptOut = require('../models/WaOptOut');
const metaWhatsappService = require('../services/metaWhatsappService');
const waCampaignService = require('../services/waCampaignService');
const { addCampaignJob } = require('../queues/waCampaignQueue');

const syncTemplates = asyncHandler(async (req, res) => {
  const result = await metaWhatsappService.getTemplates();

  if (!result.success) {
    res.status(502);
    throw new Error(`Failed to fetch templates from Meta: ${result.error}`);
  }

  const synced = [];

  for (const tpl of result.templates) {
    const variables = [];
    const bodyComp = tpl.components?.find(c => c.type === 'BODY');
    if (bodyComp?.text) {
      const matches = bodyComp.text.match(/\{\{(\d+)\}\}/g);
      if (matches) {
        matches.forEach(m => {
          variables.push(m.replace(/[{}]/g, ''));
        });
      }
    }

    const updated = await WaTemplate.findOneAndUpdate(
      { metaTemplateId: tpl.id },
      {
        metaTemplateId: tpl.id,
        name: tpl.name,
        language: tpl.language,
        category: tpl.category,
        status: tpl.status,
        components: tpl.components || [],
        variables: [...new Set(variables)],
        syncedAt: new Date()
      },
      { upsert: true, new: true }
    );

    synced.push(updated);
  }

  res.json({
    success: true,
    message: `Synced ${synced.length} templates from Meta`,
    data: synced
  });
});

const getTemplates = asyncHandler(async (req, res) => {
  const templates = await WaTemplate.find({}).sort({ name: 1 });
  res.json({ success: true, data: templates });
});

const createCampaign = asyncHandler(async (req, res) => {
  const { name, templateId, variableMapping, filters, scheduledAt } = req.body;

  if (!name || !templateId) {
    res.status(400);
    throw new Error('Campaign name and template are required');
  }

  const template = await WaTemplate.findById(templateId);
  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  if (template.status !== 'APPROVED') {
    res.status(400);
    throw new Error('Only APPROVED templates can be used for campaigns');
  }

  const campaign = await WaCampaign.create({
    name,
    templateId,
    variableMapping: variableMapping || {},
    filters: filters || {},
    scheduledAt: scheduledAt || null,
    status: 'DRAFT',
    createdBy: req.admin._id
  });

  res.status(201).json({ success: true, data: campaign });
});

const previewAudience = asyncHandler(async (req, res) => {
  const campaign = await WaCampaign.findById(req.params.id);
  const filters = campaign ? campaign.filters : req.body.filters || {};

  const leads = await waCampaignService.getEligibleLeads(filters);

  const sample = leads.slice(0, 5).map(l => ({
    _id: l._id,
    fullName: l.fullName,
    phoneNumber: l.phoneNumber,
    leadStatus: l.leadStatus,
    propertyType: l.propertyType
  }));

  res.json({
    success: true,
    data: {
      count: leads.length,
      sample
    }
  });
});

const sendCampaign = asyncHandler(async (req, res) => {
  const campaign = await WaCampaign.findById(req.params.id);

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    res.status(400);
    throw new Error(`Cannot send campaign with status: ${campaign.status}`);
  }

  const { scheduledAt } = req.body;

  if (scheduledAt && new Date(scheduledAt) > new Date()) {
    campaign.status = 'SCHEDULED';
    campaign.scheduledAt = scheduledAt;
    await campaign.save();
    await addCampaignJob(campaign._id.toString(), scheduledAt);

    res.json({
      success: true,
      message: 'Campaign scheduled successfully',
      data: campaign
    });
  } else {
    campaign.status = 'RUNNING';
    await campaign.save();
    await addCampaignJob(campaign._id.toString(), null);

    res.json({
      success: true,
      message: 'Campaign queued for immediate sending',
      data: campaign
    });
  }
});

const getCampaigns = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const total = await WaCampaign.countDocuments();
  const campaigns = await WaCampaign.find({})
    .populate('templateId', 'name category')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: campaigns,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

const getCampaignDetail = asyncHandler(async (req, res) => {
  const campaign = await WaCampaign.findById(req.params.id)
    .populate('templateId')
    .populate('createdBy', 'name email');

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  res.json({ success: true, data: campaign });
});

const getCampaignLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { campaignId: req.params.id };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [
      { phone: searchRegex }
    ];
  }

  const total = await WaMessageLog.countDocuments(filter);
  const logs = await WaMessageLog.find(filter)
    .populate('leadId', 'fullName phoneNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: logs,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

const handleWebhookVerify = asyncHandler(async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
    console.log('[WA Webhook] Verification successful');
    res.status(200).send(challenge);
  } else {
    console.warn('[WA Webhook] Verification failed');
    res.status(403).send('Forbidden');
  }
});

const handleWebhookPost = asyncHandler(async (req, res) => {
  const body = req.body;

  if (body.object !== 'whatsapp_business_account') {
    return res.sendStatus(404);
  }

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;

      if (value.statuses) {
        for (const status of value.statuses) {
          const metaMessageId = status.id;
          const newStatus = status.status?.toUpperCase();
          const timestamp = status.timestamp ? new Date(Number(status.timestamp) * 1000) : new Date();

          const updateFields = {};

          if (newStatus === 'SENT') {
            updateFields.status = 'SENT';
            updateFields.sentAt = timestamp;
          } else if (newStatus === 'DELIVERED') {
            updateFields.status = 'DELIVERED';
            updateFields.deliveredAt = timestamp;
          } else if (newStatus === 'READ') {
            updateFields.status = 'READ';
            updateFields.readAt = timestamp;
          } else if (newStatus === 'FAILED') {
            updateFields.status = 'FAILED';
            updateFields.failedReason = status.errors?.[0]?.title || 'Unknown error';
          }

          if (Object.keys(updateFields).length > 0) {
            const log = await WaMessageLog.findOneAndUpdate(
              { metaMessageId },
              updateFields,
              { new: true }
            );

            if (log) {
              const statField = newStatus === 'DELIVERED' ? 'stats.delivered'
                : newStatus === 'READ' ? 'stats.read'
                : newStatus === 'FAILED' ? 'stats.failed'
                : null;

              if (statField) {
                await WaCampaign.findByIdAndUpdate(log.campaignId, {
                  $inc: { [statField]: 1 }
                });
              }
            }
          }
        }
      }

      if (value.messages) {
        for (const message of value.messages) {
          const from = message.from;
          const msgBody = message.text?.body?.trim()?.toUpperCase();

          if (msgBody === 'STOP') {
            await WaOptOut.findOneAndUpdate(
              { phone: from },
              {
                phone: from,
                reason: 'User sent STOP',
                optedOutAt: new Date()
              },
              { upsert: true }
            );
            console.log(`[WA Webhook] Opt-out recorded for ${from}`);
          }

          const log = await WaMessageLog.findOne({ phone: from, status: { $ne: 'FAILED' } })
            .sort({ createdAt: -1 });

          if (log) {
            log.status = 'REPLIED';
            log.repliedAt = new Date();
            await log.save();

            await WaCampaign.findByIdAndUpdate(log.campaignId, {
              $inc: { 'stats.replied': 1 }
            });
          }
        }
      }
    }
  }

  res.sendStatus(200);
});

const exportCampaignReport = asyncHandler(async (req, res) => {
  const campaign = await WaCampaign.findById(req.params.id)
    .populate('templateId', 'name');

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const logs = await WaMessageLog.find({ campaignId: req.params.id })
    .populate('leadId', 'fullName phoneNumber email')
    .sort({ createdAt: 1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Campaign Report');

  sheet.columns = [
    { header: 'Lead Name', key: 'leadName', width: 25 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Message', key: 'message', width: 50 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Sent At', key: 'sentAt', width: 20 },
    { header: 'Delivered At', key: 'deliveredAt', width: 20 },
    { header: 'Read At', key: 'readAt', width: 20 },
    { header: 'Failed Reason', key: 'failedReason', width: 30 }
  ];

  for (const log of logs) {
    sheet.addRow({
      leadName: log.leadId?.fullName || '',
      phone: log.phone,
      email: log.leadId?.email || '',
      message: log.renderedMessage || '',
      status: log.status,
      sentAt: log.sentAt ? log.sentAt.toISOString() : '',
      deliveredAt: log.deliveredAt ? log.deliveredAt.toISOString() : '',
      readAt: log.readAt ? log.readAt.toISOString() : '',
      failedReason: log.failedReason || ''
    });
  }

  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=campaign-${campaign.name}-report.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = {
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
};
