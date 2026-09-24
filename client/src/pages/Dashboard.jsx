import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { salesService } from '../services/api';
import StatCard from '../components/StatCard';
import SalesChart from '../components/SalesChart';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1">Seller Central Overview</h3>
          <p className="text-muted mb-0 small">
            Real-time performance summary of your store products, orders and revenue.
          </p>
        </div>
        <div className="d-flex gap-2">
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

      {/* 4 Primary KPI Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Revenue"
            value={`$${(summary?.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            icon="bi-currency-dollar"
            bgColor="#e0f2fe"
            textColor="#0369a1"
            changeText="+12.4%"
            isPositive={true}
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Orders"
            value={summary?.totalOrders || 0}
            icon="bi-bag-check-fill"
            bgColor="#dcfce7"
            textColor="#166534"
            changeText="+8.2%"
            isPositive={true}
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Products"
            value={summary?.totalProducts || 0}
            icon="bi-box-seam-fill"
            bgColor="#fef3c7"
            textColor="#d97706"
            changeText="+4 items"
            isPositive={true}
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Customers"
            value={summary?.totalCustomers || 0}
            icon="bi-people-fill"
            bgColor="#f3e8ff"
            textColor="#7e22ce"
            changeText="+15%"
            isPositive={true}
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
              title="Sales Revenue ($)"
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
                          ${prod.price?.toFixed(2)}
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
          <Link to="/orders" className="btn btn-sm btn-outline-primary fw-semibold">
            Manage All Orders <i className="bi bi-arrow-right"></i>
          </Link>
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
                      ${order.totalAmount?.toFixed(2)}
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
    </div>
  );
};

export default Dashboard;
