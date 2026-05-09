const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');
const { getTodayRangeIST } = require('../utils/cronJobs');

// Helper function to remove empty strings from object
const cleanLeadData = (data) => {
  const cleaned = { ...data };

  // propertyCategory is now an array — remove empty arrays or invalid values
  if (cleaned.propertyCategory !== undefined) {
    if (!Array.isArray(cleaned.propertyCategory)) {
      cleaned.propertyCategory = cleaned.propertyCategory ? [cleaned.propertyCategory] : [];
    }
    cleaned.propertyCategory = cleaned.propertyCategory.filter(v => v && v !== '');
    if (cleaned.propertyCategory.length === 0) delete cleaned.propertyCategory;
  }

  // --- Enum fields: delete if empty string so Mongoose doesn't reject them ---
  const enumFields = [
    'leadType',
    'leadStatus',
    'propertyType',
    'propertyPreference',
    'ageOfProperty',
    'timelineToBuy',
    'purposeOfBuying',
  ];
  enumFields.forEach(field => {
    if (cleaned[field] === '' || cleaned[field] === null || cleaned[field] === undefined) {
      delete cleaned[field];
    }
  });

  // --- ObjectId fields: delete if empty ---
  const objectIdFields = ['propertyCondition', 'landmark', 'assignedTo'];
  objectIdFields.forEach(field => {
    if (cleaned[field] === '' || cleaned[field] === null || cleaned[field] === undefined) {
      delete cleaned[field];
    }
  });

  // --- Plain optional fields: delete if empty string ---
  const optionalFields = [
    'fullName', 'email', 'city', 'budget', 'ref',
    'preferredLocation', 'remarks', 'phoneNumber',
  ];
  optionalFields.forEach(field => {
    if (cleaned[field] === '') delete cleaned[field];
  });

  // nextCallDate: delete if empty string (keep null/valid date)
  if (cleaned.nextCallDate === '') delete cleaned.nextCallDate;

  // Never allow comments to be set via create/update — handled separately
  delete cleaned.comments;

  return cleaned;
};

// Allowed sortable fields to prevent injection
const SORTABLE_FIELDS = ['createdAt', 'fullName', 'budget', 'leadStatus', 'leadType'];

const getLeads = asyncHandler(async (req, res) => {
  const {
    leadType, minBudget, maxBudget, leadStatus, search, ref,
    page = 1, limit = 10,
    sortBy = 'createdAt', sortOrder = 'desc'
  } = req.query;

  const query = {};

  // Role-based filtering: if agent, only show leads created by or assigned to them
  if (req.admin.role === 'agent') {
    query.$or = [
      { createdBy: req.admin._id },
      { assignedTo: req.admin._id }
    ];
  }

  if (leadType) query.leadType = leadType;
  if (leadStatus) query.leadStatus = leadStatus;
  if (ref) query.ref = ref;
  if (minBudget || maxBudget) {
    query.budget = {};
    if (minBudget) query.budget.$gte = Number(minBudget);
    if (maxBudget) query.budget.$lte = Number(maxBudget);
  }
  if (search) {
    const searchQuery = [
      { fullName: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    // If agent, combine with role filter using $and
    if (req.admin.role === 'agent') {
      query.$and = [
        { $or: query.$or },
        { $or: searchQuery }
      ];
      delete query.$or;
    } else {
      query.$or = searchQuery;
    }
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build sort object — whitelist field names for safety
  const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sortObj = { [sortField]: sortDir };

  const leads = await Lead.find(query)
    .populate('propertyCategory', 'name')
    .populate('propertyCondition', 'name')
    .populate('landmark', 'name city area')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  const total = await Lead.countDocuments(query);

  res.json({
    success: true,
    count: leads.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: leads
  });
});

const getLeadById = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('propertyCategory', 'name description')
    .populate('propertyCondition', 'name description')
    .populate('landmark', 'name city area description')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('comments.addedBy', 'name email');

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  // Role-based access: agent can only view their own created or assigned leads
  if (req.admin.role === 'agent') {
    const isCreator = lead.createdBy?._id?.toString() === req.admin._id.toString();
    const isAssigned = lead.assignedTo?._id?.toString() === req.admin._id.toString();
    if (!isCreator && !isAssigned) {
      res.status(403);
      throw new Error('Access denied. You can only view leads you created or are assigned to.');
    }
  }

  res.json({
    success: true,
    data: lead
  });
});

const createLead = asyncHandler(async (req, res) => {
  // Clean the data to remove empty strings
  const cleanedData = cleanLeadData(req.body);

  // Set createdBy from authenticated user
  cleanedData.createdBy = req.admin._id;

  const lead = await Lead.create(cleanedData);

  const populatedLead = await Lead.findById(lead._id)
    .populate('propertyCategory', 'name')
    .populate('propertyCondition', 'name')
    .populate('landmark', 'name city area')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    data: populatedLead
  });
});

