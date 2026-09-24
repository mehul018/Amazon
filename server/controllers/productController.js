/**
 * Product Controller
 * Handles CRUD operations, search and category filtering for products
 */
const Product = require('../models/Product');

/**
 * @desc    Get all products (with optional search and category filter)
 * @route   GET /api/products
 * @access  Public / Private
 */
const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    let query = {};

    // Search by product name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Sort option
    let sortOption = { createdAt: -1 }; // default newest first
    if (sort === 'price-asc') sortOption = { price: 1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'sales') sortOption = { salesCount: -1 };

    const products = await Product.find(query).sort(sortOption);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public / Private
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product details',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private / Public
 */
const createProduct = async (req, res) => {
  try {
    const { name, image, category, price, stock, description, rating } = req.body;

    // Simple validation
    if (!name || !category || price === undefined || stock === undefined || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields: name, category, price, stock, description'
      });
    }

    const product = new Product({
      name,
      image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
      category,
      price: Number(price),
      stock: Number(stock),
      description,
      rating: rating ? Number(rating) : 4.5
    });

    const createdProduct = await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: createdProduct
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Private / Public
 */
const updateProduct = async (req, res) => {
  try {
    const { name, image, category, price, stock, description, rating } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update fields if provided
    product.name = name !== undefined ? name : product.name;
    product.image = image !== undefined ? image : product.image;
    product.category = category !== undefined ? category : product.category;
    product.price = price !== undefined ? Number(price) : product.price;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.description = description !== undefined ? description : product.description;
    product.rating = rating !== undefined ? Number(rating) : product.rating;

    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private / Public
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
