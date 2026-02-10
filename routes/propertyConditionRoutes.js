const express = require('express');
const router = express.Router();
const {
  getPropertyConditions,
  getPropertyConditionById,
  createPropertyCondition,
  updatePropertyCondition,
  deletePropertyCondition
} = require('../controllers/propertyConditionController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate, propertyConditionSchema } = require('../utils/validation');

router.route('/')
  .get(protect, adminOnly, getPropertyConditions)
  .post(protect, adminOnly, validate(propertyConditionSchema), createPropertyCondition);

router.route('/:id')
  .get(protect, adminOnly, getPropertyConditionById)
  .put(protect, adminOnly, validate(propertyConditionSchema), updatePropertyCondition)
  .delete(protect, adminOnly, deletePropertyCondition);

module.exports = router;
