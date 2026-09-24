/**
 * Sales Routes
 */
const express = require('express');
const router = express.Router();
const { getSalesSummary } = require('../controllers/salesController');

// GET /api/sales/summary - Get complete dashboard & sales metrics
router.get('/summary', getSalesSummary);

module.exports = router;
