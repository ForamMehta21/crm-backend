const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');

// Helper function to remove empty strings from object
const cleanLeadData = (data) => {
  const cleaned = { ...data };
  
  // Convert empty strings to undefined for ObjectId fields
  if (cleaned.propertyCategory === '') delete cleaned.propertyCategory;
  if (cleaned.propertyCondition === '') delete cleaned.propertyCondition;
  if (cleaned.landmark === '') delete cleaned.landmark;
  
  // Convert empty strings to undefined for enum fields
  if (cleaned.propertyType === '') delete cleaned.propertyType;
  
  // Convert empty strings to undefined for other optional fields
  if (cleaned.email === '') delete cleaned.email;
  if (cleaned.city === '') delete cleaned.city;
  if (cleaned.budget === '') delete cleaned.budget;
  if (cleaned.ref === '') delete cleaned.ref;
  if (cleaned.preferredLocation === '') delete cleaned.preferredLocation;
  if (cleaned.remarks === '') delete cleaned.remarks;
  
  return cleaned;
};

const getLeads = asyncHandler(async (req, res) => {
  const { leadType, city, minBudget, maxBudget, leadStatus, search, page = 1, limit = 10 } = req.query;
  
  const query = {};
  
  if (leadType) query.leadType = leadType;
  if (city) query.city = { $regex: city, $options: 'i' };
  if (leadStatus) query.leadStatus = leadStatus;
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
  
  const leads = await Lead.find(query)
    .populate('propertyCategory', 'name')
    .populate('propertyCondition', 'name')
    .populate('landmark', 'name city area')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
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
    .populate('assignedTo', 'name email');
  
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

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats
};
