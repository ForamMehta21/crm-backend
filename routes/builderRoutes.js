const express = require('express');
const router = express.Router();
const {
  getBuilders,
  getBuilder,
  createBuilder,
  updateBuilder,
  deleteBuilder
} = require('../controllers/builderController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const Joi = require('joi');

const builderSchema = Joi.object({
  name: Joi.string().required().trim(),
  number: Joi.string().required().trim(),
  companyName: Joi.string().required().trim(),
  runningProjects: Joi.array().items(Joi.string().trim()),
  upcomingProjects: Joi.array().items(Joi.string().trim()),
  completedProjects: Joi.array().items(Joi.string().trim()),
  remarks: Joi.string().allow('').trim()
});

router.route('/')
  .get(protect, getBuilders)
  .post(protect, adminOnly, validate(builderSchema), createBuilder);

router.route('/:id')
  .get(protect, getBuilder)
  .put(protect, adminOnly, validate(builderSchema), updateBuilder)
  .delete(protect, adminOnly, deleteBuilder);

module.exports = router;
