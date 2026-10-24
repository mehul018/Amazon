/**
 * Order Controller
 * Handles Order listing, filtering, status updates and deletion
 */
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * @desc    Get all orders (with status filter, search and seller isolation)
 * @route   GET /api/orders
 * @access  Private (Seller sees own orders, Admin sees all/filtered)
 */
const getOrders = async (req, res) => {
  try {
    const { status, search, sellerId } = req.query;

    const conditions = [];

    // Seller isolation:
    // If the logged-in user is a seller, they can ONLY access orders placed for their products
    if (req.user && req.user.role === 'seller') {
      conditions.push({ seller: req.user._id });
    } else if (sellerId) {
      // Platform Admin can optionally filter orders by a specific seller
      conditions.push({ seller: sellerId });
    }

    if (status && status !== 'All') {
      conditions.push({ status });
    }

    if (search) {
      conditions.push({
        $or: [
          { orderId: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
          { customerEmail: { $regex: search, $options: 'i' } },
          { product: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    const orders = await Order.find(query)
      .populate('customerId', 'name email phone city address')
      .populate('productId', 'name price stock category image')
      .populate('seller', 'name email storeName')
      .sort({ orderDate: -1 });

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
 * @access  Private (Seller can only view own order)
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone city address')
      .populate('productId', 'name price stock category image description')
      .populate('seller', 'name email storeName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization: seller can only view orders belonging to their store
    if (req.user && req.user.role === 'seller') {
      const orderSellerId = order.seller ? (order.seller._id || order.seller).toString() : null;
      if (orderSellerId && orderSellerId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You cannot view orders belonging to other sellers'
        });
      }
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
      customerId,
      customerName,
      customerEmail,
      product,
      productId,
      quantity,
      totalAmount,
      status,
      shippingAddress,
      paymentMethod,
      sellerId,
      sellerName,
      shippingStatus
    } = req.body;

    const orderQty = quantity ? Math.max(1, Number(quantity)) : 1;

    // Helper: Valid ObjectId checker
    const isValidObjectId = (id) =>
      id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);

    // 1. Check and Link Product inventory
    let linkedProduct = null;
    if (isValidObjectId(productId)) {
      linkedProduct = await Product.findById(productId);
    } else if (product && typeof product === 'string' && product.trim()) {
      linkedProduct = await Product.findOne({
        name: { $regex: new RegExp(`^${product.trim()}$`, 'i') }
      });
    }

    const finalProductName = linkedProduct ? linkedProduct.name : (product ? product.trim() : null);

    if (!finalProductName || totalAmount === undefined || totalAmount === null || totalAmount === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide product name and total amount'
      });
    }

    if (linkedProduct) {
      // Validate stock availability
      if (linkedProduct.stock < orderQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${linkedProduct.name}". Available: ${linkedProduct.stock}, requested: ${orderQty}`
        });
      }
      // Deduct stock and increment salesCount
      linkedProduct.stock = Math.max(0, linkedProduct.stock - orderQty);
      linkedProduct.salesCount = (linkedProduct.salesCount || 0) + orderQty;
      await linkedProduct.save();
    }

    // 2. Resolve Seller of this Order
    let finalSellerId = null;
    let finalSellerName = 'Amazon Seller Store';

    if (req.user && req.user.role === 'seller') {
      finalSellerId = req.user._id;
      finalSellerName = req.user.storeName || req.user.name || 'Amazon Seller Store';
      // If linked product had no seller set, claim it for this seller
      if (linkedProduct && !linkedProduct.seller) {
        linkedProduct.seller = finalSellerId;
        linkedProduct.sellerName = finalSellerName;
        await linkedProduct.save();
      }
    } else if (linkedProduct && linkedProduct.seller) {
      finalSellerId = linkedProduct.seller;
      finalSellerName = linkedProduct.sellerName || 'Amazon Seller Store';
    } else if (isValidObjectId(sellerId)) {
      finalSellerId = sellerId;
      finalSellerName = sellerName || 'Amazon Seller Store';
    } else {
      const defaultSeller = await User.findOne({ role: 'seller' });
      if (defaultSeller) {
        finalSellerId = defaultSeller._id;
        finalSellerName = defaultSeller.storeName || defaultSeller.name || 'Amazon Seller Store';
      }
    }

    // 3. Resolve Customer - Find or Auto-Create so order is never blocked!
    let linkedCustomer = null;
    if (isValidObjectId(customerId)) {
      linkedCustomer = await Customer.findById(customerId);
    }
    if (!linkedCustomer && customerEmail && customerEmail.trim()) {
      linkedCustomer = await Customer.findOne({ email: customerEmail.toLowerCase().trim() });
    }
    if (!linkedCustomer && customerName && customerName.trim()) {
      linkedCustomer = await Customer.findOne({ name: { $regex: new RegExp(`^${customerName.trim()}$`, 'i') } });
    }

    // Auto-create customer record if not found yet
    if (!linkedCustomer && (customerEmail || customerName)) {
      try {
        const cleanEmail = customerEmail && customerEmail.trim()
          ? customerEmail.toLowerCase().trim()
          : `customer_${Date.now()}@example.com`;
        const cleanName = customerName && customerName.trim() ? customerName.trim() : 'Valued Customer';
        
        linkedCustomer = await Customer.findOne({ email: cleanEmail });
        if (!linkedCustomer) {
          linkedCustomer = await Customer.create({
            name: cleanName,
            email: cleanEmail,
            phone: req.body.customerPhone || req.body.phone || '9876543210',
            address: shippingAddress || '742 Evergreen Terrace',
            city: req.body.city || 'Seattle'
          });
        }
      } catch (custErr) {
        console.warn('Customer auto-create warning:', custErr.message);
      }
    }

    const finalCustomerName = linkedCustomer
      ? linkedCustomer.name
      : (customerName && customerName.trim() ? customerName.trim() : 'Valued Customer');
    const finalCustomerEmail = linkedCustomer
      ? linkedCustomer.email
      : (customerEmail && customerEmail.trim() ? customerEmail.trim() : 'customer@example.com');
    const finalAddress = shippingAddress || (linkedCustomer && linkedCustomer.address) || '221B Baker Street, London, UK';

    // Status normalization helper
    const normalizeStatus = (val, validList, defaultVal) => {
      if (!val) return defaultVal;
      const match = validList.find((s) => s.toLowerCase() === val.toString().toLowerCase().trim());
      return match || defaultVal;
    };

    const finalStatus = normalizeStatus(
      status,
      ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      'Pending'
    );
    const finalShippingStatus = normalizeStatus(
      shippingStatus,
      ['Pending', 'Shipped', 'Delivered'],
      'Pending'
    );

    // Auto-generate Order ID if not provided
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const finalOrderId = (req.body.orderId && req.body.orderId.trim()) || `AMZ-${Date.now().toString().slice(-6)}-${randomNum}`;

    const orderData = {
      orderId: finalOrderId,
      customerName: finalCustomerName,
      customerEmail: finalCustomerEmail,
      sellerName: finalSellerName,
      product: finalProductName,
      quantity: orderQty,
      totalAmount: Number(totalAmount),
      status: finalStatus,
      shippingAddress: finalAddress,
      paymentMethod: paymentMethod || 'Credit Card',
      shippingStatus: finalShippingStatus
    };

    if (linkedCustomer && linkedCustomer._id) {
      orderData.customerId = linkedCustomer._id;
    }
    if (finalSellerId && isValidObjectId(finalSellerId)) {
      orderData.seller = finalSellerId;
    }
    if (linkedProduct && linkedProduct._id) {
      orderData.productId = linkedProduct._id;
    } else if (isValidObjectId(productId)) {
      orderData.productId = productId;
    }

    const order = new Order(orderData);
    const createdOrder = await order.save();

    // 4. Automatically update customer statistics if linked
    if (linkedCustomer) {
      linkedCustomer.totalOrders = (linkedCustomer.totalOrders || 0) + 1;
      if (finalStatus !== 'Cancelled') {
        linkedCustomer.totalSpending = (linkedCustomer.totalSpending || 0) + Number(totalAmount);
      }
      await linkedCustomer.save();
    }

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
 * @access  Private (Seller can only update own order)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status, shippingStatus } = req.body;

    if (!status && !shippingStatus) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status or shippingStatus to update'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization: seller can only update orders belonging to their store
    if (req.user && req.user.role === 'seller') {
      const orderSellerId = order.seller ? order.seller.toString() : null;
      if (orderSellerId && orderSellerId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You cannot update status of orders belonging to other sellers'
        });
      }
    }

    const previousStatus = order.status;

    // Helper: normalize
    const normalizeStatus = (val, validList) => {
      if (!val) return null;
      return validList.find((s) => s.toLowerCase() === val.toString().toLowerCase().trim()) || null;
    };

    if (status) {
      const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
      const matched = normalizeStatus(status, validStatuses);
      if (!matched) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
        });
      }
      order.status = matched;
    }

    if (shippingStatus) {
      const validShipping = ['Pending', 'Shipped', 'Delivered'];
      const matchedShipping = normalizeStatus(shippingStatus, validShipping);
      if (!matchedShipping) {
        return res.status(400).json({
          success: false,
          message: `Invalid shippingStatus. Valid values: ${validShipping.join(', ')}`
        });
      }
      order.shippingStatus = matchedShipping;
    }

    const updatedOrder = await order.save();

    // 1. Adjust customer spending if status changed to/from Cancelled
    if (status && order.customerId) {
      const linkedCustomer = await Customer.findById(order.customerId);
      if (linkedCustomer) {
        if (previousStatus !== 'Cancelled' && order.status === 'Cancelled') {
          linkedCustomer.totalSpending = Math.max(0, (linkedCustomer.totalSpending || 0) - order.totalAmount);
          await linkedCustomer.save();
        } else if (previousStatus === 'Cancelled' && order.status !== 'Cancelled') {
          linkedCustomer.totalSpending = (linkedCustomer.totalSpending || 0) + order.totalAmount;
          await linkedCustomer.save();
        }
      }
    }

    // 2. Adjust linked product stock if status changed to/from Cancelled
    if (status) {
      let linkedProduct = null;
      if (order.productId) {
        linkedProduct = await Product.findById(order.productId);
      } else if (order.product) {
        linkedProduct = await Product.findOne({
          name: { $regex: new RegExp(`^${order.product.trim()}$`, 'i') }
        });
      }

      if (linkedProduct) {
        const qty = Number(order.quantity || 1);
        if (previousStatus !== 'Cancelled' && order.status === 'Cancelled') {
          linkedProduct.stock = (linkedProduct.stock || 0) + qty;
          linkedProduct.salesCount = Math.max(0, (linkedProduct.salesCount || 0) - qty);
          await linkedProduct.save();
        } else if (previousStatus === 'Cancelled' && order.status !== 'Cancelled') {
          linkedProduct.stock = Math.max(0, (linkedProduct.stock || 0) - qty);
          linkedProduct.salesCount = (linkedProduct.salesCount || 0) + qty;
          await linkedProduct.save();
        }
      }
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
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
 * @access  Private (Seller can only delete own order)
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

    // Authorization: seller can only delete/cancel orders belonging to their store
    if (req.user && req.user.role === 'seller') {
      const orderSellerId = order.seller ? order.seller.toString() : null;
      if (orderSellerId && orderSellerId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You cannot delete orders belonging to other sellers'
        });
      }
    }

    // 1. Adjust customer statistics on deletion
    let linkedCustomer = null;
    if (order.customerId) {
      linkedCustomer = await Customer.findById(order.customerId);
    } else if (order.customerEmail) {
      linkedCustomer = await Customer.findOne({ email: order.customerEmail.toLowerCase().trim() });
    }

    if (linkedCustomer) {
      linkedCustomer.totalOrders = Math.max(0, (linkedCustomer.totalOrders || 0) - 1);
      if (order.status !== 'Cancelled') {
        linkedCustomer.totalSpending = Math.max(0, (linkedCustomer.totalSpending || 0) - order.totalAmount);
      }
      await linkedCustomer.save();
    }

    // 2. Restore product stock on deletion if order was active
    if (order.status !== 'Cancelled') {
      let linkedProduct = null;
      if (order.productId) {
        linkedProduct = await Product.findById(order.productId);
      } else if (order.product) {
        linkedProduct = await Product.findOne({
          name: { $regex: new RegExp(`^${order.product.trim()}$`, 'i') }
        });
      }

      if (linkedProduct) {
        const qty = Number(order.quantity || 1);
        linkedProduct.stock = (linkedProduct.stock || 0) + qty;
        linkedProduct.salesCount = Math.max(0, (linkedProduct.salesCount || 0) - qty);
        await linkedProduct.save();
      }
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
