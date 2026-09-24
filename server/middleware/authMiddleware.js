/**
 * Authentication Middleware
 * Protects private seller routes using JSON Web Tokens (JWT)
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'amazon_seller_secret_key_2026_mca'
      );

      // Fetch user from database excluding password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found with this token'
        });
      }

      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided in request header'
    });
  }
};

/**
 * Admin Only Middleware
 * Grants access only if user has role: 'admin'
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required for this action'
    });
  }
};

/**
 * Verified Seller Only Middleware
 * Requires seller to be verified by Platform Admin
 */
const verifiedSellerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted: Platform Admins manage sellers only and cannot perform store operations.'
    });
  }
  if (req.user && req.user.role === 'seller' && req.user.isVerified) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access restricted: Your seller account is unverified. Admin verification is required to perform this action.'
  });
};

/**
 * Optional Authentication Middleware
 * Attaches req.user if a valid Bearer token is provided, but allows unauthenticated requests through
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'amazon_seller_secret_key_2026_mca'
      );
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Invalid or expired token: continue without setting req.user
    }
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  adminOnly,
  verifiedSellerOnly
};

