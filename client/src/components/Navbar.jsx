import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar, pageTitle = 'Dashboard' }) => {
  const { user, isAdmin, isVerified, logout } = useAuth();
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
            {isAdmin ? (
              <span className="text-danger fw-semibold">
                <i className="bi bi-shield-lock-fill me-1"></i>
                Amazon Admin Console • Platform Administrator
              </span>
            ) : (
              <>
                Store: <span className="fw-semibold text-primary">{user?.storeName || 'Amazon Seller Store'}</span>
              </>
            )}
          </small>
        </div>
      </div>

      {/* Right: Quick actions & Profile */}
      <div className="d-flex align-items-center gap-3">
        {/* Admin Quick Link */}
        {isAdmin ? (
          <button
            onClick={() => navigate('/admin/sellers')}
            className="btn btn-sm btn-outline-danger d-none d-md-flex align-items-center gap-2"
          >
            <i className="bi bi-people-fill"></i>
            <span>Manage Sellers</span>
          </button>
        ) : isVerified ? (
          <span className="badge bg-success-subtle text-success border border-success-subtle d-none d-sm-inline-flex align-items-center gap-1 py-1 px-2">
            <i className="bi bi-patch-check-fill"></i>
            <span>Verified Seller</span>
          </span>
        ) : (
          <span
            className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle d-inline-flex align-items-center gap-1.5 py-1 px-2.5 shadow-sm"
            title="Account unverified — Store actions are restricted until verified by Admin"
          >
            <i className="bi bi-shield-lock-fill text-warning"></i>
            <span>Unverified (Restricted Mode)</span>
          </span>
        )}

        {/* User Profile Badge */}
        <div className="d-flex align-items-center gap-2 ps-2 border-start">
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm ${
              isAdmin ? 'bg-danger text-white' : 'bg-dark text-warning'
            }`}
            style={{ width: 36, height: 36, fontSize: '0.9rem' }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : isAdmin ? 'A' : 'S'}
          </div>
          <div className="d-none d-md-block">
            <div className="fw-semibold text-dark lh-1" style={{ fontSize: '0.85rem' }}>
              {user?.name || (isAdmin ? 'Admin' : 'Seller')}
            </div>
            <small className="text-muted text-capitalize" style={{ fontSize: '0.72rem' }}>
              {isAdmin ? 'System Admin' : isVerified ? 'Verified Seller' : 'Unverified (Restricted)'}
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
