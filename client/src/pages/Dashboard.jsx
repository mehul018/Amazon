import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { salesService, productService, orderService, customerService } from '../services/api';
import StatCard from '../components/StatCard';
import SalesChart from '../components/SalesChart';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';

const categoriesList = [
  'Electronics',
  'Fashion & Apparel',
  'Home & Kitchen',
  'Books & Stationery',
  'Beauty & Personal Care',
  'Sports & Fitness',
  'Automotive & Industrial',
  'General Merchandise'
];

const initialProductForm = {
  name: '',
  category: 'Electronics',
  brand: '',
  sku: '',
  price: '',
  originalPrice: '',
  discount: '',
  stock: '',
  warranty: '1 Year Manufacturer Warranty',
  specifications: '',
  tags: '',
  image: '',
  description: '',
  rating: 4.5
};

const initialOrderForm = {
  customerId: '',
  customerName: '',
  customerEmail: '',
  productId: '',
  product: '',
  quantity: 1,
  totalAmount: '',
  status: 'Pending',
  shippingAddress: '',
  paymentMethod: 'Credit Card'
};

const Dashboard = () => {
  const { user, isAdmin, isVerified } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Quick Add Product Modal on Dashboard
  const [showProductModal, setShowProductModal] = useState(false);
  const [productFormData, setProductFormData] = useState({
    ...initialProductForm,
    category: user?.category || 'Electronics'
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Quick Create Order Modal on Dashboard
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderFormData, setOrderFormData] = useState(initialOrderForm);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await salesService.getSummary();
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      setError('Unable to load dashboard metrics. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const prodParams = !isAdmin && user?._id ? { sellerId: user._id } : {};
      const [custRes, prodRes] = await Promise.all([
        customerService.getAll(),
        productService.getAll(prodParams)
      ]);
      if (custRes.data?.success) setCustomers(custRes.data.data);
      if (prodRes.data?.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchDropdownData();
  }, []);

  const handleOpenAddProduct = () => {
    if (isAdmin) {
      setError('Action Restricted: Platform Admins manage sellers only and cannot add products.');
      return;
    }
    if (!isVerified) {
      setError('Action Restricted: Your seller account is unverified. Admin approval is required to add new products.');
      return;
    }
    setProductFormData({
      ...initialProductForm,
      category: user?.category || 'Electronics'
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (isAdmin) {
      alert('Action Restricted: Platform Admins manage sellers only and cannot add products.');
      return;
    }
    if (!isVerified) {
      alert('Action Restricted: Your seller account is unverified. Admin verification is required to add products.');
      return;
    }
    if (!productFormData.name || !productFormData.price || productFormData.stock === '') {
      alert('Please fill in product name, price, and stock quantity.');
      return;
    }

    try {
      setSubmittingProduct(true);
      await productService.create(productFormData);
      setSuccessMsg(`Product "${productFormData.name}" added successfully to your store catalog!`);
      setShowProductModal(false);
      setProductFormData(initialProductForm);
      fetchDashboardData();
      fetchDropdownData();
    } catch (err) {
      console.error('Create product error:', err);
      alert(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    if (!custId) {
      setOrderFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerEmail: '',
        shippingAddress: ''
      }));
      return;
    }
    const sel = customers.find((c) => c._id === custId);
    if (sel) {
      setOrderFormData((prev) => ({
        ...prev,
        customerId: sel._id,
        customerName: sel.name,
        customerEmail: sel.email,
        shippingAddress: sel.address ? `${sel.address}, ${sel.city || ''}`.trim() : sel.city || ''
      }));
    }
  };

  const handleProductSelect = (e) => {
    const prodId = e.target.value;
    if (!prodId) {
      setOrderFormData((prev) => ({
        ...prev,
        productId: '',
        product: '',
        totalAmount: ''
      }));
      return;
    }
    const sel = products.find((p) => p._id === prodId);
    if (sel) {
      const qty = Number(orderFormData.quantity || 1);
      setOrderFormData((prev) => ({
        ...prev,
        productId: sel._id,
        product: sel.name,
        totalAmount: (Number(sel.price || 0) * qty).toFixed(2)
      }));
    }
  };

  const handleOrderQtyChange = (qtyVal) => {
    const qty = Math.max(1, Number(qtyVal) || 1);
    setOrderFormData((prev) => {
      const sel = products.find((p) => p._id === prev.productId);
      const computedTotal = sel ? (Number(sel.price || 0) * qty).toFixed(2) : prev.totalAmount;
      return {
        ...prev,
        quantity: qty,
        totalAmount: computedTotal
      };
    });
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (isAdmin) {
      alert('Action Restricted: Platform Admins manage sellers only and cannot place orders.');
      return;
    }
    if (!isVerified) {
      alert('Action Restricted: Your seller account is unverified. Admin verification is required to place orders.');
      return;
    }
    if (!orderFormData.customerId) {
      alert('Please select a registered customer.');
      return;
    }
    if (!orderFormData.product || !orderFormData.totalAmount) {
      alert('Please select a product and enter total amount.');
      return;
    }

    if (orderFormData.productId) {
      const sel = products.find((p) => p._id === orderFormData.productId);
      if (sel && sel.stock < orderFormData.quantity) {
        alert(`Insufficient stock! Only ${sel.stock} units available for "${sel.name}".`);
        return;
      }
    }

    try {
      setSubmittingOrder(true);
      await orderService.create(orderFormData);
      setSuccessMsg('New order created successfully! Store metrics updated.');
      setShowOrderModal(false);
      setOrderFormData(initialOrderForm);
      fetchDashboardData();
      fetchDropdownData();
    } catch (err) {
      console.error('Create order error:', err);
      alert(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Seller Dashboard Overview..." />;
  }

  const getStatusBadge = (status) => {
    const map = {
      Pending: 'badge-pending',
      Confirmed: 'badge-confirmed',
      Shipped: 'badge-shipped',
      Delivered: 'badge-delivered',
      Cancelled: 'badge-cancelled'
    };
    return `badge ${map[status] || 'bg-secondary'} rounded-pill px-3 py-2`;
  };

  return (
    <div>
      {/* Top Welcome Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1">Seller Central Overview</h3>
          <p className="text-muted mb-0 small">
            Real-time performance summary of your store products, orders and revenue.
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {!isAdmin && (
            <button
              onClick={handleOpenAddProduct}
              className={`btn btn-sm d-flex align-items-center gap-2 shadow-sm ${
                !isVerified ? 'btn-secondary opacity-75' : 'btn-amazon-primary'
              }`}
              title={!isVerified ? 'Account unverified — Product listing is locked' : 'Add New Product'}
            >
              <i className={!isVerified ? 'bi bi-lock-fill' : 'bi bi-plus-circle-fill'}></i>
              <span>{!isVerified ? 'Add Product (Locked)' : 'Add Product'}</span>
            </button>
          )}
          <Link to="/products" className="btn btn-sm btn-amazon-dark d-flex align-items-center gap-2">
            <i className="bi bi-box-seam"></i>
            <span>Inventory</span>
          </Link>
          <button
            onClick={fetchDashboardData}
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            title="Refresh Data"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <AlertBanner message={error} type="danger" onClose={() => setError(null)} />
      <AlertBanner message={successMsg} type="success" onClose={() => setSuccessMsg(null)} />

      {/* Seller Category & Store Profile Banner */}
      {!isAdmin && (
        <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white border-start border-4 border-warning">
          <div className="card-body p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 bg-warning bg-opacity-15 text-dark d-flex align-items-center justify-content-center fw-bold shadow-sm"
                style={{ width: 46, height: 46, fontSize: '1.2rem' }}
              >
                <i className="bi bi-shop"></i>
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h5 className="fw-bold text-dark mb-0">{user?.storeName || 'Amazon Seller Store'}</h5>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill">
                    <i className="bi bi-tag-fill me-1"></i>
                    {user?.category || 'General Merchandise'}
                  </span>
                  {isVerified ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">
                      <i className="bi bi-patch-check-fill me-1"></i>Verified Seller
                    </span>
                  ) : (
                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 rounded-pill">
                      <i className="bi bi-shield-lock-fill me-1"></i>Unverified (Restricted Mode)
                    </span>
                  )}
                </div>
                <p className="text-secondary small mb-0 mt-1">
                  {user?.businessDescription
                    ? `Selling: ${user.businessDescription}`
                    : 'Manage catalog, fulfill incoming orders and track your revenue growth.'}
                </p>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                className={`btn btn-sm fw-semibold d-flex align-items-center gap-1 ${
                  !isVerified
                    ? 'btn-outline-secondary opacity-75'
                    : 'btn-outline-warning text-dark'
                }`}
                onClick={handleOpenAddProduct}
                title={!isVerified ? 'Account unverified — Product listing is locked' : 'Add Product'}
              >
                <i className={!isVerified ? 'bi bi-lock-fill' : 'bi bi-plus-lg'}></i>
                <span>{!isVerified ? 'Add Product (Locked)' : 'Add Product'}</span>
              </button>
              <Link to="/orders" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                <i className="bi bi-receipt"></i>
                <span>Orders</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Admin Privilege Banner */}
      {isAdmin && (
        <div className="card border-0 shadow-sm rounded-3 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #131921 0%, #232f3e 100%)' }}>
          <div className="card-body p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                <i className="bi bi-shield-check fs-5"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0 text-white">Platform Administrator Control</h6>
                <small className="text-white-50">
                  Manage merchant verifications, review seller profiles, and supervise platform sellers.
                </small>
              </div>
            </div>
            <Link to="/admin/sellers" className="btn btn-sm btn-danger d-inline-flex align-items-center gap-2 px-3 align-self-start align-self-md-auto">
              <i className="bi bi-people-fill"></i>
              <span>Manage Sellers & Verification</span>
            </Link>
          </div>
        </div>
      )}

      {/* Unverified Seller Warning Banner */}
      {!isAdmin && !isVerified && (
        <div className="alert alert-warning border border-warning shadow-sm rounded-3 d-flex align-items-start gap-3 p-3 mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-4 text-warning mt-1"></i>
          <div className="flex-grow-1">
            <h6 className="alert-heading fw-bold mb-1 text-dark">
              Account Verification Pending (Unverified Seller)
            </h6>
            <p className="mb-1 text-secondary small">
              Your merchant store <strong>"{user?.storeName || 'Amazon Seller Store'}"</strong> is currently awaiting administrative approval.
              Product creation and order fulfillment will be unlocked once an Admin verifies your account.
            </p>
            <div className="d-flex align-items-center gap-2 mt-2">
              <span className="badge bg-warning text-dark px-2 py-1">
                Status: Pending Admin Review
              </span>
              <small className="text-muted">You can review existing listings while awaiting verification.</small>
            </div>
          </div>
        </div>
      )}

      {/* 4 Primary KPI Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Revenue"
            value={`₹${(summary?.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            icon="bi-currency-rupee"
            bgColor="#e0f2fe"
            textColor="#0369a1"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Orders"
            value={summary?.totalOrders || 0}
            icon="bi-bag-check-fill"
            bgColor="#dcfce7"
            textColor="#166534"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Products"
            value={summary?.totalProducts || 0}
            icon="bi-box-seam-fill"
            bgColor="#fef3c7"
            textColor="#d97706"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Customers"
            value={summary?.totalCustomers || 0}
            icon="bi-people-fill"
            bgColor="#f3e8ff"
            textColor="#7e22ce"
          />
        </div>
      </div>

      {/* Main Row: Sales Trend Chart + Best Selling Highlight */}
      <div className="row g-4 mb-4">
        {/* Sales Trend Chart */}
        <div className="col-12 col-lg-8">
          <div className="amz-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Revenue Performance</h5>
                <small className="text-muted">Monthly sales revenue growth</small>
              </div>
              <span className="badge bg-light text-dark border px-2 py-1">
                2026 Trend
              </span>
            </div>
            <SalesChart
              type="line"
              labels={summary?.chartData?.labels || []}
              data={summary?.chartData?.sales || []}
              title="Sales Revenue (₹)"
              borderColor="#ff9900"
              backgroundColor="rgba(255, 153, 0, 0.12)"
            />
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="col-12 col-lg-4">
          <div className="amz-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 text-dark">Top Products</h5>
              <Link to="/products" className="small text-decoration-none fw-semibold text-primary">
                View All
              </Link>
            </div>

            <div className="d-flex flex-column gap-3">
              {summary?.topProducts && summary.topProducts.length > 0 ? (
                summary.topProducts.map((prod, idx) => (
                  <div key={prod._id || idx} className="d-flex align-items-center gap-3 p-2 rounded-3 bg-light">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="product-img-thumb"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                      }}
                    />
                    <div className="flex-grow-1 text-truncate">
                      <h6 className="mb-0 text-truncate fw-semibold" style={{ fontSize: '0.88rem' }}>
                        {prod.name}
                      </h6>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                          ₹{prod.price?.toFixed(2)}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>• {prod.category}</span>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-warning-subtle text-dark fw-bold">
                        ★ {prod.rating || 4.5}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted">No top products available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="amz-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Recent Orders</h5>
            <small className="text-muted">Latest incoming customer orders</small>
          </div>
          <div className="d-flex gap-2">
            {!isAdmin ? (
              <Link to="/orders" className="btn btn-sm btn-outline-primary fw-semibold">
                Manage All Orders <i className="bi bi-arrow-right"></i>
              </Link>
            ) : (
              <Link to="/admin/sellers" className="btn btn-sm btn-outline-danger fw-semibold">
                Manage Sellers & Directory <i className="bi bi-arrow-right"></i>
              </Link>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="amz-table align-middle">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {summary?.recentOrders && summary.recentOrders.length > 0 ? (
                summary.recentOrders.map((order) => (
                  <tr key={order._id || order.orderId}>
                    <td className="fw-bold text-primary">
                      {order.orderId}
                    </td>
                    <td>
                      <div className="fw-medium text-dark">{order.customerName}</div>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {order.customerEmail}
                      </small>
                    </td>
                    <td className="text-truncate" style={{ maxWidth: '220px' }}>
                      {order.product} (x{order.quantity})
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="fw-bold text-dark">
                      ₹{order.totalAmount?.toFixed(2)}
                    </td>
                    <td>
                      <span className={getStatusBadge(order.status)}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No recent orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Add Product Modal */}
      {showProductModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-amazon-dark text-white">
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <i className="bi bi-box-seam-fill text-warning"></i>
                  <span>Add New Product to Store Catalog</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowProductModal(false)}
                ></button>
              </div>

              <form onSubmit={handleProductSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Product Name */}
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-semibold small text-dark">Product Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Sony WH-1000XM5 Noise Cancelling Headphones"
                        value={productFormData.name}
                        onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                        required
                      />
                    </div>

                    {/* Brand */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small text-dark">Brand Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Sony, Apple, Nike"
                        value={productFormData.brand}
                        onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })}
                      />
                    </div>

                    {/* Category */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-dark">Category *</label>
                      <select
                        className="form-select"
                        value={productFormData.category}
                        onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                        required
                      >
                        {categoriesList.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SKU */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-dark">SKU / Product Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. AMZ-EL-9082 (auto-generated if blank)"
                        value={productFormData.sku}
                        onChange={(e) => setProductFormData({ ...productFormData, sku: e.target.value })}
                      />
                    </div>

                    {/* Price, MRP and Discount */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small text-dark">Selling Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control fw-bold"
                        placeholder="2499.00"
                        value={productFormData.price}
                        onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small text-dark">Original Price / MRP (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control text-muted"
                        placeholder="2999.00"
                        value={productFormData.originalPrice}
                        onChange={(e) => setProductFormData({ ...productFormData, originalPrice: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small text-dark">Stock Quantity *</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="50"
                        value={productFormData.stock}
                        onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                        required
                      />
                    </div>

                    {/* Warranty */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-dark">Warranty Terms</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 1 Year Manufacturer Warranty"
                        value={productFormData.warranty}
                        onChange={(e) => setProductFormData({ ...productFormData, warranty: e.target.value })}
                      />
                    </div>

                    {/* Tags */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-dark">Tags (Comma Separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Wireless, Bluetooth, Bestseller"
                        value={productFormData.tags}
                        onChange={(e) => setProductFormData({ ...productFormData, tags: e.target.value })}
                      />
                    </div>

                    {/* Image URL */}
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-dark">Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://images.unsplash.com/..."
                        value={productFormData.image}
                        onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                      />
                    </div>

                    {/* Specifications */}
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-dark">Key Specifications</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Battery: 30h | Driver: 40mm | Connectivity: Bluetooth 5.2 | Weight: 250g"
                        value={productFormData.specifications}
                        onChange={(e) => setProductFormData({ ...productFormData, specifications: e.target.value })}
                      />
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-dark">Product Description *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Detailed product overview, features and specifications..."
                        value={productFormData.description}
                        onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowProductModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-amazon-primary px-4 btn-sm fw-semibold"
                    disabled={submittingProduct}
                  >
                    {submittingProduct ? 'Adding Product...' : 'Add Product to Store'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Order Modal */}
      {showOrderModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-amazon-dark text-white">
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <i className="bi bi-cart-plus-fill text-warning"></i>
                  <span>Create New Order</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowOrderModal(false)}
                ></button>
              </div>

              <form onSubmit={handleOrderSubmit}>
                <div className="modal-body p-4">
                  {/* Select Customer */}
                  <div className="mb-3 p-3 bg-light rounded-3 border">
                    <label className="form-label fw-semibold small text-dark mb-1">
                      <i className="bi bi-person-check-fill text-primary me-1"></i>
                      Select Registered Customer *
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={orderFormData.customerId}
                      onChange={handleCustomerSelect}
                      required
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.email}) {c.city ? `• ${c.city}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Product */}
                  <div className="mb-3 p-3 bg-light rounded-3 border">
                    <label className="form-label fw-semibold small text-dark mb-1">
                      <i className="bi bi-box-seam text-primary me-1"></i>
                      Select Catalog Product
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={orderFormData.productId}
                      onChange={handleProductSelect}
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id} disabled={p.stock <= 0}>
                          {p.name} — ₹{Number(p.price).toFixed(2)} ({p.stock > 0 ? `Stock: ${p.stock}` : 'OUT OF STOCK'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark">Product Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Wireless Headphones"
                      value={orderFormData.product}
                      onChange={(e) => setOrderFormData({ ...orderFormData, product: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-dark">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={orderFormData.quantity}
                        onChange={(e) => handleOrderQtyChange(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-dark">Total Amount (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control fw-bold"
                        value={orderFormData.totalAmount}
                        onChange={(e) => setOrderFormData({ ...orderFormData, totalAmount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark">Shipping Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Shipping address"
                      value={orderFormData.shippingAddress}
                      onChange={(e) => setOrderFormData({ ...orderFormData, shippingAddress: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowOrderModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-amazon-primary px-4 btn-sm fw-semibold"
                    disabled={submittingOrder}
                  >
                    {submittingOrder ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
