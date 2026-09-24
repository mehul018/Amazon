import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBanner from '../components/AlertBanner';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, loading, error, setError } = useAuth();

  // Determine active portal from path or default to seller
  const [activePortal, setActivePortal] = useState(() => {
    if (location.pathname.includes('admin')) return 'admin';
    return 'seller';
  });

  // For seller portal: 'login' or 'register'
  const [sellerMode, setSellerMode] = useState('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [businessDescription, setBusinessDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState(null);

  // Update portal if path changes
  useEffect(() => {
    if (location.pathname.includes('admin')) {
      setActivePortal('admin');
    }
  }, [location.pathname]);

  const handlePortalSwitch = (portal) => {
    setActivePortal(portal);
    setError(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (activePortal === 'seller' && sellerMode === 'register') {
      // Seller Registration
      if (!name || !email || !password || !storeName) {
        setError('Please fill in all required fields: Full Name, Email, Password, and Store Name.');
        return;
      }
      const res = await register({
        name,
        email,
        password,
        storeName,
        phone,
        category,
        businessDescription
      });
      if (res.success) {
        setSuccessMsg('Account registered successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } else {
      // Login (Admin or Seller)
      if (!email || !password) {
        setError('Please enter both email and password.');
        return;
      }

      const res = await login(email, password, activePortal === 'admin' ? 'admin' : null);
      if (res.success) {
        if (res.data?.role === 'admin') {
          navigate('/admin/sellers');
        } else {
          navigate('/dashboard');
        }
      }
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 px-3 py-5"
      style={{
        background: 'linear-gradient(135deg, #131921 0%, #1f2937 50%, #232f3e 100%)'
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%' }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center gap-2 mb-2">
            <div
              className={`rounded-3 text-dark fw-bold d-flex align-items-center justify-content-center shadow ${
                activePortal === 'admin' ? 'bg-danger text-white' : 'bg-warning text-dark'
              }`}
              style={{ width: 44, height: 44, fontSize: '1.6rem' }}
            >
              {activePortal === 'admin' ? <i className="bi bi-shield-lock-fill fs-5"></i> : 'a'}
            </div>
            <h2 className="text-white fw-bold mb-0">
              {activePortal === 'admin' ? 'Amazon Admin' : 'Amazon Seller'}
            </h2>
          </div>
          <p className="text-white-50 small mb-0">
            {activePortal === 'admin'
              ? 'Platform Administrator Portal & Seller Management'
              : 'Sign in or register to manage your store products, orders & sales'}
          </p>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="d-flex bg-dark bg-opacity-50 p-1 rounded-3 mb-3 border border-secondary border-opacity-25">
          <button
            type="button"
            className={`btn flex-fill py-2 fw-semibold rounded-2 transition-all d-flex align-items-center justify-content-center gap-2 ${
              activePortal === 'seller'
                ? 'btn-warning text-dark shadow-sm'
                : 'text-white-50 border-0'
            }`}
            onClick={() => handlePortalSwitch('seller')}
          >
            <i className="bi bi-shop"></i>
            <span>Seller Portal</span>
          </button>
          <button
            type="button"
            className={`btn flex-fill py-2 fw-semibold rounded-2 transition-all d-flex align-items-center justify-content-center gap-2 ${
              activePortal === 'admin'
                ? 'btn-danger text-white shadow-sm'
                : 'text-white-50 border-0'
            }`}
            onClick={() => handlePortalSwitch('admin')}
          >
            <i className="bi bi-shield-lock"></i>
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="card shadow-lg border-0 rounded-4 p-4 p-sm-5 bg-white">
          {/* Seller Sub-tabs (Sign In vs Register) */}
          {activePortal === 'seller' && (
            <div className="d-flex gap-2 border-bottom pb-3 mb-4">
              <button
                type="button"
                className={`btn btn-sm px-3 rounded-pill fw-semibold ${
                  sellerMode === 'login'
                    ? 'btn-amazon-primary'
                    : 'btn-outline-secondary'
                }`}
                onClick={() => {
                  setSellerMode('login');
                  setError(null);
                }}
              >
                Seller Sign In
              </button>
              <button
                type="button"
                className={`btn btn-sm px-3 rounded-pill fw-semibold ${
                  sellerMode === 'register'
                    ? 'btn-amazon-primary'
                    : 'btn-outline-secondary'
                }`}
                onClick={() => {
                  setSellerMode('register');
                  setError(null);
                }}
              >
                Register as New Seller
              </button>
            </div>
          )}

          {activePortal === 'admin' && (
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4">
              <div>
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-shield-check text-danger"></i>
                  <span>Admin Sign In</span>
                </h5>
                <small className="text-muted">Administrator credentials required</small>
              </div>
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                Admin Area
              </span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3">
              <i className="bi bi-check-circle-fill fs-5"></i>
              <div className="small fw-semibold">{successMsg}</div>
            </div>
          )}

          {/* Error Banner */}
          <AlertBanner
            type="danger"
            message={error}
            onClose={() => setError(null)}
          />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Seller Register Specific Fields */}
            {activePortal === 'seller' && sellerMode === 'register' && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark small">
                    Store / Business Name *
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <i className="bi bi-shop-window"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="e.g. Apex Electronics Store"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark small">
                    Full Name / Owner Name *
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark small">
                    Primary Selling Category *
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <i className="bi bi-tag"></i>
                    </span>
                    <select
                      className="form-select border-start-0 ps-0"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="Electronics">Electronics & Gadgets</option>
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Books & Stationery">Books & Stationery</option>
                      <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                      <option value="Sports & Fitness">Sports & Fitness</option>
                      <option value="Automotive & Industrial">Automotive & Industrial</option>
                      <option value="General Merchandise">General Merchandise</option>
                    </select>
                  </div>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Select the primary category of items you will sell.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark small">
                    What do you sell? (Store Bio / Description)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0 align-items-start pt-2">
                      <i className="bi bi-card-text"></i>
                    </span>
                    <textarea
                      className="form-control border-start-0 ps-0"
                      rows="2"
                      placeholder="e.g. Wireless audio gear, phone accessories, and smart chargers..."
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </>
            )}

            {/* Email field */}
            <div className="mb-3">
              <label className="form-label fw-semibold text-dark small">
                {activePortal === 'admin' ? 'Admin Email Address' : 'Seller Email Address'} *
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control border-start-0 ps-0"
                  placeholder={activePortal === 'admin' ? 'admin@amazon.com' : 'seller@amazon.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-dark small">
                Password *
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type="password"
                  className="form-control border-start-0 ps-0"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Verification Notice on Register */}
            {activePortal === 'seller' && sellerMode === 'register' && (
              <div className="p-3 bg-light rounded-3 border mb-4">
                <div className="d-flex align-items-start gap-2 text-secondary small">
                  <i className="bi bi-info-circle-fill text-warning mt-1"></i>
                  <span>
                    Note: Newly registered seller accounts start in <strong>Unverified</strong> status until approved by the platform Admin.
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn w-100 py-2 shadow-sm fw-semibold ${
                activePortal === 'admin' ? 'btn-danger' : 'btn-amazon-primary'
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Processing...
                </>
              ) : activePortal === 'admin' ? (
                'Sign In to Admin Console'
              ) : sellerMode === 'register' ? (
                'Register & Open Seller Store'
              ) : (
                'Sign In to Seller Central'
              )}
            </button>
          </form>


        </div>

      </div>
    </div>
  );
};

export default Login;
