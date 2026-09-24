/**
 * Auth Controller
 * Handles seller login, registration and profile
 */
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'amazon_seller_secret_key_2026_mca',
    { expiresIn: '30d' }
  );
};

/**
 * @desc    Auth user/seller & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password, portal } = req.body;

    // Validate email & password input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Check for existing user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      // If logging into dedicated admin portal, verify role
      if (portal === 'admin' && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Admin credentials required for Admin Portal'
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          storeName: user.storeName,
          role: user.role,
          phone: user.phone || '',
          category: user.category || 'General Merchandise',
          businessDescription: user.businessDescription || '',
          isVerified: !!user.isVerified,
          verificationStatus: user.verificationStatus || (user.isVerified ? 'verified' : 'unverified'),
          verificationDate: user.verificationDate,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

/**
 * @desc    Register a new seller account
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerSeller = async (req, res) => {
  try {
    const { name, email, password, storeName, phone, category, businessDescription } = req.body;

    if (!name || !email || !password || !storeName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password and store name'
      });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A seller account with this email address already exists'
      });
    }

    // New sellers are created as role: 'seller', isVerified: false by default
    const seller = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      storeName,
      phone: phone || '',
      category: category || 'General Merchandise',
      businessDescription: businessDescription || '',
      role: 'seller',
      isVerified: false,
      verificationStatus: 'unverified'
    });

    res.status(201).json({
      success: true,
      message: 'Seller account registered successfully. Verification pending from Admin.',
      data: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        storeName: seller.storeName,
        role: seller.role,
        phone: seller.phone,
        category: seller.category,
        businessDescription: seller.businessDescription,
        isVerified: seller.isVerified,
        verificationStatus: seller.verificationStatus,
        token: generateToken(seller._id)
      }
    });
  } catch (error) {
    console.error('Register Seller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

/**
 * @desc    Get currently logged-in seller/admin profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getSellerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({
        success: true,
        data: user
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  loginUser,
  registerSeller,
  getSellerProfile
};
