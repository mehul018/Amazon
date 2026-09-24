import React from 'react';

const LoadingSpinner = ({ message = 'Loading data...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 text-muted fw-medium">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
