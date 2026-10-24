const Product = require('../models/Product'); // Apne database model ka naam check kar lein

const getDashboardStats = async (req, res) => {
  try {
    const totalRecords = await Product.countDocuments();
    const activeRecords = await Product.countDocuments({ status: 'active' });
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayRecords = await Product.countDocuments({
      createdAt: { $gte: startOfDay }
    });

    res.status(200).json({
      success: true,
      totalRecords,
      activeRecords,
      todayRecords
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };