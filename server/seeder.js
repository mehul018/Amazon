/**
 * Database Seeder Script
 * Populates sample Seller, Products, Orders and Customers for quick testing and demo.
 * Run standalone using: npm run seed (or node seeder.js)
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env variables
dotenv.config();

// Load Models
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Customer = require('./models/Customer');

const sampleProducts = [
  {
    name: 'Apple AirPods Pro (2nd Gen) with MagSafe Case',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80',
    category: 'Electronics',
    price: 249.99,
    stock: 45,
    description: 'Active Noise Cancellation, Adaptive Audio, and Transparency mode with up to 30 hours of total listening time.',
    rating: 4.8,
    salesCount: 142
  },
  {
    name: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
    category: 'Electronics',
    price: 398.00,
    stock: 28,
    description: 'Industry Leading noise canceling with Auto NC Optimizer, crystal clear hands-free calling, and 30-hour battery life.',
    rating: 4.9,
    salesCount: 98
  },
  {
    name: 'Echo Dot (5th Gen) Smart Speaker with Alexa',
    image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&auto=format&fit=crop&q=80',
    category: 'Electronics',
    price: 49.99,
    stock: 80,
    description: 'Our best sounding Echo Dot yet with vibrant sound in any room and built-in smart home assistant.',
    rating: 4.7,
    salesCount: 310
  },
  {
    name: 'Men\'s Classic Fit Waterproof Windbreaker Jacket',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    category: 'Fashion',
    price: 64.50,
    stock: 60,
    description: 'Lightweight, water-resistant everyday jacket with adjustable hood and zippered security pockets.',
    rating: 4.4,
    salesCount: 75
  },
  {
    name: 'Women\'s Genuine Leather Crossbody Bag',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    category: 'Fashion',
    price: 89.00,
    stock: 35,
    description: 'Handcrafted premium leather handbag with multi-compartment design and adjustable shoulder strap.',
    rating: 4.6,
    salesCount: 64
  },
  {
    name: 'Stainless Steel Espresso & Cappuccino Machine',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&auto=format&fit=crop&q=80',
    category: 'Home & Kitchen',
    price: 189.99,
    stock: 18,
    description: '15-bar professional Italian pump for rich crema, includes steam wand for silky microfoam milk texturing.',
    rating: 4.7,
    salesCount: 88
  },
  {
    name: 'Ceramic Non-Stick 10-Piece Cookware Set',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80',
    category: 'Home & Kitchen',
    price: 129.95,
    stock: 22,
    description: 'Non-toxic, PTFE/PFOA-free hard anodized cookware set with cool-touch silicone handles.',
    rating: 4.5,
    salesCount: 52
  },
  {
    name: 'Atomic Habits by James Clear (Hardcover)',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    category: 'Books',
    price: 21.99,
    stock: 120,
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Over 10 million copies sold worldwide.',
    rating: 4.9,
    salesCount: 420
  },
  {
    name: 'Organic Vitamin C Facial Glow Serum 30ml',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
    category: 'Beauty',
    price: 28.50,
    stock: 95,
    description: 'Anti-aging daily facial serum with Hyaluronic Acid and Vitamin E for radiant, brighter skin complexion.',
    rating: 4.6,
    salesCount: 165
  },
  {
    name: 'Adjustable Quick-Select Dumbbells 50 lbs Set',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    category: 'Sports',
    price: 299.00,
    stock: 12,
    description: 'Rapid weight adjustment dial from 5 to 52.5 lbs per dumbbell. Perfect for home gym strength workouts.',
    rating: 4.8,
    salesCount: 40
  }
];

const sampleCustomers = [
  {
    name: 'Sarah Jenkins',
    email: 'sarah.j@gmail.com',
    phone: '+1 (555) 234-5678',
    totalOrders: 4,
    totalSpending: 678.98,
    city: 'Seattle',
    address: '452 Pine St, Apt 4B'
  },
  {
    name: 'Michael Chang',
    email: 'm.chang@outlook.com',
    phone: '+1 (555) 345-6789',
    totalOrders: 3,
    totalSpending: 447.99,
    city: 'San Francisco',
    address: '890 Mission Blvd, Suite 12'
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@yahoo.com',
    phone: '+1 (555) 456-7890',
    totalOrders: 5,
    totalSpending: 890.50,
    city: 'Austin',
    address: '1204 South Congress Ave'
  },
  {
    name: 'David Wilson',
    email: 'dwilson@techcorp.com',
    phone: '+1 (555) 567-8901',
    totalOrders: 2,
    totalSpending: 398.00,
    city: 'Chicago',
    address: '330 N Wabash Ave'
  },
  {
    name: 'Priya Sharma',
    email: 'priya.s@gmail.com',
    phone: '+1 (555) 678-9012',
    totalOrders: 6,
    totalSpending: 1140.20,
    city: 'New York',
    address: '5th Ave & 42nd St'
  },
  {
    name: 'Alex Turner',
    email: 'alex.turner@gmail.com',
    phone: '+1 (555) 789-0123',
    totalOrders: 1,
    totalSpending: 49.99,
    city: 'Boston',
    address: '77 Massachusetts Ave'
  }
];

const sampleOrders = [
  {
    orderId: 'AMZ-9021',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@gmail.com',
    product: 'Apple AirPods Pro (2nd Gen) with MagSafe Case',
    quantity: 1,
    totalAmount: 249.99,
    orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'Pending',
    shippingAddress: '452 Pine St, Apt 4B, Seattle, WA 98101',
    paymentMethod: 'Credit Card'
  },
  {
    orderId: 'AMZ-9020',
    customerName: 'Michael Chang',
    customerEmail: 'm.chang@outlook.com',
    product: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    quantity: 1,
    totalAmount: 398.00,
    orderDate: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    status: 'Confirmed',
    shippingAddress: '890 Mission Blvd, Suite 12, San Francisco, CA 94103',
    paymentMethod: 'UPI / NetBanking'
  },
  {
    orderId: 'AMZ-9019',
    customerName: 'Emily Davis',
    customerEmail: 'emily.davis@yahoo.com',
    product: 'Stainless Steel Espresso & Cappuccino Machine',
    quantity: 1,
    totalAmount: 189.99,
    orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    status: 'Shipped',
    shippingAddress: '1204 South Congress Ave, Austin, TX 78704',
    paymentMethod: 'Credit Card'
  },
  {
    orderId: 'AMZ-9018',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.s@gmail.com',
    product: 'Echo Dot (5th Gen) Smart Speaker with Alexa',
    quantity: 2,
    totalAmount: 99.98,
    orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'Delivered',
    shippingAddress: '5th Ave & 42nd St, New York, NY 10018',
    paymentMethod: 'Debit Card'
  },
  {
    orderId: 'AMZ-9017',
    customerName: 'David Wilson',
    customerEmail: 'dwilson@techcorp.com',
    product: 'Atomic Habits by James Clear (Hardcover)',
    quantity: 3,
    totalAmount: 65.97,
    orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: 'Delivered',
    shippingAddress: '330 N Wabash Ave, Chicago, IL 60611',
    paymentMethod: 'Credit Card'
  },
  {
    orderId: 'AMZ-9016',
    customerName: 'Alex Turner',
    customerEmail: 'alex.turner@gmail.com',
    product: 'Men\'s Classic Fit Waterproof Windbreaker Jacket',
    quantity: 1,
    totalAmount: 64.50,
    orderDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    status: 'Cancelled',
    shippingAddress: '77 Massachusetts Ave, Boston, MA 02139',
    paymentMethod: 'Cash on Delivery'
  }
];

const autoSeedIfEmpty = async () => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('🌱 Populating database with sample seller, products, customers & orders...');
    await User.create({
      name: 'Mohit Seller Admin',
      email: 'seller@amazon.com',
      password: 'seller123',
      storeName: 'Amazon Prime Verified Seller Store',
      role: 'seller'
    });
    await Product.insertMany(sampleProducts);
    await Customer.insertMany(sampleCustomers);
    await Order.insertMany(sampleOrders);
    console.log('✅ Sample data populated successfully! Login: seller@amazon.com / seller123');
  }
};

const seedData = async () => {
  try {
    const connectDB = require('./config/db');
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Customer.deleteMany();

    console.log('👤 Creating default Seller user...');
    await User.create({
      name: 'Mohit Seller Admin',
      email: 'seller@amazon.com',
      password: 'seller123',
      storeName: 'Amazon Prime Verified Seller Store',
      role: 'seller'
    });

    console.log('📦 Inserting sample products...');
    await Product.insertMany(sampleProducts);

    console.log('👥 Inserting sample customers...');
    await Customer.insertMany(sampleCustomers);

    console.log('🛒 Inserting sample orders...');
    await Order.insertMany(sampleOrders);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database seeded successfully!');
    console.log('🔑 Login Credentials:');
    console.log('   Email:    seller@amazon.com');
    console.log('   Password: seller123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding Error: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = { autoSeedIfEmpty, sampleProducts, sampleCustomers, sampleOrders };
