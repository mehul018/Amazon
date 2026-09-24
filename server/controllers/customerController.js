/**
 * Customer Controller
 * Handles customer listing, details and search
 */
const Customer = require('../models/Customer');
const Order = require('../models/Order');

/**
 * @desc    Get all customers (with search)
 * @route   GET /api/customers
 * @access  Public / Private
 */
const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query).sort({ totalSpending: -1 });

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Get Customers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
};

/**
 * @desc    Get single customer by ID
 * @route   GET /api/customers/:id
 * @access  Public / Private
 */
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Also fetch orders matching this customer's email or name
    const customerOrders = await Order.find({
      $or: [
        { customerEmail: customer.email },
        { customerName: customer.name }
      ]
    }).sort({ orderDate: -1 });

    res.json({
      success: true,
      data: {
        customer,
        orders: customerOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details',
      error: error.message
    });
  }
};

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 * @access  Public / Private
 */
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, city, address } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and phone are required'
      });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }

    const customer = new Customer({
      name,
      email: email.toLowerCase(),
      phone,
      city: city || 'New York',
      address: address || '123 Main St'
    });

    const saved = await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      data: saved
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer
};
