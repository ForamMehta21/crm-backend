const asyncHandler = require('express-async-handler');
const PropertyType = require('../models/PropertyType');

const getPropertyTypes = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const query = category ? { category } : {};
  const propertyTypes = await PropertyType.find(query).sort({ createdAt: -1 });
  res.json({
    success: true,
    count: propertyTypes.length,
    data: propertyTypes
  });
});

const getPropertyTypeById = asyncHandler(async (req, res) => {
  const propertyType = await PropertyType.findById(req.params.id);
  
  if (propertyType) {
    res.json({
      success: true,
      data: propertyType
    });
  } else {
    res.status(404);
    throw new Error('Property type not found');
  }
});

const createPropertyType = asyncHandler(async (req, res) => {
  const { name, description, category } = req.body;
  
  const propertyTypeExists = await PropertyType.findOne({ name });
  
  if (propertyTypeExists) {
    res.status(400);
    throw new Error('Property type already exists');
  }
  
  const propertyType = await PropertyType.create({
    name,
    description,
    category
  });
  
  res.status(201).json({
    success: true,
    data: propertyType
  });
});

const updatePropertyType = asyncHandler(async (req, res) => {
  const propertyType = await PropertyType.findById(req.params.id);
  
  if (propertyType) {
    propertyType.name = req.body.name || propertyType.name;
    propertyType.description = req.body.description || propertyType.description;
    propertyType.category = req.body.category || propertyType.category;
    
    const updatedPropertyType = await propertyType.save();
    
    res.json({
      success: true,
      data: updatedPropertyType
    });
  } else {
    res.status(404);
    throw new Error('Property type not found');
  }
});

const deletePropertyType = asyncHandler(async (req, res) => {
  const propertyType = await PropertyType.findById(req.params.id);
  
  if (propertyType) {
    await propertyType.deleteOne();
    res.json({
      success: true,
      message: 'Property type removed'
    });
  } else {
    res.status(404);
    throw new Error('Property type not found');
  }
});

module.exports = {
  getPropertyTypes,
  getPropertyTypeById,
  createPropertyType,
  updatePropertyType,
  deletePropertyType
};
