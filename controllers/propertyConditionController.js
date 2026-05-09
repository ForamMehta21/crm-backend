const asyncHandler = require('express-async-handler');
const PropertyCondition = require('../models/PropertyCondition');

const getPropertyConditions = asyncHandler(async (req, res) => {
  const propertyConditions = await PropertyCondition.find({}).sort({ createdAt: -1 });
  res.json({
    success: true,
    count: propertyConditions.length,
    data: propertyConditions
  });
});

const getPropertyConditionById = asyncHandler(async (req, res) => {
  const propertyCondition = await PropertyCondition.findById(req.params.id);
  
  if (propertyCondition) {
    res.json({
      success: true,
      data: propertyCondition
    });
  } else {
    res.status(404);
    throw new Error('Property condition not found');
  }
});

const createPropertyCondition = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  
  const propertyConditionExists = await PropertyCondition.findOne({ name });
  
  if (propertyConditionExists) {
    res.status(400);
    throw new Error('Property condition already exists');
  }
  
  const propertyCondition = await PropertyCondition.create({
    name,
    description
  });
  
  res.status(201).json({
    success: true,
    data: propertyCondition
  });
});

const updatePropertyCondition = asyncHandler(async (req, res) => {
  const propertyCondition = await PropertyCondition.findById(req.params.id);
  
  if (propertyCondition) {
    propertyCondition.name = req.body.name || propertyCondition.name;
    propertyCondition.description = req.body.description || propertyCondition.description;
    
    const updatedPropertyCondition = await propertyCondition.save();
    
    res.json({
      success: true,
      data: updatedPropertyCondition
    });
  } else {
    res.status(404);
    throw new Error('Property condition not found');
  }
});

const deletePropertyCondition = asyncHandler(async (req, res) => {
  const propertyCondition = await PropertyCondition.findById(req.params.id);
  
  if (propertyCondition) {
    await propertyCondition.deleteOne();
    res.json({
      success: true,
      message: 'Property condition removed'
    });
  } else {
    res.status(404);
    throw new Error('Property condition not found');
  }
});

module.exports = {
  getPropertyConditions,
  getPropertyConditionById,
  createPropertyCondition,
  updatePropertyCondition,
  deletePropertyCondition
};
