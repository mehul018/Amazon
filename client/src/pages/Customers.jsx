import React, { useState, useEffect } from 'react';
import { customerService, orderService, productService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';

const initialCustomerForm = {
  name: '',
  email: '',
  phone: '',
  city: '',
  address: ''
};

const Customers = () => {
  const { user, isAdmin, isVerified } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteCustomerData, setDeleteCustomerData] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  // Add customer modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState(initialCustomerForm);
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Place Order for Customer modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderCustomer, setOrderCustomer] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [orderForm, setOrderForm] = useState({
    productId: '',
    product: '',
    quantity: 1,
    totalAmount: '',
    shippingAddress: '',
    paymentMethod: 'Credit Card',
    status: 'Pending'
  });
  const [placingOrder, setPlacingOrder] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchTerm) params.search = searchTerm;

      const res = await customerService.getAll(params);
      if (res.data?.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customer list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const fetchProductsList = async () => {
    try {
      const params = (!isAdmin && user?._id) ? { sellerId: user._id } : {};
      const res = await productService.getAll(params);
      if (res.data?.success) {
        setProductsList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching products for order:', err);
    }
  };

  const handleOpenPlaceOrder = (customer) => {
    if (isAdmin) {
      alert('Action Restricted: Platform Admins manage sellers only and cannot place orders.');
      return;
    }
    if (!isVerified) {
      alert('Action Restricted: Your seller account is unverified. Admin verification is required to place customer orders.');
      return;
    }
    setOrderCustomer(customer);
    setOrderForm({
      productId: '',
      product: '',
      quantity: 1,
      totalAmount: '',
      shippingAddress: customer.address
        ? `${customer.address}, ${customer.city || ''}`.trim()
        : customer.city || 'Seattle, WA',
      paymentMethod: 'Credit Card',
      status: 'Pending'
    });
    fetchProductsList();
    setShowOrderModal(true);
  };

  const handleProductSelectChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setOrderForm((prev) => ({
        ...prev,
        productId: '',
        product: '',
        totalAmount: ''
      }));
      return;
    }
    const selectedProd = productsList.find((p) => p._id === selectedId);
    if (selectedProd) {
      const qty = Number(orderForm.quantity || 1);
      const computedTotal = (Number(selectedProd.price || 0) * qty).toFixed(2);
      setOrderForm((prev) => ({
        ...prev,
        productId: selectedProd._id,
        product: selectedProd.name,
        totalAmount: computedTotal
      }));
    }
  };

  const handleQuantityChange = (qtyVal) => {
    const num = Math.max(1, Number(qtyVal) || 1);
    setOrderForm((prev) => {
      const selectedProd = productsList.find((p) => p._id === prev.productId);
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

  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    if (isAdmin) {
      alert('Action Restricted: Platform Admins manage sellers only and cannot place orders.');
      return;
    }
    if (!isVerified) {
      alert('Action Restricted: Your seller account is unverified. Admin verification is required to place customer orders.');
      return;
    }
    if (!orderCustomer?._id) {
      alert('Invalid customer selected');
      return;
    }
    if (!orderForm.product || !orderForm.totalAmount) {
      alert('Please select a product and confirm amount.');
      return;
    }

    if (orderForm.productId) {
      const selectedProd = productsList.find((p) => p._id === orderForm.productId);
      if (selectedProd && selectedProd.stock < orderForm.quantity) {
        alert(`Insufficient stock! Only ${selectedProd.stock} units available for "${selectedProd.name}".`);
        return;
      }
    }

    try {
      setPlacingOrder(true);
      await orderService.create({
        customerId: orderCustomer._id,
        customerName: orderCustomer.name,
        customerEmail: orderCustomer.email,
        product: orderForm.product,
        productId: orderForm.productId || undefined,
        quantity: orderForm.quantity,
        totalAmount: orderForm.totalAmount,
        status: orderForm.status,
        shippingAddress: orderForm.shippingAddress,
        paymentMethod: orderForm.paymentMethod
      });

      setSuccessMsg(`Order placed successfully for ${orderCustomer.name}! Customer stats updated.`);
      setShowOrderModal(false);
      fetchCustomers();
      if (selectedCustomer?.customer?._id === orderCustomer._id) {
        handleViewCustomer(orderCustomer._id);
      }
    } catch (err) {
      console.error('Place order error:', err);
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleViewCustomer = async (id) => {
    try {
      const res = await customerService.getById(id);
      if (res.data?.success) {
        setSelectedCustomer(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      alert('Failed to load customer details');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerData) return;
    if (!isVerified) {
      alert('Action Restricted: Your seller account is unverified. Admin verification is required to delete customers.');
      return;
    }
    try {
      setDeletingCustomer(true);
      await customerService.delete(deleteCustomerData._id);
      setSuccessMsg(`Customer "${deleteCustomerData.name}" has been deleted.`);
      setDeleteCustomerData(null);
      fetchCustomers();
    } catch (err) {
      console.error('Delete customer error:', err);
      alert(err.response?.data?.message || 'Failed to delete customer');
    } finally {
      setDeletingCustomer(false);
    }
  };

  const handleCreateCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      alert('Action Restricted: Your seller account is unverified. Admin verification is required to add customers.');
      return;
    }
    if (!newCustomerForm.name || !newCustomerForm.email || !newCustomerForm.phone) {
      alert('Please fill customer name, email and phone.');
      return;
    }
    try {
      setSavingCustomer(true);
      await customerService.create(newCustomerForm);
      setSuccessMsg('New customer account created successfully!');
      setShowAddModal(false);
      setNewCustomerForm(initialCustomerForm);
      fetchCustomers();
    } catch (err) {
      console.error('Create customer error:', err);
      alert(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'Shipped':
        return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'Confirmed':
        return 'bg-info-subtle text-info border border-info-subtle';
      case 'Cancelled':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      default:
        return 'bg-warning-subtle text-warning border border-warning-subtle';
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1">Customer Accounts</h3>
          <p className="text-muted mb-0 small">
            View registered shoppers, their order frequency and lifetime spending.
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
                  setError('Action Restricted: Your seller account is unverified. Admin approval is required to add customers.');
                  return;
                }
                setShowAddModal(true);
              }}
              title={!isVerified ? 'Admin verification required to add customers' : 'Add Customer'}
            >
              <i className={!isVerified ? 'bi bi-lock-fill' : 'bi bi-person-plus-fill'}></i>
              <span>{!isVerified ? 'Add Customer (Locked)' : 'Add Customer'}</span>
            </button>
          )}
          <button
            onClick={fetchCustomers}
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
            <div className="fw-bold text-dark">Customer Directory Management Restricted</div>
            <small className="text-secondary">
              Your seller account is awaiting Admin verification. You can view customer profiles and order histories, but registering new customers, placing customer orders, and deletions are locked.
            </small>
          </div>
        </div>
      )}

      <AlertBanner message={error} type="danger" onClose={() => setError(null)} />
      <AlertBanner message={successMsg} type="success" onClose={() => setSuccessMsg(null)} />

      {/* Search Input Bar */}
      <div className="amz-card mb-4">
        <form onSubmit={handleSearchSubmit} className="input-group" style={{ maxWidth: '500px' }}>
          <span className="input-group-text bg-light border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Search by customer name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-dark px-3">
            Search
          </button>
        </form>
      </div>

      {/* Customer Directory Table */}
      <div className="amz-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 text-dark">
            Customer Directory <span className="text-muted fs-6 fw-normal">({customers.length} total)</span>
          </h5>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading customer directory..." />
        ) : customers.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
            <h5 className="fw-bold mt-3">No Customers Found</h5>
            <p className="text-muted small">Try searching with a different name or add a new customer.</p>
            <button className="btn btn-sm btn-amazon-primary mt-2" onClick={() => setShowAddModal(true)}>
              Add Customer
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="amz-table align-middle">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Orders</th>
                  <th>Total Spending</th>
                  <th>Location</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center"
                          style={{ width: 36, height: 36, fontSize: '0.85rem' }}
                        >
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="fw-semibold text-dark">{c.name}</div>
                      </div>
                    </td>

                    <td className="text-muted">{c.email}</td>

                    <td className="text-muted">{c.phone}</td>

                    <td>
                      <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-semibold">
                        {c.totalOrders || 0} Orders
                      </span>
                    </td>

                    <td className="fw-bold text-dark">
                      ₹{Number(c.totalSpending || 0).toFixed(2)}
                    </td>

                    <td className="text-muted">
                      {c.city || 'United States'}
                    </td>

                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className={`btn ${!isVerified ? 'btn-secondary opacity-75' : 'btn-amazon-primary'}`}
                          onClick={() => handleOpenPlaceOrder(c)}
                          disabled={!isVerified}
                          title={!isVerified ? 'Account unverified — Ordering is locked' : 'Place Order for Customer'}
                        >
                          <i className={`bi ${!isVerified ? 'bi-lock-fill' : 'bi-cart-plus'} me-1`}></i>
                          <span>{!isVerified ? 'Locked' : 'Order'}</span>
                        </button>
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleViewCustomer(c._id)}
                          title="View Details"
                        >
                          <i className="bi bi-eye me-1"></i>
                          <span>Details</span>
                        </button>
                        <button
                          className={`btn btn-outline-danger ${!isVerified ? 'disabled opacity-50' : ''}`}
                          onClick={() => setDeleteCustomerData(c)}
                          disabled={!isVerified}
                          title={!isVerified ? 'Account unverified — Delete is locked' : 'Delete Customer'}
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">Register New Customer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateCustomerSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rachel Green"
                      value={newCustomerForm.name}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="rachel@example.com"
                      value={newCustomerForm.email}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+1 (555) 123-4567"
                      value={newCustomerForm.phone}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">City / Location</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. New York, NY"
                      value={newCustomerForm.city}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 90 Bedford St"
                      value={newCustomerForm.address}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
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
                    disabled={savingCustomer}
                  >
                    {savingCustomer ? 'Saving...' : 'Add Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile & Orders History Modal */}
      {selectedCustomer && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">
                  Customer Profile: {selectedCustomer.customer?.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedCustomer(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-4">
                    <div className="p-3 bg-light rounded-3 text-center">
                      <div className="text-muted small">Total Orders</div>
                      <h3 className="fw-bold text-dark mt-1">
                        {selectedCustomer.customer?.totalOrders || 0}
                      </h3>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="p-3 bg-light rounded-3 text-center">
                      <div className="text-muted small">Lifetime Spend</div>
                      <h3 className="fw-bold text-success mt-1">
                        ₹{Number(selectedCustomer.customer?.totalSpending || 0).toFixed(2)}
                      </h3>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="p-3 bg-light rounded-3 text-center">
                      <div className="text-muted small">City Location</div>
                      <h5 className="fw-bold text-dark mt-2">
                        {selectedCustomer.customer?.city || 'Seattle'}
                      </h5>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-2">Contact & Shipping Info</h6>
                  <div className="p-3 bg-light rounded-3 small">
                    <div><strong>Email:</strong> {selectedCustomer.customer?.email}</div>
                    <div><strong>Phone:</strong> {selectedCustomer.customer?.phone}</div>
                    <div><strong>Address:</strong> {selectedCustomer.customer?.address || 'Standard Residential Address'}</div>
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-dark mb-0">Past Purchases / Linked Orders</h6>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      {selectedCustomer.orders?.length || 0} Orders
                    </span>
                  </div>
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm align-middle table-bordered mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Order ID</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCustomer.orders.map((o) => (
                            <tr key={o._id}>
                              <td className="fw-bold text-primary">{o.orderId}</td>
                              <td>{o.product}</td>
                              <td className="fw-semibold">₹{o.totalAmount?.toFixed(2)}</td>
                              <td className="small text-muted">{new Date(o.orderDate).toLocaleDateString()}</td>
                              <td>
                                <span className={`badge ${getOrderStatusBadge(o.status)}`}>
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted bg-light rounded-3">
                      <i className="bi bi-cart-x text-muted fs-4 d-block mb-1"></i>
                      No linked orders found for this customer account.
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer bg-light d-flex justify-content-between">
                <div>
                  <button
                    type="button"
                    className={`btn btn-sm btn-outline-danger ${!isVerified ? 'disabled opacity-50' : ''}`}
                    disabled={!isVerified}
                    title={!isVerified ? 'Account unverified — Delete is locked' : 'Delete Customer'}
                    onClick={() => {
                      if (!isVerified) return;
                      const toDelete = selectedCustomer.customer;
                      setSelectedCustomer(null);
                      setDeleteCustomerData(toDelete);
                    }}
                  >
                    <i className={`bi ${!isVerified ? 'bi-lock-fill' : 'bi-trash'} me-1`}></i> Delete Customer
                  </button>
                </div>
                <div className="d-flex gap-2">
                  {!isAdmin && (
                    <button
                      type="button"
                      className={`btn btn-sm d-flex align-items-center gap-1 ${
                        !isVerified ? 'btn-secondary opacity-75' : 'btn-amazon-primary'
                      }`}
                      disabled={!isVerified}
                      title={!isVerified ? 'Account unverified — Ordering is locked' : 'Place Order for Customer'}
                      onClick={() => {
                        if (!isVerified) {
                          alert('Action Restricted: Your seller account is unverified. Admin verification is required to place customer orders.');
                          return;
                        }
                        const cust = selectedCustomer.customer;
                        handleOpenPlaceOrder(cust);
                      }}
                    >
                      <i className={`bi ${!isVerified ? 'bi-lock-fill' : 'bi-cart-plus'}`}></i>
                      <span>{!isVerified ? 'Order (Locked)' : 'Place Order for Customer'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deleteCustomerData && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger-subtle">
                <h5 className="modal-title text-danger fw-bold">
                  <i className="bi bi-person-x me-2"></i>Delete Customer Account
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteCustomerData(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-2">
                  Are you sure you want to delete customer <strong>"{deleteCustomerData.name}"</strong> ({deleteCustomerData.email})?
                </p>
                <div className="alert alert-warning small mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                  <div>
                    This action will remove the customer profile from your directory. Any previous orders will be preserved for store revenue and sales analytics, but will be unlinked.
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={deletingCustomer}
                  onClick={() => setDeleteCustomerData(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  disabled={deletingCustomer}
                  onClick={handleDeleteCustomer}
                >
                  {deletingCustomer ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Place Order for Customer Modal */}
      {showOrderModal && orderCustomer && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-amazon-dark text-white">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center fw-bold" style={{ width: 32, height: 32 }}>
                    <i className="bi bi-cart-plus-fill"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1rem' }}>
                      Place Order for Customer
                    </h5>
                    <small className="text-white-50" style={{ fontSize: '0.75rem' }}>
                      Ordering on behalf of {orderCustomer.name}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowOrderModal(false)}
                ></button>
              </div>

              <form onSubmit={handlePlaceOrderSubmit}>
                <div className="modal-body p-4">
                  {/* Customer Badge Banner */}
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="fw-bold text-dark d-flex align-items-center gap-2">
                        <i className="bi bi-person-check-fill text-success"></i>
                        <span>{orderCustomer.name}</span>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        Registered Shopper
                      </span>
                    </div>
                    <div className="text-muted small">
                      <div><i className="bi bi-envelope me-1"></i>{orderCustomer.email}</div>
                      {orderCustomer.phone && <div><i className="bi bi-telephone me-1"></i>{orderCustomer.phone}</div>}
                    </div>
                  </div>

                  {/* Seller Store Context Banner */}
                  {!isAdmin && (
                    <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-shop text-primary fs-5"></i>
                      <div>
                        Ordering from Store: <strong>{user?.storeName || user?.name || 'Your Store'}</strong>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>Customers can only order products from your store inventory.</div>
                      </div>
                    </div>
                  )}

                  {/* Product Inventory Select */}
                  <div className="mb-3 p-3 bg-light rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold small text-dark mb-0">
                        <i className="bi bi-box-seam text-primary me-1"></i>
                        Select Product from Catalog *
                      </label>
                      <span className="badge bg-primary-subtle text-primary">Live Stock</span>
                    </div>
                    <select
                      className="form-select form-select-sm mt-2"
                      value={orderForm.productId || ''}
                      onChange={handleProductSelectChange}
                    >
                      <option value="">
                        {productsList.length === 0
                          ? '-- No Products Found in Your Store (Add products first) --'
                          : '-- Choose Product from Your Catalog --'}
                      </option>
                      {productsList.map((p) => (
                        <option key={p._id} value={p._id} disabled={p.stock <= 0}>
                          {p.name} {p.brand ? `(${p.brand})` : ''} — ₹{Number(p.price).toFixed(2)} ({p.stock > 0 ? `Stock: ${p.stock}` : 'OUT OF STOCK'})
                        </option>
                      ))}
                    </select>

                    {(() => {
                      const sel = productsList.find((p) => p._id === orderForm.productId);
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
                            {sel.stock > 0 ? `${sel.stock} Units in Stock` : 'Out of Stock'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Manual Product Name (fallback / display) */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark">Product Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Wireless Headphones"
                      value={orderForm.product}
                      onChange={(e) => setOrderForm({ ...orderForm, product: e.target.value })}
                      required
                    />
                  </div>

                  {/* Quantity and Total Amount */}
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-dark">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        max={(() => {
                          const sel = productsList.find((p) => p._id === orderForm.productId);
                          return sel ? sel.stock : undefined;
                        })()}
                        className="form-control"
                        value={orderForm.quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
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
                        placeholder="0.00"
                        value={orderForm.totalAmount}
                        onChange={(e) => setOrderForm({ ...orderForm, totalAmount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark">Shipping Address *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Street, City, Postal Code"
                      value={orderForm.shippingAddress}
                      onChange={(e) => setOrderForm({ ...orderForm, shippingAddress: e.target.value })}
                      required
                    />
                  </div>

                  {/* Payment Method & Initial Status */}
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-dark">Payment Method</label>
                      <select
                        className="form-select form-select-sm"
                        value={orderForm.paymentMethod}
                        onChange={(e) => setOrderForm({ ...orderForm, paymentMethod: e.target.value })}
                      >
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="UPI / Net Banking">UPI / Net Banking</option>
                        <option value="Amazon Pay">Amazon Pay</option>
                        <option value="Cash on Delivery">Cash on Delivery</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-dark">Initial Status</label>
                      <select
                        className="form-select form-select-sm"
                        value={orderForm.status}
                        onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
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
                    disabled={placingOrder}
                  >
                    {placingOrder ? 'Placing Order...' : 'Confirm & Place Order'}
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

export default Customers;
