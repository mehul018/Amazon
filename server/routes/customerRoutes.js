/**
 * Customer Routes
 */
const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { protect, optionalAuth, verifiedSellerOnly } = require('../middleware/authMiddleware');

// GET /api/customers - Get customer list (supports ?search=)
// POST /api/customers - Create new customer (Verified Seller Only)
router.route('/')
  .get(optionalAuth, getCustomers)
  .post(protect, verifiedSellerOnly, createCustomer);

// GET /api/customers/:id - Get single customer details with order history
// DELETE /api/customers/:id - Delete customer and unlink past orders (Verified Seller Only)
router.route('/:id')
  .get(optionalAuth, getCustomerById)
  .delete(protect, verifiedSellerOnly, deleteCustomer);

module.exports = router;
