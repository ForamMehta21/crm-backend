const asyncHandler = require('express-async-handler');
const Builder = require('../models/Builder');

const getBuilders = asyncHandler(async (req, res) => {
  const builders = await Builder.find().sort({ createdAt: -1 });
  res.json({
    success: true,
    count: builders.length,
    data: builders
  });
});

const getBuilder = asyncHandler(async (req, res) => {
  const builder = await Builder.findById(req.params.id);

  if (builder) {
    res.json({
      success: true,
      data: builder
    });
  } else {
    res.status(404);
    throw new Error('Builder not found');
  }
});

const createBuilder = asyncHandler(async (req, res) => {
  const { name, number, companyName, runningProjects, upcomingProjects, completedProjects, remarks } = req.body;

  const builder = await Builder.create({
    name,
    number,
    companyName,
    runningProjects: runningProjects || [],
    upcomingProjects: upcomingProjects || [],
    completedProjects: completedProjects || [],
    remarks
  });

  res.status(201).json({
    success: true,
    data: builder
  });
});

const updateBuilder = asyncHandler(async (req, res) => {
  const builder = await Builder.findById(req.params.id);

  if (builder) {
    builder.name = req.body.name || builder.name;
    builder.number = req.body.number || builder.number;
    builder.companyName = req.body.companyName || builder.companyName;
    builder.runningProjects = req.body.runningProjects !== undefined ? req.body.runningProjects : builder.runningProjects;
    builder.upcomingProjects = req.body.upcomingProjects !== undefined ? req.body.upcomingProjects : builder.upcomingProjects;
    builder.completedProjects = req.body.completedProjects !== undefined ? req.body.completedProjects : builder.completedProjects;
    builder.remarks = req.body.remarks !== undefined ? req.body.remarks : builder.remarks;

    const updatedBuilder = await builder.save();

    res.json({
      success: true,
      data: updatedBuilder
    });
  } else {
    res.status(404);
    throw new Error('Builder not found');
  }
});

const deleteBuilder = asyncHandler(async (req, res) => {
  const builder = await Builder.findById(req.params.id);

  if (builder) {
    await builder.deleteOne();
    res.json({
      success: true,
      message: 'Builder removed'
    });
  } else {
    res.status(404);
    throw new Error('Builder not found');
  }
});

module.exports = {
  getBuilders,
  getBuilder,
  createBuilder,
  updateBuilder,
  deleteBuilder
};
