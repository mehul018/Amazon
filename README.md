# Amazon Seller Dashboard (MERN Stack Web Application)

A simple, clean, and beginner-friendly **Amazon Seller Central Dashboard** built using the **MERN Stack** (**M**ongoDB, **E**xpress.js, **R**eact.js, **N**ode.js) following the **MVC (Model-View-Controller)** backend architecture and **Bootstrap 5** for modern UI design.

---

## 📌 Project Overview

This project simulates an Amazon-like Seller Central portal where a vendor/merchant can:
1. **Authenticate / Log in** as a verified seller.
2. **View a Central Dashboard** with key performance indicators (Total Revenue, Orders, Products, Customers, monthly charts, and recent activity).
3. **Manage Products Catalog** (Add, Edit, Delete, Search by keyword, Filter by category, and Stock tracking).
4. **Manage Orders & Fulfillment** (View order details, update shipping statuses from *Pending* to *Delivered*, and cancel orders).
5. **Manage Customer Directory** (View shoppers, contact details, total orders, and lifetime spending).
6. **Analyze Sales Reports** (View today's sales, monthly sales, best-selling products, and interactive revenue charts).

---

## 🏗️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React.js 18 + Vite** | Component-based single page application (SPA) |
| **Styling** | **Bootstrap 5 + Bootstrap Icons + Custom CSS** | Responsive Amazon Seller Central inspired design |
| **Charts** | **Chart.js + react-chartjs-2** | Interactive revenue line and bar charts |
| **Routing** | **React Router DOM (v6)** | Client-side page navigation & protected routes |
| **HTTP Client** | **Axios** | REST API communication with JWT interceptor |
| **Backend** | **Node.js + Express.js** | RESTful API server using MVC architecture |
| **Database** | **MongoDB + Mongoose** | Document database with schema modeling |
| **Auth & Security** | **JWT (JSON Web Tokens) + bcryptjs** | Token-based seller authentication & password hashing |

---

## 📂 Complete Project Folder Structure

```
Amazon/
├── package.json                   # Root package runner script
├── README.md                      # Complete Project Documentation & Viva Notes
│
├── server/                        # Node.js + Express.js Backend (MVC Architecture)
│   ├── config/
│   │   └── db.js                  # MongoDB / Mongoose connection handler
│   ├── models/                    # [M] in MVC: Mongoose Schemas & Data Models
│   │   ├── User.js                # Seller user schema & bcrypt hashing
│   │   ├── Product.js             # Product catalog schema
│   │   ├── Order.js               # Customer order schema
│   │   └── Customer.js            # Customer profile schema
│   ├── controllers/               # [C] in MVC: Business Logic & Query Handlers
│   │   ├── authController.js      # Login & Profile controllers
│   │   ├── productController.js   # Product CRUD, category filter & search
│   │   ├── orderController.js     # Order list, status updater & delete
│   │   ├── customerController.js  # Customer list & order history
│   │   └── salesController.js     # Sales analytics & revenue calculations
│   ├── routes/                    # Express REST API endpoints
│   │   ├── authRoutes.js          # /api/auth
│   │   ├── productRoutes.js       # /api/products
│   │   ├── orderRoutes.js         # /api/orders
│   │   ├── customerRoutes.js      # /api/customers
│   │   └── salesRoutes.js         # /api/sales
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT authentication verification middleware
│   ├── seeder.js                  # Sample data seeder script
│   ├── server.js                  # Express application entry point
│   ├── package.json               # Backend dependencies & scripts
│   ├── .env                       # Environment configuration
│   └── .env.example
│
└── client/                        # [V] in MVC: React.js Frontend
    ├── index.html                 # HTML template with Google Fonts
    ├── package.json               # Frontend dependencies & Vite scripts
    ├── vite.config.js             # Vite development server config
    └── src/
        ├── main.jsx               # React DOM bootstrap
        ├── App.jsx                # React Router & Protected Route setup
        ├── index.css              # Amazon Seller Central custom styling
        ├── services/
        │   └── api.js             # Centralized Axios REST client & API calls
        ├── context/
        │   └── AuthContext.jsx    # Authentication state management
        ├── layouts/
        │   └── MainLayout.jsx     # Master layout with Sidebar & Top Navbar
        ├── components/
        │   ├── Navbar.jsx         # Top navigation header
        │   ├── Sidebar.jsx        # Amazon Seller navigation drawer
        │   ├── StatCard.jsx       # Reusable KPI metric card
        │   ├── SalesChart.jsx     # Reusable Chart.js Line / Bar component
        │   ├── LoadingSpinner.jsx # Loading state indicator
        │   └── AlertBanner.jsx    # Success & error alerts
        └── pages/
            ├── Login.jsx          # Seller Sign-in page with demo credentials
            ├── Dashboard.jsx      # Overview with KPIs, charts & recent orders
            ├── Products.jsx       # Product catalog, search, filter & modals
            ├── Orders.jsx         # Orders table, status changer & details modal
            ├── Customers.jsx      # Customer directory & profile modal
            └── Sales.jsx          # Sales analytics & monthly revenue charts
```

---

## 🗄️ MongoDB Schemas & Data Models

### 1. User Schema (`server/models/User.js`)
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed with bcrypt
  storeName: { type: String, default: 'Amazon Super Store' },
  role: { type: String, enum: ['seller', 'admin'], default: 'seller' },
  createdAt: { type: Date, default: Date.now }
}
```

### 2. Product Schema (`server/models/Product.js`)
```javascript
{
  name: { type: String, required: true },
  image: { type: String, default: '...' },
  category: { type: String, required: true }, // Electronics, Fashion, Home & Kitchen, Books, etc.
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  description: { type: String, required: true },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  salesCount: { type: Number, default: 0 }
}
```

### 3. Order Schema (`server/models/Order.js`)
```javascript
{
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  product: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  totalAmount: { type: Number, required: true, min: 0 },
  orderDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  shippingAddress: { type: String },
  paymentMethod: { type: String, default: 'Credit Card' }
}
```

### 4. Customer Schema (`server/models/Customer.js`)
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  totalOrders: { type: Number, default: 0 },
  totalSpending: { type: Number, default: 0 },
  city: { type: String, default: 'Seattle' },
  address: { type: String }
}
```