const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  // Role-based access: agent can only update their own created or assigned leads
  if (req.admin.role === 'agent') {
    const isCreator = lead.createdBy?.toString() === req.admin._id.toString();
    const isAssigned = lead.assignedTo?.toString() === req.admin._id.toString();
    if (!isCreator && !isAssigned) {
      res.status(403);
      throw new Error('Access denied. You can only update leads you created or are assigned to.');
    }
  }

  // Clean the data to remove empty strings
  const cleanedData = cleanLeadData(req.body);

  Object.keys(cleanedData).forEach(key => {
    lead[key] = cleanedData[key];
  });

  const updatedLead = await lead.save();

  const populatedLead = await Lead.findById(updatedLead._id)
    .populate('propertyCategory', 'name')
    .populate('propertyCondition', 'name')
    .populate('landmark', 'name city area')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  res.json({
    success: true,
    data: populatedLead
  });
});

const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  // Role-based access: only admins can delete leads
  if (req.admin.role === 'agent') {
    res.status(403);
    throw new Error('Access denied. Only admins can delete leads.');
  }

  await lead.deleteOne();
  res.json({
    success: true,
    message: 'Lead removed'
  });
});

const getLeadStats = asyncHandler(async (req, res) => {
  let baseQuery = {};

  // Role-based filtering for stats
  if (req.admin.role === 'agent') {
    baseQuery = {
      $or: [
        { createdBy: req.admin._id },
        { assignedTo: req.admin._id }
      ]
    };
  }

  const totalLeads = await Lead.countDocuments(baseQuery);
  const buyerLeads = await Lead.countDocuments({ ...baseQuery, leadType: 'Buyer' });
  const brokerLeads = await Lead.countDocuments({ ...baseQuery, leadType: 'Broker' });
  const sellerLeads = await Lead.countDocuments({ ...baseQuery, leadType: 'Seller' });

  const statusStats = await Lead.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$leadStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      total: totalLeads,
      buyers: buyerLeads,
      brokers: brokerLeads,
      sellers: sellerLeads,
      byStatus: statusStats
    }
  });
});

// POST /api/leads/:id/comments — Add a comment to a lead
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Comment text is required');
  }

  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  lead.comments.push({
    text: text.trim(),
    addedBy: req.admin._id,
    addedAt: new Date()
  });

  await lead.save();

  const updatedLead = await Lead.findById(lead._id)
    .populate('comments.addedBy', 'name email');

  res.json({
    success: true,
    data: updatedLead.comments
  });
});

const getFBAdsLeads = asyncHandler(async (req, res) => {
  req.query.ref = 'FB-Ads-Scarlet';
  // Role-based filtering is handled in getLeads
  return await getLeads(req, res);
});

// POST /api/leads/whatsapp-log — Log WhatsApp send to multiple leads
const logWhatsApp = asyncHandler(async (req, res) => {
  const { leadIds, message } = req.body;
  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    res.status(400);
    throw new Error('leadIds array is required');
  }
  if (!message || !message.trim()) {
    res.status(400);
    throw new Error('message is required');
  }

  const snippet = message.trim().substring(0, 80);
  const sentAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const commentText = `📱 WhatsApp sent: "${snippet}" — ${sentAt}`;

  let count = 0;
  for (const id of leadIds) {
    try {
      const lead = await Lead.findById(id);
      if (lead) {
        lead.comments.push({
          text: commentText,
          addedBy: req.admin._id,
          addedAt: new Date()
        });
        await lead.save();
        count++;
      }
    } catch (err) {
      // Skip invalid IDs silently
    }
  }

  res.json({ success: true, sent: count });
});

// GET /api/leads/today-calls — leads whose nextCallDate falls on today (IST)
const getTodayCalls = asyncHandler(async (req, res) => {
  const { start, end } = getTodayRangeIST();

  let query = { nextCallDate: { $gte: start, $lte: end } };

  // Role-based filtering: agents only see their own leads
  if (req.admin.role === 'agent') {
    query.$or = [
      { createdBy: req.admin._id },
      { assignedTo: req.admin._id },
    ];
  }

  const leads = await Lead.find(query)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('propertyCategory', 'name')
    .sort({ nextCallDate: 1 });

  res.json({
    success: true,
    count: leads.length,
    date: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' }),
    data: leads,
  });
});

module.exports = {
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
};
