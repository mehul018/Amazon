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

// GET /api/orders - Get orders
// POST /api/orders - Create an order
router.route('/')
  .get(getOrders)
  .post(createOrder);

// GET /api/orders/:id - Get order details
// PUT /api/orders/:id - Update order
// DELETE /api/orders/:id - Delete order
router.route('/:id')
  .get(getOrderById)
  .put(updateOrderStatus)
  .patch(updateOrderStatus)
  .delete(deleteOrder);

module.exports = router;