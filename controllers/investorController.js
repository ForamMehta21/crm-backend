const asyncHandler = require('express-async-handler');
const Investor = require('../models/Investor');

const getInvestors = asyncHandler(async (req, res) => {
  const investors = await Investor.find().sort({ createdAt: -1 });
  res.json({
    success: true,
    count: investors.length,
    data: investors
  });
});

const getInvestor = asyncHandler(async (req, res) => {
  const investor = await Investor.findById(req.params.id);

  if (investor) {
    res.json({
      success: true,
      data: investor
    });
  } else {
    res.status(404);
    throw new Error('Investor not found');
  }
});

const createInvestor = asyncHandler(async (req, res) => {
  const { name, number, details } = req.body;

  const investor = await Investor.create({
    name,
    number,
    details
  });

  res.status(201).json({
    success: true,
    data: investor
  });
});

const updateInvestor = asyncHandler(async (req, res) => {
  const investor = await Investor.findById(req.params.id);

  if (investor) {
    investor.name = req.body.name || investor.name;
    investor.number = req.body.number || investor.number;
    investor.details = req.body.details !== undefined ? req.body.details : investor.details;

    const updatedInvestor = await investor.save();

    res.json({
      success: true,
      data: updatedInvestor
    });
  } else {
    res.status(404);
    throw new Error('Investor not found');
  }
});

const deleteInvestor = asyncHandler(async (req, res) => {
  const investor = await Investor.findById(req.params.id);

  if (investor) {
    await investor.deleteOne();
    res.json({
      success: true,
      message: 'Investor removed'
    });
  } else {
    res.status(404);
    throw new Error('Investor not found');
  }
});

module.exports = {
  getInvestors,
  getInvestor,
  createInvestor,
  updateInvestor,
  deleteInvestor
};
