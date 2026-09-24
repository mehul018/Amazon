/**
 * Admin Controller
 * Provides seller management, verification control, and platform administration
 */
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * @desc    Get all sellers with filtering, search, and verification status
 * @route   GET /api/admin/sellers
 * @access  Private (Admin Only)
 */
const getAllSellers = async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = { role: 'seller' };

    // Filter by verification status
    if (status === 'verified') {
      query.isVerified = true;
    } else if (status === 'unverified') {
      query.isVerified = false;
    }

    // Search by store name, seller name, email or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { storeName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const sellers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    // Calculate seller metrics
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const verifiedSellers = await User.countDocuments({ role: 'seller', isVerified: true });
    const unverifiedSellers = await User.countDocuments({ role: 'seller', isVerified: false });

    res.json({
      success: true,
      data: {
        sellers,
        stats: {
          total: totalSellers,
          verified: verifiedSellers,
          unverified: unverifiedSellers
        }
      }
    });
  } catch (error) {
    console.error('Get All Sellers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sellers',
      error: error.message
    });
  }
};

/**
 * @desc    Verify or Unverify a seller
 * @route   PUT /api/admin/sellers/:id/verification
 * @access  Private (Admin Only)
 */
const updateSellerVerification = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({
        success: false,
        message: 'Cannot toggle verification for an Admin account'
      });
    }

    // Determine target verification status: if provided in body use it, otherwise toggle
    const newStatus = typeof req.body.isVerified === 'boolean'
      ? req.body.isVerified
      : !seller.isVerified;

    seller.isVerified = newStatus;
    seller.verificationStatus = newStatus ? 'verified' : 'unverified';
    if (newStatus) {
      seller.verificationDate = new Date();
    }

    await seller.save();

    res.json({
      success: true,
      message: `Seller "${seller.storeName}" has been successfully ${newStatus ? 'Verified' : 'Unverified'}.`,
      data: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        storeName: seller.storeName,
        role: seller.role,
        isVerified: seller.isVerified,
        verificationStatus: seller.verificationStatus,
        verificationDate: seller.verificationDate
      }
    });
  } catch (error) {
    console.error('Update Seller Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seller verification',
      error: error.message
    });
  }
};

/**
 * @desc    Get Admin Overview Stats
 * @route   GET /api/admin/stats
 * @access  Private (Admin Only)
 */
const getAdminStats = async (req, res) => {
  try {
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const verifiedSellers = await User.countDocuments({ role: 'seller', isVerified: true });
    const unverifiedSellers = await User.countDocuments({ role: 'seller', isVerified: false });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const validOrders = await Order.find({ status: { $ne: 'Cancelled' } });
    const totalRevenue = validOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        totalSellers,
        verifiedSellers,
        unverifiedSellers,
        totalProducts,
        totalOrders,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Get Admin Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin stats',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a seller
 * @route   DELETE /api/admin/sellers/:id
 * @access  Private (Admin Only)
 */
const deleteSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    if (seller.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an Admin account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Seller "${seller.storeName}" has been removed from platform`
    });
  } catch (error) {
    console.error('Delete Seller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete seller',
      error: error.message
    });
  }
};

module.exports = {
  getAllSellers,
  updateSellerVerification,
  getAdminStats,
  deleteSeller
};
