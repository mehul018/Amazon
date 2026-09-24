/**
 * Admin Routes
 * Protected routes for Platform Admin to manage sellers and verification
 */
const express = require('express');
const router = express.Router();
const {
  getAllSellers,
  updateSellerVerification,
  getAdminStats,
  deleteSeller
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes require valid JWT and role: 'admin'
router.use(protect, adminOnly);

// GET /api/admin/sellers - List all sellers (supports ?status=verified|unverified&search=)
router.get('/sellers', getAllSellers);

// PUT /api/admin/sellers/:id/verification - Verify or Unverify a seller
router.put('/sellers/:id/verification', updateSellerVerification);

// GET /api/admin/stats - Overview stats for platform
router.get('/stats', getAdminStats);

// DELETE /api/admin/sellers/:id - Remove seller
router.delete('/sellers/:id', deleteSeller);

module.exports = router;
