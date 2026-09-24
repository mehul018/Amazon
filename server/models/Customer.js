/**
 * Customer Model
 */
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter customer name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please enter customer email'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please enter phone number'],
      trim: true
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    totalSpending: {
      type: Number,
      default: 0
    },
    city: {
      type: String,
      default: 'New York'
    },
    address: {
      type: String,
      default: '742 Evergreen Terrace'
    }
  },
  {
    timestamps: true
  }
);

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
