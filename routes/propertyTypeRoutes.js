const express = require('express');
const router = express.Router();
const {
  getPropertyTypes,
  getPropertyTypeById,
  createPropertyType,
  updatePropertyType,
  deletePropertyType
} = require('../controllers/propertyTypeController');
const { protect, adminOnly, allowBoth } = require('../middleware/auth');
const { validate, propertyTypeSchema } = require('../utils/validation');

router.route('/')
  .get(protect, allowBoth, getPropertyTypes)
  .post(protect, adminOnly, validate(propertyTypeSchema), createPropertyType);

router.route('/:id')
  .get(protect, allowBoth, getPropertyTypeById)
  .put(protect, adminOnly, validate(propertyTypeSchema), updatePropertyType)
  .delete(protect, adminOnly, deletePropertyType);

module.exports = router;