---

## 📡 REST API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate seller and return JWT token | Public |
| `GET` | `/api/auth/profile` | Get authenticated seller profile | Private (Bearer Token) |

### 📦 Products (`/api/products`)
| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | `?search=query&category=cat` | List products with search & category filters |
| `GET` | `/api/products/:id` | - | Get product by ID |
| `POST` | `/api/products` | `{ name, category, price, stock, description, rating, image }` | Add new product |
| `PUT` | `/api/products/:id` | `{ name, price, stock, ... }` | Update product details |
| `DELETE` | `/api/products/:id` | - | Delete product from catalog |

### 🛒 Orders (`/api/orders`)
| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/orders` | `?status=Shipped&search=AMZ` | List orders with status filter and search |
| `GET` | `/api/orders/:id` | - | Get order details |
| `POST` | `/api/orders` | `{ customerName, product, quantity, totalAmount }` | Create new order |
| `PUT` | `/api/orders/:id` | `{ status: 'Shipped' }` | Update order fulfillment status |
| `DELETE` | `/api/orders/:id` | - | Cancel / delete order |

### 👥 Customers (`/api/customers`)
| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customers` | `?search=name` | List customers with search |
| `GET` | `/api/customers/:id` | - | Get customer details and linked order history |

### 📈 Sales & Reports (`/api/sales`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/sales/summary` | Total sales, today's sales, monthly sales, best seller, chart data |

---

## 🚀 Step-by-Step Setup & Running Guide

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v18 or higher recommended)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) or MongoDB Compass (Optional: the backend automatically uses embedded in-memory MongoDB if local MongoDB service is not started).

---

### Step 1: Clone or Open Project
Navigate to project directory:
```bash
cd c:/Mohit/Amazon
```

---

### Step 2: Backend Setup & Run
Open a terminal for the backend:
```bash
cd server
npm install
npm run seed     # Optional: Seeds sample products, orders, customers & default seller
npm run dev      # Runs server on http://localhost:5000 with nodemon
```

---

### Step 3: Frontend Setup & Run
Open a second terminal for the frontend:
```bash
cd client
npm install
npm run dev      # Runs React client on http://localhost:3000
```

---

### Step 4: Open in Web Browser
Visit `http://localhost:3000/` in your browser.

#### 🔑 Default Seller Login Credentials:
- **Email:** `seller@amazon.com`
- **Password:** `seller123`
*(Or simply click the **"Fill Demo Credentials"** button on the login screen)*.

---

## 💡 Viva / Project Presentation Guide: How MERN Stack Works

### 1. What is the MERN Stack?
- **M - MongoDB**: A NoSQL document database that stores application data as JSON-like documents (BSON).
- **E - Express.js**: A minimalist web framework for Node.js used to build RESTful API endpoints and middleware.
- **R - React.js**: A declarative, component-based frontend JavaScript library used for building interactive single-page user interfaces.
- **N - Node.js**: A JavaScript runtime environment that allows executing JavaScript on the server side outside the browser.

### 2. How the MVC Architecture is Implemented:
- **Model (`server/models/`)**: Defines the data structure, data types, validations, and database schema using Mongoose (e.g., `Product.js`, `Order.js`, `User.js`).
- **View (`client/src/`)**: The presentation layer created with React components, Bootstrap styles, and Chart.js visualizations that the seller sees and interacts with.
- **Controller (`server/controllers/`)**: The bridge between Model and View. It receives HTTP requests from routes, queries MongoDB through Mongoose models, executes business logic, and returns structured JSON responses.

### 3. How Frontend, Backend & Database Communicate:
```
[ User Action in Browser ] 
          │
          ▼
[ React Component (e.g. Products.jsx) ]
          │ (calls API service via Axios)
          ▼
[ HTTP REST Request: GET /api/products?category=Electronics ]
          │ (Transmitted over HTTP / JSON)
          ▼
[ Express Server (server.js & productRoutes.js) ]
          │ (Executes authMiddleware & Controller)
          ▼
[ Controller: productController.js ]
          │ (Queries Mongoose Model)
          ▼
[ Mongoose Product Model (Product.js) ]
          │ (Executes MongoDB Query)
          ▼
[ MongoDB Database Collection: 'products' ]
          │ (Returns matching document records)
          ▼
[ Controller formats JSON response { success: true, data: [...] } ]
          │ (HTTP 200 OK Response)
          ▼
[ React Component receives data in state ]
          │ (Re-renders UI table dynamically)
          ▼
[ Seller views updated products in table ]
```

---

## 👨‍💻 Author & Project Credits
- **Project:** Amazon Seller Central Dashboard (MERN Stack MCA Project)
- **Architecture:** Full-Stack MERN with MVC Pattern
- **Status:** Fully functional & tested
