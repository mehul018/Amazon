import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar, pageTitle = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="top-navbar">
      {/* Left: Sidebar Toggle & Page Breadcrumb */}
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-light d-lg-none p-1 px-2 border"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list fs-5"></i>
        </button>
        <div>
          <h5 className="mb-0 fw-bold text-dark">{pageTitle}</h5>
          <small className="text-muted d-none d-sm-inline" style={{ fontSize: '0.75rem' }}>
            Store: <span className="fw-semibold text-primary">{user?.storeName || 'Amazon Prime Store'}</span>
          </small>
        </div>
      </div>

      {/* Right: Quick actions & Profile */}
      <div className="d-flex align-items-center gap-3">
        {/* Quick Add Product Button */}
        <button
          onClick={() => navigate('/products')}
          className="btn btn-sm btn-amazon-primary d-none d-md-flex align-items-center gap-2"
        >
          <i className="bi bi-plus-circle-fill"></i>
          <span>Add Product</span>
        </button>

        {/* Notifications Icon */}
        <div className="position-relative text-muted" style={{ cursor: 'pointer' }}>
          <i className="bi bi-bell fs-5"></i>
          <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
            <span className="visually-hidden">New alerts</span>
          </span>
        </div>

        {/* Seller Info Badge */}
        <div className="d-flex align-items-center gap-2 ps-2 border-start">
          <div
            className="rounded-circle bg-dark text-warning d-flex align-items-center justify-content-center fw-bold shadow-sm"
            style={{ width: 36, height: 36, fontSize: '0.9rem' }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="d-none d-md-block">
            <div className="fw-semibold text-dark lh-1" style={{ fontSize: '0.85rem' }}>
              {user?.name || 'Mohit Seller'}
            </div>
            <small className="text-muted text-capitalize" style={{ fontSize: '0.72rem' }}>
              {user?.role || 'Seller Account'}
            </small>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-sm btn-outline-danger ms-2 d-none d-sm-inline-flex"
            title="Logout"
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
