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

// GET /api/products - Get all products (supports ?search=&category=)
// POST /api/products - Create new product
router.route('/')
  .get(getProducts)
  .post(createProduct);

// GET /api/products/:id - Get product details
// PUT /api/products/:id - Update product
// DELETE /api/products/:id - Delete product
router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
