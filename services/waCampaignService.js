const Lead = require('../models/Lead');
const Admin = require('../models/Admin');
const WaCampaign = require('../models/WaCampaign');
const WaTemplate = require('../models/WaTemplate');
const WaMessageLog = require('../models/WaMessageLog');
const WaOptOut = require('../models/WaOptOut');
const metaWhatsappService = require('./metaWhatsappService');

const getEligibleLeads = async (filters) => {
  const query = {};

  if (filters.status && filters.status.length > 0) {
    query.leadStatus = { $in: filters.status };
  }

  if (filters.propertyType && filters.propertyType.length > 0) {
    query.propertyType = { $in: filters.propertyType };
  }

  if (filters.budgetMin || filters.budgetMax) {
    query.budget = {};
    if (filters.budgetMin) query.budget.$gte = filters.budgetMin;
    if (filters.budgetMax) query.budget.$lte = filters.budgetMax;
  }

  if (filters.assignedTo) {
    query.assignedTo = filters.assignedTo;
  }

  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }

  query.phoneNumber = { $exists: true, $ne: '', $regex: /^\d{10,}$/ };

  const optedOutPhones = await WaOptOut.find({}).select('phone').lean();
  const optOutSet = new Set(optedOutPhones.map(o => o.phone));

  const leads = await Lead.find(query)
    .populate('assignedTo', 'name email')
    .lean();

  const eligible = leads.filter(lead => {
    const phone = normalizePhone(lead.phoneNumber);
    return phone && !optOutSet.has(phone);
  });

  return eligible;
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 10) return null;
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

const resolveVariables = (lead, variableMapping, assignedUser) => {
  const resolved = {};

  for (const [position, field] of Object.entries(variableMapping)) {
    let value = '';

    switch (field) {
      case 'lead.name':
      case 'lead.fullName':
        value = lead.fullName || '';
        break;
      case 'lead.phone':
      case 'lead.phoneNumber':
        value = lead.phoneNumber || '';
        break;
      case 'lead.email':
        value = lead.email || '';
        break;
      case 'lead.propertyType':
        value = lead.propertyType || '';
        break;
      case 'lead.budget':
        value = lead.budget ? String(lead.budget) : '';
        break;
      case 'lead.preferredLocation':
        value = lead.preferredLocation || '';
        break;
      case 'assignedUser.name':
      case 'user.name':
        value = assignedUser?.name || '';
        break;
      default:
        value = field || '';
        break;
    }

    resolved[position] = value;
  }

  return resolved;
};

const buildMetaComponents = (template, resolvedVars) => {
  const components = [];
  const bodyComponent = template.components?.find(c => c.type === 'BODY');

  if (bodyComponent && Object.keys(resolvedVars).length > 0) {
    const parameters = Object.keys(resolvedVars)
      .sort((a, b) => Number(a) - Number(b))
      .map(key => ({
        type: 'text',
        text: resolvedVars[key]
      }));

    components.push({
      type: 'body',
      parameters
    });
  }

  const headerComponent = template.components?.find(c => c.type === 'HEADER');
  if (headerComponent && headerComponent.format === 'TEXT' && headerComponent.text?.includes('{{')) {
    components.push({
      type: 'header',
      parameters: [{ type: 'text', text: resolvedVars['1'] || '' }]
    });
  }

  return components;
};

const renderMessage = (template, resolvedVars) => {
  const bodyComponent = template.components?.find(c => c.type === 'BODY');
  if (!bodyComponent?.text) return '';

  let message = bodyComponent.text;
  for (const [position, value] of Object.entries(resolvedVars)) {
    message = message.replace(`{{${position}}}`, value);
  }
  return message;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const executeCampaign = async (campaignId) => {
  const campaign = await WaCampaign.findById(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  const template = await WaTemplate.findById(campaign.templateId);
  if (!template) throw new Error('Template not found');

  try {
    await WaCampaign.findByIdAndUpdate(campaignId, { status: 'RUNNING' });

    const leads = await getEligibleLeads(campaign.filters || {});

    await WaCampaign.findByIdAndUpdate(campaignId, {
      'stats.total': leads.length
    });

    const BATCH_SIZE = 50;
    const BATCH_DELAY = 1000;

    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);

      for (const lead of batch) {
        const phone = normalizePhone(lead.phoneNumber);
        if (!phone) continue;

        let assignedUser = null;
        if (lead.assignedTo && typeof lead.assignedTo === 'object') {
          assignedUser = lead.assignedTo;
        } else if (lead.assignedTo) {
          assignedUser = await Admin.findById(lead.assignedTo).select('name email').lean();
        }

        const resolvedVars = resolveVariables(lead, campaign.variableMapping || {}, assignedUser);
        const metaComponents = buildMetaComponents(template, resolvedVars);
        const renderedMessage = renderMessage(template, resolvedVars);

        const result = await metaWhatsappService.sendTemplateMessage(
          phone,
          template.name,
          template.language,
          metaComponents
        );

        const logEntry = new WaMessageLog({
          campaignId: campaign._id,
          leadId: lead._id,
          phone,
          renderedMessage,
          metaMessageId: result.success ? result.messageId : null,
          status: result.success ? 'SENT' : 'FAILED',
          failedReason: result.success ? null : result.error,
          sentAt: result.success ? new Date() : null
        });

        await logEntry.save();

        if (result.success) {
          await WaCampaign.findByIdAndUpdate(campaignId, {
            $inc: { 'stats.sent': 1 }
          });
        } else {
          await WaCampaign.findByIdAndUpdate(campaignId, {
            $inc: { 'stats.failed': 1 }
          });
        }
      }

      if (i + BATCH_SIZE < leads.length) {
        await delay(BATCH_DELAY);
      }
    }

    await WaCampaign.findByIdAndUpdate(campaignId, { status: 'COMPLETED' });
    console.log(`[WA Campaign] Campaign ${campaignId} completed successfully`);
  } catch (error) {
    console.error(`[WA Campaign] Campaign ${campaignId} failed:`, error.message);
    await WaCampaign.findByIdAndUpdate(campaignId, {
      status: 'FAILED'
    });
    throw error;
  }
};

module.exports = {
  getEligibleLeads,
  resolveVariables,
  buildMetaComponents,
  renderMessage,
  normalizePhone,
  executeCampaign
};
