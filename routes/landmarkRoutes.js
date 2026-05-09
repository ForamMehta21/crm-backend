const express = require('express');
const router = express.Router();
const {
  getLandmarks,
  getLandmarkById,
  createLandmark,
  updateLandmark,
  deleteLandmark
} = require('../controllers/landmarkController');
const { protect, adminOnly, allowBoth } = require('../middleware/auth');
const { validate, landmarkSchema } = require('../utils/validation');

router.route('/')
  .get(protect, allowBoth, getLandmarks)
  .post(protect, adminOnly, validate(landmarkSchema), createLandmark);

router.route('/:id')
  .get(protect, allowBoth, getLandmarkById)
  .put(protect, adminOnly, validate(landmarkSchema), updateLandmark)
  .delete(protect, adminOnly, deleteLandmark);

module.exports = router;
