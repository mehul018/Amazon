/**
 * Customer Routes
 */
const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer
} = require('../controllers/customerController');

// GET /api/customers - Get customer list (supports ?search=)
// POST /api/customers - Create new customer
router.route('/')
  .get(getCustomers)
  .post(createCustomer);

// GET /api/customers/:id - Get single customer details with order history
router.route('/:id')
  .get(getCustomerById);

module.exports = router;
