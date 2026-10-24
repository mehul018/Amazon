/**
 * Order Model
 */
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: false
    },
    product: {
      type: String,
      required: [true, 'Product name is required']
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    sellerName: {
      type: String,
      trim: true,
      default: 'Amazon Seller Store'
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    shippingAddress: {
      type: String,
      default: '221B Baker Street, London, UK'
    },
    paymentMethod: {
      type: String,
      default: 'Credit Card'
    },
    shippingStatus: { 
      type: String, 
      enum: ['Pending', 'Shipped', 'Delivered'], 
      default: 'Pending' 
    }
  },
  {
    timestamps: true
  }
);

// Pre-validate middleware: normalize status case & auto-generate orderId
orderSchema.pre('validate', function (next) {
  if (!this.orderId) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.orderId = `AMZ-${Date.now().toString().slice(-6)}-${randomNum}`;
  }
  if (this.status) {
    const s = this.status.toString().toLowerCase().trim();
    const map = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    if (map[s]) this.status = map[s];
  }
  if (this.shippingStatus) {
    const ss = this.shippingStatus.toString().toLowerCase().trim();
    const map = {
      pending: 'Pending',
      shipped: 'Shipped',
      delivered: 'Delivered'
    };
    if (map[ss]) this.shippingStatus = map[ss];
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
