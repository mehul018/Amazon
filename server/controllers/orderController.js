/**
 * Order Controller
 * Handles Order listing, filtering, status updates and deletion
 */
const Order = require('../models/Order');

/**
 * @desc    Get all orders (with status filter and search)
 * @route   GET /api/orders
 * @access  Public / Private
 */
const getOrders = async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { product: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query).sort({ orderDate: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Public / Private
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new order (for testing/demo)
 * @route   POST /api/orders
 * @access  Public / Private
 */
const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      product,
      quantity,
      totalAmount,
      status,
      shippingAddress,
      paymentMethod
    } = req.body;

    if (!customerName || !product || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer name, product and total amount'
      });
    }

    // Auto-generate Order ID if not provided
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = req.body.orderId || `AMZ-${Date.now().toString().slice(-4)}-${randomNum}`;

    const order = new Order({
      orderId,
      customerName,
      customerEmail: customerEmail || 'customer@example.com',
      product,
      quantity: quantity ? Number(quantity) : 1,
      totalAmount: Number(totalAmount),
      status: status || 'Pending',
      shippingAddress: shippingAddress || '100 Main Street, Seattle, WA',
      paymentMethod: paymentMethod || 'Credit Card'
    });

    const createdOrder = await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdOrder
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id
 * @access  Public / Private
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update Order Error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

/**
 * @desc    Delete or cancel an order
 * @route   DELETE /api/orders/:id
 * @access  Public / Private
 */
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
