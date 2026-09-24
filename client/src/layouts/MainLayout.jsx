import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isVerified, refreshProfile, syncingStatus } = useAuth();
  const [syncFeedback, setSyncFeedback] = useState(null);

  // Dynamic Title based on route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/admin/sellers':
        return 'Seller Verification & Directory';
      case '/dashboard':
        return 'Seller Dashboard Overview';
      case '/products':
        return 'Product Inventory Management';
      case '/orders':
        return 'Orders & Shipment Fulfillment';
      case '/customers':
        return 'Customer Database & Accounts';
      case '/sales':
        return 'Sales Performance & Analytics';
      default:
        return 'Amazon Seller Dashboard';
    }
  };

  const handleManualCheck = async () => {
    const updated = await refreshProfile();
    if (updated?.isVerified) {
      setSyncFeedback({
        type: 'success',
        text: 'Great news! Your account has been verified by the Administrator. All restrictions are now lifted!'
      });
    } else {
      setSyncFeedback({
        type: 'warning',
        text: 'Account status checked: Verification is still pending admin review.'
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={getPageTitle()}
        />

        {/* Dynamic Nested Page Content */}
        <main className="page-container">
          {/* Global Unverified Seller Restriction Banner */}
          {!isAdmin && !isVerified && (
            <div
              className="alert alert-warning border border-warning shadow-sm rounded-3 mb-4 p-3"
              style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                borderColor: '#f59e0b'
              }}
            >
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                    style={{ width: 36, height: 36 }}
                  >
                    <i className="bi bi-shield-lock-fill fs-5"></i>
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <h6 className="fw-bold mb-0 text-dark">
                        Account Verification Pending — Restricted Mode Active
                      </h6>
                      <span className="badge bg-warning text-dark border border-warning-subtle fw-bold">
                        🔒 Read-Only
                      </span>
                    </div>
                    <p className="mb-2 text-dark small" style={{ maxWidth: '850px' }}>
                      Your seller account <strong>"{user?.storeName || 'Amazon Seller Store'}"</strong> is currently awaiting administrative verification.
                      Until an Admin verifies your account, <strong>store operations are restricted</strong>: adding or editing products, placing or updating orders, and customer modifications are locked.
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      <span className="badge bg-light text-secondary border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                        <i className="bi bi-lock me-1"></i> Add / Edit Products: Locked
                      </span>
                      <span className="badge bg-light text-secondary border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                        <i className="bi bi-lock me-1"></i> Order Creation & Status: Locked
                      </span>
                      <span className="badge bg-light text-secondary border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                        <i className="bi bi-lock me-1"></i> Customer Registration: Locked
                      </span>
                    </div>
                  </div>
                </div>
                <div className="align-self-start align-self-md-center flex-shrink-0">
                  <button
                    onClick={handleManualCheck}
                    disabled={syncingStatus}
                    className="btn btn-sm btn-dark text-warning d-inline-flex align-items-center gap-2 shadow-sm fw-semibold px-3 py-2"
                    title="Check if Admin has approved your account"
                  >
                    <i className={`bi bi-arrow-clockwise ${syncingStatus ? 'spin' : ''}`}></i>
                    <span>{syncingStatus ? 'Checking...' : 'Check Status'}</span>
                  </button>
                </div>
              </div>

              {syncFeedback && (
                <div
                  className={`mt-2 small fw-semibold text-${syncFeedback.type === 'success' ? 'success' : 'dark'} border-top border-warning-subtle pt-2`}
                >
                  <i className={`bi ${syncFeedback.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-info-circle-fill text-warning'} me-1`}></i>
                  {syncFeedback.text}
                </div>
              )}
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
