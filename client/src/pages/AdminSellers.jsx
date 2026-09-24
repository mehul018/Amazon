import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

const AdminSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, unverified: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'verified' | 'unverified'
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'danger', message: '' }

  // Fetch sellers
  const fetchSellers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await adminService.getSellers(params);
      if (res.data?.success) {
        setSellers(res.data.data.sellers || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching sellers:', err);
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to load sellers list'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSellers();
  };

  // Toggle Verification status (Admin Right)
  const handleToggleVerification = async (seller) => {
    const targetStatus = !seller.isVerified;
    const actionName = targetStatus ? 'verify' : 'unverify';

    setActionLoading((prev) => ({ ...prev, [seller._id]: true }));
    setFeedback(null);

    try {
      const res = await adminService.updateSellerVerification(seller._id, targetStatus);
      if (res.data?.success) {
        // Update seller locally in list
        setSellers((prev) =>
          prev.map((s) =>
            s._id === seller._id
              ? {
                  ...s,
                  isVerified: targetStatus,
                  verificationStatus: targetStatus ? 'verified' : 'unverified',
                  verificationDate: targetStatus ? new Date() : null
                }
              : s
          )
        );

        // Update stats
        setStats((prev) => ({
          ...prev,
          verified: targetStatus ? prev.verified + 1 : Math.max(0, prev.verified - 1),
          unverified: targetStatus ? Math.max(0, prev.unverified - 1) : prev.unverified + 1
        }));

        setFeedback({
          type: 'success',
          message: res.data.message || `Seller "${seller.storeName}" has been successfully ${targetStatus ? 'Verified' : 'Unverified'}.`
        });
      }
    } catch (err) {
      console.error('Error toggling verification:', err);
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || `Failed to ${actionName} seller`
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [seller._id]: false }));
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-danger text-white px-2 py-1">Admin Privilege</span>
            <h3 className="fw-bold text-dark mb-0">Seller Verification & Directory</h3>
          </div>
          <p className="text-muted mb-0 small">
            Verify newly registered merchants, review active store partners, and manage seller permissions.
          </p>
        </div>
        <button
          onClick={fetchSellers}
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 align-self-start align-self-md-auto"
          disabled={loading}
        >
          <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
          <span>Refresh List</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        {/* Total Sellers */}
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>
                  Total Sellers
                </span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{stats.total}</h3>
                <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                  Registered on platform
                </small>
              </div>
              <div
                className="rounded-3 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <i className="bi bi-shop fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Sellers */}
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>
                  Verified Partners
                </span>
                <h3 className="fw-bold text-success mt-1 mb-0">{stats.verified}</h3>
                <small className="text-success fw-medium" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-check-circle-fill me-1"></i>
                  Approved & Selling
                </small>
              </div>
              <div
                className="rounded-3 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <i className="bi bi-patch-check-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Unverified / Pending Sellers */}
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>
                  Unverified / Pending
                </span>
                <h3 className="fw-bold text-warning mt-1 mb-0">{stats.unverified}</h3>
                <small className="text-warning-emphasis fw-medium" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-hourglass-split me-1"></i>
                  Action Required by Admin
                </small>
              </div>
              <div
                className="rounded-3 bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <i className="bi bi-exclamation-octagon-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast/Alert */}
      {feedback && (
        <AlertBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Search & Filter Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white">
        <div className="card-body p-3">
          <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between">
            {/* Filter Tabs */}
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm px-3 fw-medium ${
                  filterStatus === 'all' ? 'btn-dark' : 'btn-outline-secondary'
                }`}
                onClick={() => setFilterStatus('all')}
              >
                All Sellers ({stats.total})
              </button>
              <button
                type="button"
                className={`btn btn-sm px-3 fw-medium ${
                  filterStatus === 'verified' ? 'btn-success text-white' : 'btn-outline-secondary'
                }`}
                onClick={() => setFilterStatus('verified')}
              >
                <i className="bi bi-patch-check-fill me-1"></i>
                Verified ({stats.verified})
              </button>
              <button
                type="button"
                className={`btn btn-sm px-3 fw-medium ${
                  filterStatus === 'unverified' ? 'btn-warning text-dark' : 'btn-outline-secondary'
                }`}
                onClick={() => setFilterStatus('unverified')}
              >
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                Unverified ({stats.unverified})
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
              <div className="input-group input-group-sm" style={{ maxWidth: '300px' }}>
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search store, seller, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-sm btn-dark">
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setTimeout(fetchSellers, 0);
                  }}
                >
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
        <div className="card-header bg-white border-bottom py-3 px-3 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold text-dark">
            <i className="bi bi-people-fill text-primary me-2"></i>
            Registered Merchant Partners
          </h6>
          <span className="text-muted small">Showing {sellers.length} records</span>
        </div>

        {loading ? (
          <div className="p-5">
            <LoadingSpinner message="Loading seller directory..." />
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-2">
              <i className="bi bi-person-x text-muted" style={{ fontSize: '3rem' }}></i>
            </div>
            <h5 className="text-dark fw-bold">No Sellers Found</h5>
            <p className="text-muted small mb-0">
              {filterStatus !== 'all'
                ? `There are currently no ${filterStatus} sellers matching your filter.`
                : 'No seller accounts have registered on the platform yet.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3" style={{ fontSize: '0.8rem', width: '25%' }}>STORE & MERCHANT</th>
                  <th style={{ fontSize: '0.8rem', width: '22%' }}>CATEGORY & WHAT THEY SELL</th>
                  <th style={{ fontSize: '0.8rem', width: '20%' }}>EMAIL & CONTACT</th>
                  <th style={{ fontSize: '0.8rem', width: '15%' }}>STATUS</th>
                  <th className="text-end pe-3" style={{ fontSize: '0.8rem', width: '18%' }}>ADMIN ACTION</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => {
                  const isBusy = actionLoading[seller._id];
                  return (
                    <tr key={seller._id}>
                      {/* Store & Merchant */}
                      <td className="ps-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm ${
                              seller.isVerified
                                ? 'bg-success bg-opacity-10 text-success'
                                : 'bg-warning bg-opacity-10 text-warning'
                            }`}
                            style={{ width: 40, height: 40, fontSize: '1rem' }}
                          >
                            {seller.storeName ? seller.storeName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="fw-bold text-dark lh-1 mb-1">
                              {seller.storeName || 'Amazon Store'}
                            </div>
                            <small className="text-muted">
                              Owner: <span className="fw-semibold text-secondary">{seller.name}</span>
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* Selling Category & What They Sell */}
                      <td>
                        <div>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill mb-1">
                            <i className="bi bi-tag-fill me-1"></i>
                            {seller.category || 'General Merchandise'}
                          </span>
                          {seller.businessDescription && (
                            <div className="text-secondary small text-truncate" style={{ maxWidth: '240px', fontSize: '0.75rem' }} title={seller.businessDescription}>
                              {seller.businessDescription}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Email & Contact */}
                      <td>
                        <div className="small">
                          <i className="bi bi-envelope me-1 text-muted"></i>
                          <a href={`mailto:${seller.email}`} className="text-decoration-none text-dark">
                            {seller.email}
                          </a>
                        </div>
                        {seller.phone && (
                          <div className="text-muted small mt-1">
                            <i className="bi bi-telephone me-1"></i>
                            {seller.phone}
                          </div>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td>
                        {seller.isVerified ? (
                          <div>
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1">
                              <i className="bi bi-patch-check-fill"></i>
                              <span>Verified</span>
                            </span>
                            {seller.verificationDate && (
                              <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                                Verified on {new Date(seller.verificationDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1">
                            <i className="bi bi-exclamation-circle-fill text-warning"></i>
                            <span>Unverified</span>
                          </span>
                        )}
                      </td>

                      {/* Action Button: Verify / Unverify */}
                      <td className="text-end pe-3">
                        {seller.isVerified ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning text-dark fw-semibold d-inline-flex align-items-center gap-1 px-3 shadow-sm"
                            onClick={() => handleToggleVerification(seller)}
                            disabled={isBusy}
                            title="Revoke verification status"
                          >
                            {isBusy ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              <>
                                <i className="bi bi-x-circle text-warning"></i>
                                <span>Unverify</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-success fw-semibold d-inline-flex align-items-center gap-1 px-3 shadow-sm"
                            onClick={() => handleToggleVerification(seller)}
                            disabled={isBusy}
                            title="Grant verified merchant status"
                          >
                            {isBusy ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              <>
                                <i className="bi bi-patch-check"></i>
                                <span>Verify Seller</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSellers;
