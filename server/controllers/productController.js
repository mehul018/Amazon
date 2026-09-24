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
    const { search, category, sort, sellerId, all } = req.query;

    const conditions = [];

    // Filter by seller if specified or if logged in as seller (unless all=true requested)
    if (sellerId) {
      conditions.push({ seller: sellerId });
    } else if (req.user && req.user.role === 'seller' && all !== 'true') {
      conditions.push({ seller: req.user._id });
    }

    // Search by product name or description
    if (search) {
      conditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Filter by category
    if (category && category !== 'All') {
      conditions.push({ category });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

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
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Platform Admins cannot add products. Admins only manage sellers.'
      });
    }

    const {
      name,
      image,
      category,
      brand,
      sku,
      price,
      originalPrice,
      discount,
      stock,
      description,
      specifications,
      warranty,
      tags,
      rating
    } = req.body;

    // Simple validation
    if (!name || !category || price === undefined || stock === undefined || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields: name, category, price, stock, description'
      });
    }

    // Process tags (if string, split by comma)
    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string' && tags.trim()) {
      processedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    // Auto-compute discount if originalPrice is provided
    const numPrice = Number(price);
    const numOriginal = originalPrice ? Number(originalPrice) : 0;
    let computedDiscount = discount ? Number(discount) : 0;
    if (numOriginal > numPrice && !discount) {
      computedDiscount = Math.round(((numOriginal - numPrice) / numOriginal) * 100);
    }

    // Generate SKU if not provided
    const cleanCategoryCode = category.slice(0, 3).toUpperCase();
    const generatedSku = sku?.trim() || `AMZ-${cleanCategoryCode}-${Math.floor(1000 + Math.random() * 9000)}`;

    const product = new Product({
      name,
      image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
      category,
      brand: brand?.trim() || 'Generic',
      sku: generatedSku,
      price: numPrice,
      originalPrice: numOriginal,
      discount: computedDiscount,
      stock: Number(stock),
      description,
      specifications: specifications?.trim() || '',
      warranty: warranty?.trim() || '1 Year Manufacturer Warranty',
      tags: processedTags,
      rating: rating ? Number(rating) : 4.5,
      seller: req.user ? req.user._id : undefined,
      sellerName: req.user ? (req.user.storeName || req.user.name) : 'Amazon Seller Store'
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
    const {
      name,
      image,
      category,
      brand,
      sku,
      price,
      originalPrice,
      discount,
      stock,
      description,
      specifications,
      warranty,
      tags,
      rating
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Role check: Admin cannot modify products
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Platform Admins cannot modify products. Admins only manage sellers.'
      });
    }

    // Seller ownership check
    if (req.user && req.user.role === 'seller') {
      if (product.seller && product.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You cannot modify products belonging to another seller.'
        });
      }
    }

    // Process tags
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        product.tags = tags.map((t) => String(t).trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        product.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    // Update fields if provided
    product.name = name !== undefined ? name : product.name;
    product.image = image !== undefined ? image : product.image;
    product.category = category !== undefined ? category : product.category;
    product.brand = brand !== undefined ? brand : product.brand;
    product.sku = sku !== undefined ? sku : product.sku;
    product.price = price !== undefined ? Number(price) : product.price;
    product.originalPrice = originalPrice !== undefined ? Number(originalPrice) : product.originalPrice;
    product.discount = discount !== undefined ? Number(discount) : product.discount;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.description = description !== undefined ? description : product.description;
    product.specifications = specifications !== undefined ? specifications : product.specifications;
    product.warranty = warranty !== undefined ? warranty : product.warranty;
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

    // Role check: Admin cannot delete products
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Platform Admins cannot delete products. Admins only manage sellers.'
      });
    }

    // Seller ownership check
    if (req.user && req.user.role === 'seller') {
      if (product.seller && product.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You cannot delete products belonging to another seller.'
        });
      }
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
