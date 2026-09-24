import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBanner from '../components/AlertBanner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  const handleFillDemo = () => {
    setEmail('seller@amazon.com');
    setPassword('seller123');
    setError(null);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 px-3"
      style={{
        background: 'linear-gradient(135deg, #131921 0%, #232f3e 100%)'
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%' }}>
        {/* Amazon Logo Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center gap-2 mb-2">
            <div
              className="rounded-3 bg-warning text-dark fw-bold d-flex align-items-center justify-content-center shadow"
              style={{ width: 44, height: 44, fontSize: '1.6rem' }}
            >
              a
            </div>
            <h2 className="text-white fw-bold mb-0">Amazon Seller</h2>
          </div>
          <p className="text-white-50 small mb-0">
            Sign in to manage your inventory, orders & sales
          </p>
        </div>

        {/* Login Form Card */}
        <div className="card shadow-lg border-0 rounded-4 p-4 p-sm-5 bg-white">
          <h4 className="fw-bold text-dark mb-3">Seller Sign In</h4>

          {/* Error Banner */}
          <AlertBanner
            type="danger"
            message={error}
            onClose={() => setError(null)}
          />

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-dark small">
                Email Address
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control border-start-0 ps-0"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-semibold text-dark small mb-0">
                  Password
                </label>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Default: seller123
                </span>
              </div>
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

            <button
              type="submit"
              className="btn btn-amazon-primary w-100 py-2 mb-3 shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Signing In...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>

            {/* Quick Demo Credentials Autofill */}
            <div className="p-3 bg-light rounded-3 border text-center">
              <div className="small text-muted mb-2 fw-medium">
                Academic / MCA Demo Credentials
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleFillDemo}
              >
                <i className="bi bi-lightning-charge-fill text-warning"></i>
                <span>Fill Demo Credentials</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-4 text-white-50 small">
          MERN Stack MCA Project • MVC Architecture Backend
        </div>
      </div>
    </div>
  );
};

export default Login;
