const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');

// Helper function to remove empty strings from object
const cleanLeadData = (data) => {
  const cleaned = { ...data };
  
  // propertyCategory is now an array — remove empty arrays or invalid values
  if (cleaned.propertyCategory !== undefined) {
    if (!Array.isArray(cleaned.propertyCategory)) {
      // Wrap single value in array for backward compat
      cleaned.propertyCategory = cleaned.propertyCategory ? [cleaned.propertyCategory] : [];
    }
    // Filter out empty strings
    cleaned.propertyCategory = cleaned.propertyCategory.filter(v => v && v !== '');
    if (cleaned.propertyCategory.length === 0) delete cleaned.propertyCategory;
  }

  // Convert empty strings to undefined for ObjectId fields
  if (cleaned.propertyCondition === '') delete cleaned.propertyCondition;
  if (cleaned.landmark === '') delete cleaned.landmark;
  
  // Convert empty strings to undefined for enum fields
  if (cleaned.propertyType === '') delete cleaned.propertyType;
  if (cleaned.propertyPreference === '') delete cleaned.propertyPreference;
  if (cleaned.ageOfProperty === '') delete cleaned.ageOfProperty;
  if (cleaned.timelineToBuy === '') delete cleaned.timelineToBuy;
  
  // Convert empty strings to undefined for other optional fields
  if (cleaned.email === '') delete cleaned.email;

  if (cleaned.budget === '') delete cleaned.budget;
  if (cleaned.ref === '') delete cleaned.ref;
  if (cleaned.preferredLocation === '') delete cleaned.preferredLocation;
  if (cleaned.remarks === '') delete cleaned.remarks;

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
  
  if (leadType) query.leadType = leadType;
  if (leadStatus) query.leadStatus = leadStatus;
  if (ref) query.ref = ref;
  if (minBudget || maxBudget) {
    query.budget = {};
    if (minBudget) query.budget.$gte = Number(minBudget);
    if (maxBudget) query.budget.$lte = Number(maxBudget);
  }
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
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
    .populate('comments.addedBy', 'name email');
  
  if (lead) {
    res.json({
      success: true,
      data: lead
    });
  } else {
    res.status(404);
    throw new Error('Lead not found');
  }
});

const createLead = asyncHandler(async (req, res) => {
  // Clean the data to remove empty strings
  const cleanedData = cleanLeadData(req.body);
  
  const lead = await Lead.create(cleanedData);
  
  const populatedLead = await Lead.findById(lead._id)
    .populate('propertyCategory', 'name')
    .populate('propertyCondition', 'name')
    .populate('landmark', 'name city area')
    .populate('assignedTo', 'name email');
  
  res.status(201).json({
    success: true,
    data: populatedLead
  });
});

const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  
  if (lead) {
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
      .populate('assignedTo', 'name email');
    
    res.json({
      success: true,
      data: populatedLead
    });
  } else {
    res.status(404);
    throw new Error('Lead not found');
  }
});

const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  
  if (lead) {
    await lead.deleteOne();
    res.json({
      success: true,
      message: 'Lead removed'
    });
  } else {
    res.status(404);
    throw new Error('Lead not found');
  }
});

const getLeadStats = asyncHandler(async (req, res) => {
  const totalLeads = await Lead.countDocuments();
  const buyerLeads = await Lead.countDocuments({ leadType: 'Buyer' });
  const brokerLeads = await Lead.countDocuments({ leadType: 'Broker' });
  const sellerLeads = await Lead.countDocuments({ leadType: 'Seller' });
  
  const statusStats = await Lead.aggregate([
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
  req.query.ref = 'FB-Ads(Scarlet)';
  return await getLeads(req, res);
});

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  addComment,
  getFBAdsLeads
};
