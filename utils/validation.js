const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const propertyTypeSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().allow('').trim(),
  category: Joi.string().valid('Residential', 'Commercial').required()
});

const propertyConditionSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().allow('').trim()
});

const landmarkSchema = Joi.object({
  name: Joi.string().required().trim(),
  city: Joi.string().required().trim(),
  area: Joi.string().required().trim(),
  description: Joi.string().allow('').trim()
});

const leadSchema = Joi.object({
  leadType: Joi.string().valid('Buyer', 'Broker', 'Seller').required(),
  fullName: Joi.string().required().trim(),
  phoneNumber: Joi.string().required().trim(),
  email: Joi.string().email().allow('').trim(),
  city: Joi.string().allow('').trim(),
  budget: Joi.number().allow('').min(0),
  ref: Joi.string().allow('').trim(),
  propertyType: Joi.string().valid('Residential Rent', 'Residential Sell', 'Commercial Rent', 'Commercial Sell').allow(''),
  // propertyCategory is now multiselect — accept array or single string
  propertyCategory: Joi.alternatives().try(
    Joi.array().items(Joi.string().allow('')),
    Joi.string().allow('')
  ),
  propertyCondition: Joi.string().allow(''),
  preferredLocation: Joi.string().allow('').trim(),
  landmark: Joi.string().allow(''),
  leadStatus: Joi.string().valid('New', 'Attempted 1', 'Attempted 2', 'Attempted 3', 'Follow-up', 'unqualified', 'warm', 'hot', 'site visit planned', 'site visit done', 'booked', 'booed someware else').default('New'),
  assignedTo: Joi.string().required(),
  remarks: Joi.string().allow('').trim(),
  nextCallDate: Joi.date().allow('', null),
  purposeOfBuying: Joi.string().valid('Personal Use', 'Investment', 'Second Home', 'Gift').allow(''),
  propertyPreference: Joi.string().valid('New', 'Resell').allow(''),
  ageOfProperty: Joi.string().valid('Under Construction', '01-05', '5-10', '11-15', '15-25', '25+').allow(''),
  timelineToBuy: Joi.string().valid('0-15 days', '15-25 days', '25-30 days', '30-60 days', '90+ days').allow('')
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }
    next();
  };
};

module.exports = {
  validate,
  loginSchema,
  propertyTypeSchema,
  propertyConditionSchema,
  landmarkSchema,
  leadSchema
};
