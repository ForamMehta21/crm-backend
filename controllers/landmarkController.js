const asyncHandler = require('express-async-handler');
const Landmark = require('../models/Landmark');

const getLandmarks = asyncHandler(async (req, res) => {
  const { city, area } = req.query;
  const query = {};
  
  if (city) query.city = { $regex: city, $options: 'i' };
  if (area) query.area = { $regex: area, $options: 'i' };
  
  const landmarks = await Landmark.find(query).sort({ createdAt: -1 });
  res.json({
    success: true,
    count: landmarks.length,
    data: landmarks
  });
});

const getLandmarkById = asyncHandler(async (req, res) => {
  const landmark = await Landmark.findById(req.params.id);
  
  if (landmark) {
    res.json({
      success: true,
      data: landmark
    });
  } else {
    res.status(404);
    throw new Error('Landmark not found');
  }
});

const createLandmark = asyncHandler(async (req, res) => {
  const { name, city, area, description } = req.body;
  
  const landmark = await Landmark.create({
    name,
    city,
    area,
    description
  });
  
  res.status(201).json({
    success: true,
    data: landmark
  });
});

const updateLandmark = asyncHandler(async (req, res) => {
  const landmark = await Landmark.findById(req.params.id);
  
  if (landmark) {
    landmark.name = req.body.name || landmark.name;
    landmark.city = req.body.city || landmark.city;
    landmark.area = req.body.area || landmark.area;
    landmark.description = req.body.description || landmark.description;
    
    const updatedLandmark = await landmark.save();
    
    res.json({
      success: true,
      data: updatedLandmark
    });
  } else {
    res.status(404);
    throw new Error('Landmark not found');
  }
});

const deleteLandmark = asyncHandler(async (req, res) => {
  const landmark = await Landmark.findById(req.params.id);
  
  if (landmark) {
    await landmark.deleteOne();
    res.json({
      success: true,
      message: 'Landmark removed'
    });
  } else {
    res.status(404);
    throw new Error('Landmark not found');
  }
});

module.exports = {
  getLandmarks,
  getLandmarkById,
  createLandmark,
  updateLandmark,
  deleteLandmark
};
