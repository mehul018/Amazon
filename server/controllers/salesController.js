/**
 * Sales & Analytics Controller
 * Calculates metrics for Dashboard and Sales pages
 */
const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

/**
 * @desc    Get complete sales and dashboard analytics summary
 * @route   GET /api/sales/summary
 * @access  Public / Private
 */
const getSalesSummary = async (req, res) => {
  try {
    const isSeller = req.user && req.user.role === 'seller';
    const sellerId = isSeller ? req.user._id : (req.query.sellerId || null);

    const orderFilter = sellerId ? { seller: sellerId } : {};
    const productFilter = sellerId ? { seller: sellerId } : {};

    // 1. Fetch counts
    const totalProducts = await Product.countDocuments(productFilter);
    const totalOrders = await Order.countDocuments(orderFilter);
    const completedOrders = await Order.countDocuments({ ...orderFilter, status: 'Delivered' });

    // Customer count: distinct customers for this seller, or all customers for platform admin
    let totalCustomers;
    if (sellerId) {
      const distinctCustomerIds = await Order.distinct('customerId', orderFilter);
      totalCustomers = distinctCustomerIds.filter(Boolean).length;
    } else {
      totalCustomers = await Customer.countDocuments();
    }

    // Dynamic fulfillment rate (% of total orders that are delivered)
    const fulfillmentRate = totalOrders > 0
      ? ((completedOrders / totalOrders) * 100).toFixed(1)
      : '0.0';

    // 2. Calculate Total Sales (excluding Cancelled orders)
    const validOrders = await Order.find({ ...orderFilter, status: { $ne: 'Cancelled' } });
    const totalSales = validOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // 3. Today's Sales Calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = validOrders.filter(
      (order) => new Date(order.orderDate) >= today
    );
    const todaySales = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // 4. Monthly Sales Calculation (current month)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyOrders = validOrders.filter(
      (order) => new Date(order.orderDate) >= startOfMonth
    );
    const monthlySales = monthlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // 5. Recent 5 Orders
    const recentOrders = await Order.find(orderFilter).sort({ orderDate: -1 }).limit(5);

    // 6. Top Selling Products (from Product salesCount and Orders)
    const topProducts = await Product.find(productFilter).sort({ salesCount: -1, rating: -1 }).limit(5);

    // 7. Calculate Monthly Sales Chart Data (Last 6-12 Months)
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // Group sales by month for chart
    const currentYear = new Date().getFullYear();
    const monthlyDataMap = {};
    months.forEach((m) => {
      monthlyDataMap[m] = { sales: 0, orders: 0 };
    });

    validOrders.forEach((order) => {
      if (order.orderDate) {
        const orderDate = new Date(order.orderDate);
        const monthIndex = orderDate.getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          const monthName = months[monthIndex];
          monthlyDataMap[monthName].sales += Number(order.totalAmount) || 0;
          monthlyDataMap[monthName].orders += 1;
        }
      }
    });

    // Display all 12 months (Jan - Dec) so any order placed in the current month or year is reflected
    const chartLabels = months;
    const chartSalesData = chartLabels.map((m) => Math.round((monthlyDataMap[m].sales || 0) * 100) / 100);
    const chartOrdersData = chartLabels.map((m) => monthlyDataMap[m].orders || 0);

    // 8. Category Breakdown
    const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Beauty'];
    const categoryData = categories.map((cat) => {
      return validOrders.filter((o) =>
        o.product && o.product.toLowerCase().includes(cat.toLowerCase().slice(0, 4))
      ).length;
    });

    // 9. Best selling product name
    const bestSeller = topProducts.length > 0 ? topProducts[0] : null;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        completedOrders,
        fulfillmentRate,
        totalSales: Math.round(totalSales * 100) / 100,
        totalCustomers,
        todaySales: Math.round(todaySales * 100) / 100,
        todayOrdersCount: todayOrders.length,
        monthlySales: Math.round(monthlySales * 100) / 100,
        monthlyOrdersCount: monthlyOrders.length,
        bestSellingProduct: bestSeller ? bestSeller.name : 'None',
        bestSeller,
        recentOrders,
        topProducts,
        chartData: {
          labels: chartLabels,
          sales: chartSalesData,
          orders: chartOrdersData
        },
        categoryBreakdown: {
          labels: categories,
          data: categoryData
        }
      }
    });
  } catch (error) {
    console.error('Sales Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales summary',
      error: error.message
    });
  }
};

module.exports = {
  getSalesSummary
};
