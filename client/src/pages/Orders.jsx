import React, { useState, useEffect } from 'react';
import { orderService, customerService, productService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';

const statusList = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

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

const Orders = () => {
  const { user, isAdmin, isVerified } = useAuth();
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
  const [customerList, setCustomerList] = useState([]);
  const [productList, setProductList] = useState([]);

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

  const fetchCustomerList = async () => {
    try {
      const res = await customerService.getAll();
      if (res.data?.success) {
        setCustomerList(res.data.data);
      }
    } catch (err) {
      console.error('Fetch customer list error:', err);
    }
  };

  const fetchProductList = async () => {
    try {
      const params = user?._id ? { sellerId: user._id } : {};
      const res = await productService.getAll(params);
      if (res.data?.success) {
        setProductList(res.data.data);
      }
    } catch (err) {
      console.error('Fetch product list error:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomerList();
    fetchProductList();
  }, [selectedStatus]);

  const handleCustomerSelectChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setNewOrderForm((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerEmail: '',
        shippingAddress: ''
      }));
      return;
    }
    const selectedCust = customerList.find((c) => c._id === selectedId);
    if (selectedCust) {
      setNewOrderForm((prev) => ({
        ...prev,
        customerId: selectedCust._id,
        customerName: selectedCust.name,
        customerEmail: selectedCust.email,
        shippingAddress: selectedCust.address
          ? `${selectedCust.address}, ${selectedCust.city || ''}`.trim()
          : (selectedCust.city || '')
      }));
    }
  };

  const handleProductSelectChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setNewOrderForm((prev) => ({
        ...prev,
        productId: '',
        product: '',
        totalAmount: ''
      }));
      return;
    }
    const selectedProd = productList.find((p) => p._id === selectedId);
    if (selectedProd) {
      const qty = Number(newOrderForm.quantity || 1);
      const computedTotal = (Number(selectedProd.price || 0) * qty).toFixed(2);
      setNewOrderForm((prev) => ({
        ...prev,
        productId: selectedProd._id,
        product: selectedProd.name,
        totalAmount: computedTotal
      }));
    }
  };

  const handleQuantityChange = (qtyVal) => {
    const num = Math.max(1, Number(qtyVal) || 1);
    setNewOrderForm((prev) => {
      const selectedProd = productList.find((p) => p._id === prev.productId);
      const computedTotal = selectedProd
        ? (Number(selectedProd.price || 0) * num).toFixed(2)
        : prev.totalAmount;
      return {
        ...prev,
        quantity: num,
        totalAmount: computedTotal
      };
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!isVerified) {
      setError('Action Restricted: Your seller account is unverified. Admin verification is required to update order status.');
      return;
    }
    try {
      setUpdatingId(orderId);
      await orderService.updateStatus(orderId, newStatus);
      setSuccessMsg(`Order status updated to ${newStatus}`);
      fetchOrders();
      fetchProductList();
      fetchCustomerList();
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteId) return;
    if (!isVerified) {
      setError('Action Restricted: Your seller account is unverified. Admin verification is required to cancel or delete orders.');
      setDeleteId(null);
      return;
    }
    try {
      await orderService.delete(deleteId);
      setSuccessMsg('Order has been cancelled / deleted.');
      setDeleteId(null);
      fetchOrders();
      fetchProductList();
      fetchCustomerList();
    } catch (err) {
      console.error('Delete order error:', err);
      alert('Failed to delete order.');
    }
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (isAdmin) {
      alert('Action Restricted: Platform Admins manage sellers only and cannot place orders.');
      return;
    }
    if (!isVerified) {
      alert('Action Restricted: Your seller account is unverified. Admin verification is required to create orders.');
      return;
    }
    if (!newOrderForm.customerId) {
      alert('Only registered customers can place orders. Please select a registered customer.');
      return;
    }
    if (!newOrderForm.customerName || !newOrderForm.product || !newOrderForm.totalAmount) {
      alert('Please fill product and total amount.');
      return;
    }

    // Stock availability validation
    if (newOrderForm.productId) {
      const selectedProd = productList.find((p) => p._id === newOrderForm.productId);
      if (selectedProd && selectedProd.stock < newOrderForm.quantity) {
        alert(`Insufficient stock! Only ${selectedProd.stock} units available for "${selectedProd.name}".`);
        return;
      }
    }

    try {
      setCreatingOrder(true);
      await orderService.create(newOrderForm);
      setSuccessMsg('New order created successfully! Stock and customer spending updated.');
      setShowAddModal(false);
      setNewOrderForm(initialOrderForm);
      fetchOrders();
      fetchProductList();
      fetchCustomerList();
    } catch (err) {
      console.error('Create order error:', err);
      alert(err.response?.data?.message || 'Failed to create order');
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
          {!isAdmin && (
            <button
              className={`btn d-flex align-items-center gap-2 shadow-sm ${
                !isVerified ? 'btn-secondary opacity-75' : 'btn-amazon-primary'
              }`}
              onClick={() => {
                if (!isVerified) {
                  setError('Action Restricted: Your seller account is unverified. Admin approval is required to create new orders.');
                  return;
                }
                setShowAddModal(true);
              }}
              title={!isVerified ? 'Admin verification required to create orders' : 'Create New Order'}
            >
              <i className={!isVerified ? 'bi bi-lock-fill' : 'bi bi-plus-lg'}></i>
              <span>{!isVerified ? 'Create Order (Locked)' : 'Create New Order'}</span>
            </button>
          )}
          <button
            onClick={fetchOrders}
            className="btn btn-outline-secondary d-flex align-items-center gap-1"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Unverified Seller Notification */}
      {!isAdmin && !isVerified && (
        <div className="alert alert-warning border border-warning shadow-sm rounded-3 d-flex align-items-center gap-3 p-3 mb-4">
          <i className="bi bi-shield-exclamation fs-3 text-warning"></i>
          <div>
            <div className="fw-bold text-dark">Order Fulfillment Actions Restricted</div>
            <small className="text-secondary">
              Your account is awaiting Admin verification. You can review past orders, but creating new orders, advancing fulfillment statuses, and cancellations are locked.
            </small>
          </div>
        </div>
      )}


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
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold text-dark">{o.customerName}</span>
                        {o.customerId && (
                          <span
                            className="badge bg-success-subtle text-success border border-success-subtle py-0.5 px-1.5"
                            title="Linked Registered Customer"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <i className="bi bi-check-circle-fill me-1"></i>Linked
                          </span>
                        )}
                      </div>
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
                      ₹{Number(o.totalAmount || 0).toFixed(2)}
                    </td>

                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {new Date(o.orderDate).toLocaleDateString()}
                    </td>

                    <td>
                      {/* Status select dropdown */}
                      <select
                        className={`form-select form-select-sm fw-semibold ${getStatusBadge(o.status)} ${!isVerified ? 'opacity-75' : ''}`}
                        style={{ width: '135px', cursor: !isVerified ? 'not-allowed' : 'pointer' }}
                        value={o.status}
                        disabled={!isVerified || updatingId === o._id}
                        title={!isVerified ? 'Account unverified — Status changes are locked' : 'Change Order Status'}
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
                          className={`btn btn-outline-danger ${!isVerified ? 'disabled opacity-50' : ''}`}
                          onClick={() => setDeleteId(o._id)}
                          disabled={!isVerified}
                          title={!isVerified ? 'Account unverified — Cancel/Delete is locked' : 'Cancel/Delete Order'}
                        >
                          <i className={`bi ${!isVerified ? 'bi-lock-fill' : 'bi-trash'}`}></i>
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
                  {/* Registered Customer Selection (Required) */}
                  <div className="mb-3 p-3 bg-light rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold small text-dark mb-0">
                        <i className="bi bi-person-check-fill text-primary me-1"></i>
                        Select Registered Customer *
                      </label>
                      <span className="badge bg-danger-subtle text-danger">Required</span>
                    </div>
                    <select
                      className="form-select form-select-sm mt-2"
                      value={newOrderForm.customerId || ''}
                      onChange={handleCustomerSelectChange}
                      required
                    >
                      <option value="">-- Choose Registered Customer --</option>
                      {customerList.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.email}) {c.city ? `• ${c.city}` : ''}
                        </option>
                      ))}
                    </select>
                    {customerList.length === 0 ? (
                      <div className="text-danger mt-1 small">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        No registered customer found! Please add a customer first in the Customer section.
                      </div>
                    ) : (
                      <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                        Only verified & registered customers can place an order.
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Customer Full Name *</label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      placeholder="Auto-filled from registered customer"
                      value={newOrderForm.customerName}
                      readOnly
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Customer Email *</label>
                    <input
                      type="email"
                      className="form-control bg-light"
                      placeholder="Auto-filled from registered customer"
                      value={newOrderForm.customerEmail}
                      readOnly
                      required
                    />
                  </div>

                  {/* Product Inventory Select */}
                  <div className="mb-3 p-3 bg-light rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold small text-dark mb-0">
                        <i className="bi bi-box-seam text-primary me-1"></i>
                        Select Product from Inventory
                      </label>
                      <span className="badge bg-primary-subtle text-primary">Live Stock</span>
                    </div>
                    <select
                      className="form-select form-select-sm mt-2"
                      value={newOrderForm.productId || ''}
                      onChange={handleProductSelectChange}
                    >
                      <option value="">-- Manual Entry / Custom Product --</option>
                      {productList.map((p) => (
                        <option key={p._id} value={p._id} disabled={p.stock <= 0}>
                          {p.name} — ₹{Number(p.price).toFixed(2)} ({p.stock > 0 ? `Stock: ${p.stock}` : 'OUT OF STOCK'})
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const sel = productList.find((p) => p._id === newOrderForm.productId);
                      if (!sel) return null;
                      return (
                        <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top small">
                          <span className="text-muted">
                            Unit Price: <strong className="text-dark">₹{Number(sel.price).toFixed(2)}</strong>
                          </span>
                          <span
                            className={`badge ${
                              sel.stock > 5
                                ? 'bg-success-subtle text-success'
                                : sel.stock > 0
                                ? 'bg-warning-subtle text-warning'
                                : 'bg-danger-subtle text-danger'
                            }`}
                          >
                            <i className="bi bi-layers me-1"></i>
                            {sel.stock > 0 ? `${sel.stock} Units in Stock` : 'Out of Stock'}
                          </span>
                        </div>
                      );
                    })()}
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
                        max={(() => {
                          const sel = productList.find((p) => p._id === newOrderForm.productId);
                          return sel ? sel.stock : undefined;
                        })()}
                        className="form-control"
                        value={newOrderForm.quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Total Amount (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        placeholder="1999.00"
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
                  <div className="text-center">
                    <span className="text-muted small">Seller / Store</span>
                    <div>
                      <span className="badge bg-dark-subtle text-dark fw-semibold border px-2 py-1">
                        <i className="bi bi-shop me-1 text-primary"></i>
                        {viewOrder.sellerName || (viewOrder.seller?.storeName || 'Amazon Seller Store')}
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="text-muted small">Total Paid</span>
                    <h4 className="fw-bold text-dark mb-0">
                      ₹{Number(viewOrder.totalAmount || 0).toFixed(2)}
                    </h4>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-2">Item Information</h6>
                  <div className="p-3 bg-light rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="fw-semibold text-dark">{viewOrder.product}</div>
                      {viewOrder.productId ? (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                          <i className="bi bi-box-seam me-1"></i>
                          Catalog Item {viewOrder.productId.category ? `(${viewOrder.productId.category})` : ''}
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-muted">Custom Item</span>
                      )}
                    </div>
                    <div className="text-muted small mt-2 d-flex justify-content-between align-items-center">
                      <span>
                        Ordered Quantity: <strong className="text-dark">{viewOrder.quantity || 1}</strong>
                      </span>
                      {viewOrder.productId?.stock !== undefined && (
                        <span className="badge bg-light text-dark border">
                          Live Stock Remaining: <strong>{viewOrder.productId.stock}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-2">Customer & Shipping</h6>
                  <div className="p-3 bg-light rounded-3 small">
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                      <div><strong>Customer Name:</strong> {viewOrder.customerName}</div>
                      {viewOrder.customerId ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          <i className="bi bi-patch-check-fill me-1"></i> Registered Customer
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-muted">
                          Guest / Manual Order
                        </span>
                      )}
                    </div>
                    <div><strong>Email:</strong> {viewOrder.customerEmail}</div>
                    {viewOrder.customerId?.phone && (
                      <div><strong>Phone:</strong> {viewOrder.customerId.phone}</div>
                    )}
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
