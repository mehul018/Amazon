/**
 * Order Routes
 */
const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');

const { protect, verifiedSellerOnly } = require('../middleware/authMiddleware');

// All order endpoints require authentication
router.use(protect);

// GET /api/orders - Get orders (filtered by seller for sellers, all/filtered for admin)
// POST /api/orders - Create an order (Verified Seller Only)
router.route('/')
  .get(getOrders)
  .post(verifiedSellerOnly, createOrder);

// GET /api/orders/:id - Get order details
// PUT /api/orders/:id - Update order status (Verified Seller Only)
// DELETE /api/orders/:id - Delete order (Verified Seller Only)
router.route('/:id')
  .get(getOrderById)
  .put(verifiedSellerOnly, updateOrderStatus)
  .delete(verifiedSellerOnly, deleteOrder);

module.exports = router;
