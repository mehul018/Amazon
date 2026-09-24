import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isVerified, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div
          className={`sidebar-logo-icon ${
            isAdmin ? 'bg-danger text-white' : 'bg-warning text-dark'
          }`}
        >
          <span>{isAdmin ? <i className="bi bi-shield-lock-fill fs-6"></i> : 'a'}</span>
        </div>
        <div>
          <div className="fw-bold text-white fs-6 lh-1">
            {isAdmin ? 'Amazon Admin' : 'Amazon Seller'}
          </div>
          <small className="text-secondary" style={{ fontSize: '0.72rem' }}>
            {isAdmin ? 'Platform Console' : 'Central Dashboard'}
          </small>
        </div>
        {/* Mobile close toggle */}
        <button
          className="btn btn-sm text-white-50 d-lg-none ms-auto"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        {/* Admin Navigation Section */}
        {isAdmin && (
          <>
            <div className="nav-category text-danger-emphasis">
              <i className="bi bi-shield-check me-1"></i> Admin Controls
            </div>

            <NavLink
              to="/admin/sellers"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className="bi bi-people-fill text-warning"></i>
              <span>Manage Sellers</span>
              <span className="badge bg-danger rounded-pill ms-auto" style={{ fontSize: '0.65rem' }}>
                Admin
              </span>
            </NavLink>
          </>
        )}

        <div className="nav-category mt-2">Main Menu</div>

        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-grid-1x2-fill"></i>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-box-seam-fill"></i>
          <span>Products</span>
          {!isAdmin && !isVerified && (
            <span className="badge bg-secondary bg-opacity-50 text-white-50 ms-auto" style={{ fontSize: '0.62rem' }} title="Actions restricted">
              <i className="bi bi-lock-fill"></i>
            </span>
          )}
        </NavLink>

        {/* Orders link - Only for Sellers */}
        {!isAdmin && (
          <NavLink
            to="/orders"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className="bi bi-receipt-cutoff"></i>
            <span>Orders</span>
            {!isVerified && (
              <span className="badge bg-secondary bg-opacity-50 text-white-50 ms-auto" style={{ fontSize: '0.62rem' }} title="Actions restricted">
                <i className="bi bi-lock-fill"></i>
              </span>
            )}
          </NavLink>
        )}

        <NavLink
          to="/customers"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-people-fill"></i>
          <span>Customers</span>
          {!isAdmin && !isVerified && (
            <span className="badge bg-secondary bg-opacity-50 text-white-50 ms-auto" style={{ fontSize: '0.62rem' }} title="Actions restricted">
              <i className="bi bi-lock-fill"></i>
            </span>
          )}
        </NavLink>

        <NavLink
          to="/sales"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-graph-up-arrow"></i>
          <span>Sales & Reports</span>
        </NavLink>

        <div className="nav-category mt-3">Account & Actions</div>

        <button
          onClick={handleLogout}
          className="sidebar-link w-100 text-start border-0 bg-transparent text-danger-emphasis"
          style={{ cursor: 'pointer' }}
        >
          <i className="bi bi-box-arrow-right text-danger"></i>
          <span className="text-white-50">Logout</span>
        </button>
      </div>

      {/* Sidebar Footer with User / Verification Info */}
      <div className="sidebar-footer">
        <div className="d-flex align-items-center gap-2 mb-2">
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
              isAdmin ? 'bg-danger text-white' : 'bg-warning text-dark'
            }`}
            style={{ width: 34, height: 34, fontSize: '0.85rem' }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : isAdmin ? 'A' : 'S'}
          </div>
          <div className="text-truncate" style={{ maxWidth: '160px' }}>
            <div className="text-white text-truncate fw-medium" style={{ fontSize: '0.85rem' }}>
              {user?.name || (isAdmin ? 'Admin' : 'Seller')}
            </div>
            <div className="text-secondary text-truncate" style={{ fontSize: '0.75rem' }}>
              {isAdmin ? 'System Administrator' : user?.storeName || 'Amazon Seller Store'}
            </div>
          </div>
        </div>

        {/* Seller Category & Verification in Footer */}
        {!isAdmin && (
          <div className="d-flex flex-column gap-1 mt-1">
            {user?.category && (
              <span
                className="badge bg-secondary bg-opacity-25 text-white-50 border border-secondary border-opacity-25 w-100 py-1 text-truncate d-flex align-items-center justify-content-center gap-1"
                style={{ fontSize: '0.68rem' }}
                title={`Selling Category: ${user.category}`}
              >
                <i className="bi bi-tag-fill text-warning"></i>
                <span className="text-truncate">{user.category}</span>
              </span>
            )}
            {isVerified ? (
              <span
                className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 w-100 py-1 d-flex align-items-center justify-content-center gap-1"
                style={{ fontSize: '0.7rem' }}
              >
                <i className="bi bi-patch-check-fill"></i>
                <span>Verified Merchant</span>
              </span>
            ) : (
              <span
                className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-50 w-100 py-1 d-flex align-items-center justify-content-center gap-1"
                style={{ fontSize: '0.7rem' }}
                title="Account unverified — Store actions are restricted"
              >
                <i className="bi bi-shield-lock-fill"></i>
                <span>Unverified (Restricted)</span>
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
