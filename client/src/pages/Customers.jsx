import React, { useState, useEffect } from 'react';
import { customerService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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

  const handleViewCustomer = async (id) => {
    try {
      setModalLoading(true);
      const res = await customerService.getById(id);
      if (res.data?.success) {
        setSelectedCustomer(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      alert('Failed to load customer details');
    } finally {
      setModalLoading(false);
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
        <button
          onClick={fetchCustomers}
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
        >
          <i className="bi bi-arrow-clockwise"></i>
          <span>Refresh Customers</span>
        </button>
      </div>

      <AlertBanner message={error} type="danger" onClose={() => setError(null)} />

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
            <p className="text-muted small">Try searching with a different name or email.</p>
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
                        {c.totalOrders || 1} Orders
                      </span>
                    </td>

                    <td className="fw-bold text-dark">
                      ${Number(c.totalSpending || 0).toFixed(2)}
                    </td>

                    <td className="text-muted">
                      {c.city || 'United States'}
                    </td>

                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleViewCustomer(c._id)}
                      >
                        <i className="bi bi-eye me-1"></i>
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                        ${Number(selectedCustomer.customer?.totalSpending || 0).toFixed(2)}
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
                  <h6 className="fw-bold text-dark mb-2">Past Purchases / Orders</h6>
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
                              <td className="fw-semibold">${o.totalAmount?.toFixed(2)}</td>
                              <td className="small text-muted">{new Date(o.orderDate).toLocaleDateString()}</td>
                              <td>
                                <span className="badge bg-secondary-subtle text-dark">
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-muted bg-light rounded-3">
                      No linked orders found for this email address.
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
