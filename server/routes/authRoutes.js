/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const { loginUser, getSellerProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/login - Authenticate seller & get token
router.post('/login', loginUser);

// GET /api/auth/profile - Get profile of logged-in seller
router.get('/profile', protect, getSellerProfile);

module.exports = router;
