const express = require('express');
const router = express.Router();
const {
  getInvestors,
  getInvestor,
  createInvestor,
  updateInvestor,
  deleteInvestor
} = require('../controllers/investorController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const Joi = require('joi');

const investorSchema = Joi.object({
  name: Joi.string().required().trim(),
  number: Joi.string().required().trim(),
  details: Joi.string().allow('').trim()
});

router.route('/')
  .get(protect, getInvestors)
  .post(protect, adminOnly, validate(investorSchema), createInvestor);

router.route('/:id')
  .get(protect, getInvestor)
  .put(protect, adminOnly, validate(investorSchema), updateInvestor)
  .delete(protect, adminOnly, deleteInvestor);

module.exports = router;
