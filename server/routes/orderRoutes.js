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

// GET /api/orders - Get orders (supports ?status=&search=)
// POST /api/orders - Create an order
router.route('/')
  .get(getOrders)
  .post(createOrder);

// GET /api/orders/:id - Get order details
// PUT /api/orders/:id - Update order status
// DELETE /api/orders/:id - Delete order
router.route('/:id')
  .get(getOrderById)
  .put(updateOrderStatus)
  .delete(deleteOrder);

module.exports = router;
