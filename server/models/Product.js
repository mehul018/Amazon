/**
 * Product Model
 */
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter product name'],
      trim: true
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true
    },
    brand: {
      type: String,
      trim: true,
      default: 'Generic'
    },
    sku: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Please enter product price'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
      default: 0
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0
    },
    stock: {
      type: Number,
      required: [true, 'Please enter stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    description: {
      type: String,
      required: [true, 'Please enter product description'],
      trim: true
    },
    specifications: {
      type: String,
      trim: true,
      default: ''
    },
    warranty: {
      type: String,
      trim: true,
      default: '1 Year Manufacturer Warranty'
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sellerName: {
      type: String,
      trim: true,
      default: 'Amazon Seller Store'
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5']
    },
    salesCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model('Product', productSchema);
module.exports = Product;












