import React, { useState, useEffect } from 'react';
import { orderService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

const statusList = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const initialOrderForm = {
  customerName: '',
  customerEmail: '',
  product: '',
  quantity: 1,
  totalAmount: '',
  status: 'Pending',
  shippingAddress: '',
  paymentMethod: 'Credit Card'
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Order for detail modal
  const [viewOrder, setViewOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Create Order Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState(initialOrderForm);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (searchTerm) params.search = searchTerm;

      const res = await orderService.getAll(params);
      if (res.data?.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Failed to fetch orders from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await orderService.updateStatus(orderId, newStatus);
      setSuccessMsg(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteId) return;
    try {
      await orderService.delete(deleteId);
      setSuccessMsg('Order has been cancelled / deleted.');
      setDeleteId(null);
      fetchOrders();
    } catch (err) {
      console.error('Delete order error:', err);
      alert('Failed to delete order.');
    }
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (!newOrderForm.customerName || !newOrderForm.product || !newOrderForm.totalAmount) {
      alert('Please fill customer name, product and total amount.');
      return;
    }
    try {
      setCreatingOrder(true);
      await orderService.create(newOrderForm);
      setSuccessMsg('New order created successfully!');
      setShowAddModal(false);
      setNewOrderForm(initialOrderForm);
      fetchOrders();
    } catch (err) {
      console.error('Create order error:', err);
      alert('Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

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
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1">Order Management</h3>
          <p className="text-muted mb-0 small">
            Track customer purchases, update fulfillment lifecycle and view shipping details.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-amazon-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Create New Order</span>
          </button>
          <button
            onClick={fetchOrders}
            className="btn btn-outline-secondary d-flex align-items-center gap-1"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      <AlertBanner message={error} type="danger" onClose={() => setError(null)} />
      <AlertBanner message={successMsg} type="success" onClose={() => setSuccessMsg(null)} />

      {/* Filter Tabs & Search */}
      <div className="amz-card mb-4">
        <div className="row g-3 align-items-center">
          {/* Search bar */}
          <div className="col-12 col-md-5">
            <form onSubmit={handleSearchSubmit} className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by Order ID, customer, product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-dark px-3">
                Search
              </button>
            </form>
          </div>

          {/* Status Tabs */}
          <div className="col-12 col-md-7">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              {statusList.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`category-pill ${selectedStatus === status ? 'active' : ''}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="amz-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 text-dark">
            Orders List <span className="text-muted fs-6 fw-normal">({orders.length} orders)</span>
          </h5>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading orders..." />
        ) : orders.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-receipt text-muted" style={{ fontSize: '3rem' }}></i>
            <h5 className="fw-bold mt-3">No Orders Found</h5>
            <p className="text-muted small">
              No customer orders match the selected status or search term.
            </p>
            <button className="btn btn-sm btn-amazon-primary mt-2" onClick={() => setShowAddModal(true)}>
              Create First Order
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="amz-table align-middle">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Product & Qty</th>
                  <th>Total Amount</th>
                  <th>Order Date</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id || o.orderId}>
                    <td className="fw-bold text-primary" style={{ cursor: 'pointer' }} onClick={() => setViewOrder(o)}>
                      {o.orderId}
                    </td>

                    <td>
                      <div className="fw-semibold text-dark">{o.customerName}</div>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {o.customerEmail}
                      </small>
                    </td>

                    <td>
                      <div className="text-truncate fw-medium" style={{ maxWidth: '240px' }}>
                        {o.product}
                      </div>
                      <small className="text-muted">Quantity: {o.quantity || 1}</small>
                    </td>

                    <td className="fw-bold text-dark">
                      ${Number(o.totalAmount || 0).toFixed(2)}
                    </td>

                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {new Date(o.orderDate).toLocaleDateString()}
                    </td>

                    <td>
                      {/* Status select dropdown */}
                      <select
                        className={`form-select form-select-sm fw-semibold ${getStatusBadge(o.status)}`}
                        style={{ width: '135px', cursor: 'pointer' }}
                        value={o.status}
                        disabled={updatingId === o._id}
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => setViewOrder(o)}
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => setDeleteId(o._id)}
                          title="Cancel/Delete Order"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create New Order Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">Create Manual Customer Order</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateOrderSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Customer Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Doe"
                      value={newOrderForm.customerName}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Customer Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="john.doe@example.com"
                      value={newOrderForm.customerEmail}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerEmail: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Product Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Apple AirPods Pro (2nd Gen)"
                      value={newOrderForm.product}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, product: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={newOrderForm.quantity}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, quantity: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Total Amount ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        placeholder="249.99"
                        value={newOrderForm.totalAmount}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, totalAmount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Initial Status</label>
                    <select
                      className="form-select"
                      value={newOrderForm.status}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Shipping Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 100 Main St, Seattle, WA"
                      value={newOrderForm.shippingAddress}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, shippingAddress: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-amazon-primary px-4"
                    disabled={creatingOrder}
                  >
                    {creatingOrder ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Order Details Modal */}
      {viewOrder && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">
                  Order Details - <span className="text-primary">{viewOrder.orderId}</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewOrder(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                  <div>
                    <span className="text-muted small">Current Status</span>
                    <div>
                      <span className={getStatusBadge(viewOrder.status)}>
                        {viewOrder.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="text-muted small">Total Paid</span>
                    <h4 className="fw-bold text-dark mb-0">
                      ${Number(viewOrder.totalAmount || 0).toFixed(2)}
                    </h4>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-2">Item Information</h6>
                  <div className="p-3 bg-light rounded-3">
                    <div className="fw-semibold text-dark">{viewOrder.product}</div>
                    <div className="text-muted small mt-1">
                      Ordered Quantity: <span className="fw-bold text-dark">{viewOrder.quantity}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-2">Customer & Shipping</h6>
                  <div className="p-3 bg-light rounded-3 small">
                    <div><strong>Customer Name:</strong> {viewOrder.customerName}</div>
                    <div><strong>Email:</strong> {viewOrder.customerEmail}</div>
                    <div><strong>Shipping Address:</strong> {viewOrder.shippingAddress || 'Not specified'}</div>
                    <div><strong>Payment Method:</strong> {viewOrder.paymentMethod || 'Credit Card'}</div>
                    <div><strong>Order Placed:</strong> {new Date(viewOrder.orderDate).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Cancel Confirm Modal */}
      {deleteId && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger-subtle">
                <h5 className="modal-title text-danger fw-bold">Cancel Order</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteId(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-0">
                  Are you sure you want to cancel and remove this order record from the system?
                </p>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteId(null)}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={handleDeleteOrder}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
