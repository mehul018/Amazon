/**
 * Database Configuration
 * Connects to local MongoDB / Atlas using Mongoose.
 * Features automatic in-memory fallback for instant plug-and-play local development.
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/amazon_seller_db';
  
  try {
    // Attempt standard connection with 3-second timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log(`⚠️  Could not connect to local MongoDB daemon at ${uri} (${error.message})`);
    console.log(`🔄 Starting embedded In-Memory MongoDB engine for seamless development...`);

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'amazon_seller_db'
        }
      });
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`✅ In-Memory MongoDB Connected: ${memoryUri}`);

      // Auto seed initial data if running with memory server
      const { autoSeedIfEmpty } = require('../seeder');
      if (typeof autoSeedIfEmpty === 'function') {
        await autoSeedIfEmpty();
      }

      return conn;
    } catch (memError) {
      console.error(`❌ Failed to start MongoDB fallback:`, memError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
