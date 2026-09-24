/**
 * Order Controller
 * Handles Order listing, filtering, status updates and deletion
 */
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
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Platform Admins cannot place orders. Admins only manage sellers.'
      });
    }

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
      sellerName
    } = req.body;

    const orderQty = quantity ? Math.max(1, Number(quantity)) : 1;

    // 1. Check and Link Product inventory
    let linkedProduct = null;
    if (productId) {
      linkedProduct = await Product.findById(productId);
    } else if (product) {
      linkedProduct = await Product.findOne({
        name: { $regex: new RegExp(`^${product.trim()}$`, 'i') }
      });
    }

    const finalProductName = linkedProduct ? linkedProduct.name : product;

    if (!finalProductName || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product and total amount'
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
    // If logged in as a seller, ONLY products from their store can be ordered
    let finalSellerId = null;
    let finalSellerName = 'Amazon Seller Store';

    if (req.user && req.user.role === 'seller') {
      // Security check: if product belongs to another seller, reject!
      if (linkedProduct && linkedProduct.seller && linkedProduct.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only place orders for products belonging to your store.'
        });
      }
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
    } else if (sellerId) {
      finalSellerId = sellerId;
      finalSellerName = sellerName || 'Amazon Seller Store';
    } else if (linkedProduct && !linkedProduct.seller) {
      const matchedSeller = await User.findOne({ storeName: linkedProduct.sellerName });
      if (matchedSeller) {
        finalSellerId = matchedSeller._id;
        finalSellerName = matchedSeller.storeName;
      } else {
        const defaultSeller = await User.findOne({ email: 'seller@amazon.com' });
        if (defaultSeller) {
          finalSellerId = defaultSeller._id;
          finalSellerName = defaultSeller.storeName;
        }
      }
      if (finalSellerId) {
        linkedProduct.seller = finalSellerId;
        linkedProduct.sellerName = finalSellerName;
        await linkedProduct.save();
      }
    } else {
      const defaultSeller = await User.findOne({ email: 'seller@amazon.com' });
      if (defaultSeller) {
        finalSellerId = defaultSeller._id;
        finalSellerName = defaultSeller.storeName;
      }
    }

    // 3. Validate and Link Registered Customer (Required)
    let linkedCustomer = null;
    if (customerId) {
      linkedCustomer = await Customer.findById(customerId);
    } else if (customerEmail) {
      linkedCustomer = await Customer.findOne({ email: customerEmail.toLowerCase().trim() });
    }

    if (!linkedCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Only registered customers can place orders. Please select or register a customer first in Customer Database.'
      });
    }

    const finalCustomerName = linkedCustomer.name;
    const finalCustomerEmail = linkedCustomer.email;
    const finalAddress = shippingAddress || linkedCustomer.address || (linkedCustomer.city ? `${linkedCustomer.city}` : 'Seattle, WA');

    // Auto-generate Order ID if not provided
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = req.body.orderId || `AMZ-${Date.now().toString().slice(-4)}-${randomNum}`;

    const order = new Order({
      orderId,
      customerId: linkedCustomer ? linkedCustomer._id : null,
      customerName: finalCustomerName,
      customerEmail: finalCustomerEmail,
      seller: finalSellerId,
      sellerName: finalSellerName,
      product: finalProductName,
      productId: linkedProduct ? linkedProduct._id : (productId || undefined),
      quantity: orderQty,
      totalAmount: Number(totalAmount),
      status: status || 'Pending',
      shippingAddress: finalAddress,
      paymentMethod: paymentMethod || 'Credit Card'
    });

    const createdOrder = await order.save();

    // 4. Automatically update customer statistics if linked
    if (linkedCustomer) {
      linkedCustomer.totalOrders = (linkedCustomer.totalOrders || 0) + 1;
      if (order.status !== 'Cancelled') {
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
    order.status = status;
    const updatedOrder = await order.save();

    // 1. Adjust linked customer lifetime spending if cancellation status changes
    let linkedCustomer = null;
    if (order.customerId) {
      linkedCustomer = await Customer.findById(order.customerId);
    } else if (order.customerEmail) {
      linkedCustomer = await Customer.findOne({ email: order.customerEmail.toLowerCase().trim() });
    }

    if (linkedCustomer) {
      if (previousStatus !== 'Cancelled' && status === 'Cancelled') {
        // Order was cancelled: deduct spending
        linkedCustomer.totalSpending = Math.max(0, (linkedCustomer.totalSpending || 0) - order.totalAmount);
        await linkedCustomer.save();
      } else if (previousStatus === 'Cancelled' && status !== 'Cancelled') {
        // Order was un-cancelled: re-add spending
        linkedCustomer.totalSpending = (linkedCustomer.totalSpending || 0) + order.totalAmount;
        await linkedCustomer.save();
      }
    }

    // 2. Adjust linked product stock and salesCount if cancellation status changes
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
      if (previousStatus !== 'Cancelled' && status === 'Cancelled') {
        // Order cancelled: restore stock to inventory and decrease salesCount
        linkedProduct.stock = (linkedProduct.stock || 0) + qty;
        linkedProduct.salesCount = Math.max(0, (linkedProduct.salesCount || 0) - qty);
        await linkedProduct.save();
      } else if (previousStatus === 'Cancelled' && status !== 'Cancelled') {
        // Order re-activated: deduct stock from inventory and increase salesCount
        linkedProduct.stock = Math.max(0, (linkedProduct.stock || 0) - qty);
        linkedProduct.salesCount = (linkedProduct.salesCount || 0) + qty;
        await linkedProduct.save();
      }
    }

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
