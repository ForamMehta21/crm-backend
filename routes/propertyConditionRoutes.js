const express = require('express');
const router = express.Router();
const {
  getPropertyConditions,
  getPropertyConditionById,
  createPropertyCondition,
  updatePropertyCondition,
  deletePropertyCondition
} = require('../controllers/propertyConditionController');
const { protect, adminOnly, allowBoth } = require('../middleware/auth');
const { validate, propertyConditionSchema } = require('../utils/validation');

router.route('/')
  .get(protect, allowBoth, getPropertyConditions)
  .post(protect, adminOnly, validate(propertyConditionSchema), createPropertyCondition);

router.route('/:id')
  .get(protect, allowBoth, getPropertyConditionById)
  .put(protect, adminOnly, validate(propertyConditionSchema), updatePropertyCondition)
  .delete(protect, adminOnly, deletePropertyCondition);

module.exports = router;
