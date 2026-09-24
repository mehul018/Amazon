/**
 * Sales Routes
 */
const express = require('express');
const router = express.Router();
const { getSalesSummary } = require('../controllers/salesController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/sales/summary - Get complete dashboard & sales metrics (seller-isolated)
router.get('/summary', protect, getSalesSummary);

module.exports = router;
