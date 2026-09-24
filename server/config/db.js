
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');


const initDefaultUsers = async () => {
  try {
    // 1. Ensure Admin Account exists
    let admin = await User.findOne({ email: 'admin@amazon.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Mehul Platform Admin',
        email: 'admin@amazon.com',
        password: 'admin123',
        storeName: 'Amazon Central Admin',
        role: 'admin',
        isVerified: true,
        verificationStatus: 'verified',
        verificationDate: new Date()
      });
      console.log('✅ Default Admin account initialized: admin@amazon.com / admin123');
    } else if (admin.role !== 'admin' || !admin.isVerified) {
      admin.role = 'admin';
      admin.isVerified = true;
      admin.verificationStatus = 'verified';
      await admin.save();
    }

    // 2. Ensure Verified Seller exists
    let seller = await User.findOne({ email: 'seller@amazon.com' });
    if (!seller) {
      seller = await User.create({
        name: 'Apex Retailer',
        email: 'seller@amazon.com',
        password: 'seller123',
        storeName: 'Apex Electronics & Essentials',
        category: 'Electronics',
        businessDescription: 'Premium wireless audio, smart wearables, and phone accessories.',
        role: 'seller',
        isVerified: true,
        verificationStatus: 'verified',
        verificationDate: new Date(),
        phone: '+91 98765 43210'
      });
      console.log('✅ Default Verified Seller initialized: seller@amazon.com / seller123');
    } else {
      let updated = false;
      if (!seller.category) { seller.category = 'Electronics'; updated = true; }
      if (!seller.businessDescription) { seller.businessDescription = 'Premium wireless audio, smart wearables, and phone accessories.'; updated = true; }
      if (!seller.isVerified) {
        seller.isVerified = true;
        seller.verificationStatus = 'verified';
        if (!seller.verificationDate) seller.verificationDate = new Date();
        updated = true;
      }
      if (updated) await seller.save();
    }

    // 3. Ensure Unverified Demo Seller exists for immediate testing
    let unverifiedSeller = await User.findOne({ email: 'new.seller@amazon.com' });
    if (!unverifiedSeller) {
      unverifiedSeller = await User.create({
        name: 'New Venture Merchant',
        email: 'new.seller@amazon.com',
        password: 'seller123',
        storeName: 'Nova Gadgets & Apparel',
        category: 'Fashion & Apparel',
        businessDescription: 'Trendy urban fashion, streetwear, and designer watches.',
        role: 'seller',
        isVerified: false,
        verificationStatus: 'unverified',
        phone: '+91 91234 56789'
      });
      console.log('✅ Default Unverified Seller initialized: new.seller@amazon.com / seller123');
    } else {
      let unvUpdated = false;
      if (!unverifiedSeller.category) { unverifiedSeller.category = 'Fashion & Apparel'; unvUpdated = true; }
      if (!unverifiedSeller.businessDescription) { unverifiedSeller.businessDescription = 'Trendy urban fashion, streetwear, and designer watches.'; unvUpdated = true; }
      if (unvUpdated) await unverifiedSeller.save();
    }
  } catch (err) {
    console.error('Could not initialize default users:', err.message);
  }
};

/**
 * Migration helper: backfill seller references for legacy products and orders
 */
const backfillSellerData = async () => {
  try {
    const defaultSeller = await User.findOne({ email: 'seller@amazon.com' });
    if (!defaultSeller) return;

    // 1. Backfill any products without a seller
    const productsWithoutSeller = await Product.find({
      $or: [{ seller: null }, { seller: { $exists: false } }]
    });

    for (const prod of productsWithoutSeller) {
      let matchedSeller = null;
      if (prod.sellerName && prod.sellerName !== 'Amazon Seller Store') {
        matchedSeller = await User.findOne({ storeName: prod.sellerName });
      }
      const sellerToUse = matchedSeller || defaultSeller;
      prod.seller = sellerToUse._id;
      prod.sellerName = sellerToUse.storeName || 'Amazon Seller Store';
      await prod.save();
    }

    if (productsWithoutSeller.length > 0) {
      console.log(`✅ Backfilled seller references for ${productsWithoutSeller.length} products.`);
    }

    // 2. Backfill any orders without a seller
    const ordersWithoutSeller = await Order.find({
      $or: [{ seller: null }, { seller: { $exists: false } }]
    });

    for (const ord of ordersWithoutSeller) {
      let resolvedSellerId = null;
      let resolvedSellerName = 'Amazon Seller Store';

      let prod = null;
      if (ord.productId) {
        prod = await Product.findById(ord.productId);
      }
      if (!prod && ord.product) {
        prod = await Product.findOne({ name: { $regex: new RegExp(`^${ord.product.trim()}$`, 'i') } });
      }

      if (prod && prod.seller) {
        resolvedSellerId = prod.seller;
        resolvedSellerName = prod.sellerName || 'Amazon Seller Store';
      } else {
        resolvedSellerId = defaultSeller._id;
        resolvedSellerName = defaultSeller.storeName || 'Amazon Seller Store';
      }

      ord.seller = resolvedSellerId;
      ord.sellerName = resolvedSellerName;
      await ord.save();
    }

    if (ordersWithoutSeller.length > 0) {
      console.log(`✅ Backfilled seller references for ${ordersWithoutSeller.length} orders.`);
    }
  } catch (err) {
    console.error('Error during seller data backfill:', err.message);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/amazon_seller_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await initDefaultUsers();
    await backfillSellerData();
    return conn;
  } catch (error) {
    console.log(`Could not connect to local MongoDB daemon at ${uri} (${error.message})`);
    console.log(`Starting embedded In-Memory MongoDB engine for seamless development...`);

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        binary: {
          version: '6.0.14'
        },
        instance: {
          port: 27017,
          dbName: 'amazon_seller_db'
        }
      });
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`In-Memory MongoDB Connected: ${memoryUri}`);

      await initDefaultUsers();
      await backfillSellerData();

      return conn;
    } catch (memError) {
      console.error(`Failed to start MongoDB fallback:`, memError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
