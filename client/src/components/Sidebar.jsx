import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-logo-icon">
          <span>a</span>
        </div>
        <div>
          <div className="fw-bold text-white fs-6 lh-1">Amazon Seller</div>
          <small className="text-secondary" style={{ fontSize: '0.72rem' }}>Central Dashboard</small>
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
        <div className="nav-category">Main Menu</div>

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
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-receipt-cutoff"></i>
          <span>Orders</span>
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <i className="bi bi-people-fill"></i>
          <span>Customers</span>
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

      {/* Sidebar Footer with Seller Info */}
      <div className="sidebar-footer">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center fw-bold"
            style={{ width: 34, height: 34, fontSize: '0.85rem' }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="text-truncate" style={{ maxWidth: '160px' }}>
            <div className="text-white text-truncate fw-medium" style={{ fontSize: '0.85rem' }}>
              {user?.name || 'Seller Admin'}
            </div>
            <div className="text-secondary text-truncate" style={{ fontSize: '0.75rem' }}>
              {user?.storeName || 'Amazon Verified'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
