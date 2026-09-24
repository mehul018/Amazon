/**
 * Product Routes
 */
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, optionalAuth, verifiedSellerOnly } = require('../middleware/authMiddleware');

// GET /api/products - Get all products (supports ?search=&category=&sellerId=)
// POST /api/products - Create new product (Protected: Verified Seller or Admin only)
router.route('/')
  .get(optionalAuth, getProducts)
  .post(protect, verifiedSellerOnly, createProduct);

// GET /api/products/:id - Get product details
// PUT /api/products/:id - Update product (Verified Seller Only)
// DELETE /api/products/:id - Delete product (Verified Seller Only)
router.route('/:id')
  .get(getProductById)
  .put(protect, verifiedSellerOnly, updateProduct)
  .delete(protect, verifiedSellerOnly, deleteProduct);

module.exports = router;
