/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const { loginUser, registerSeller, getSellerProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/login - Authenticate seller or admin & get token
router.post('/login', loginUser);

// POST /api/auth/register - Register new seller account
router.post('/register', registerSeller);

// GET /api/auth/profile - Get profile of logged-in seller/admin
router.get('/profile', protect, getSellerProfile);

module.exports = router;
