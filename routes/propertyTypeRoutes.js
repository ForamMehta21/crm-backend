const express = require('express');
const router = express.Router();
const {
  getPropertyTypes,
  getPropertyTypeById,
  createPropertyType,
  updatePropertyType,
  deletePropertyType
} = require('../controllers/propertyTypeController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate, propertyTypeSchema } = require('../utils/validation');

router.route('/')
  .get(protect, adminOnly, getPropertyTypes)
  .post(protect, adminOnly, validate(propertyTypeSchema), createPropertyType);

router.route('/:id')
  .get(protect, adminOnly, getPropertyTypeById)
  .put(protect, adminOnly, validate(propertyTypeSchema), updatePropertyType)
  .delete(protect, adminOnly, deletePropertyType);

module.exports = router;
