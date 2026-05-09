const express = require('express');
const router = express.Router();
const { login, getProfile } = require('../controllers/authController');
const { protect, allowBoth } = require('../middleware/auth');
const { validate, loginSchema } = require('../utils/validation');

router.post('/login', validate(loginSchema), login);
router.get('/profile', protect, allowBoth, getProfile);

module.exports = router;
