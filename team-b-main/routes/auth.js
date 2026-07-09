const express = require('express');
const { login, register, getCurrentAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', protect, getCurrentAdmin);

module.exports = router;

