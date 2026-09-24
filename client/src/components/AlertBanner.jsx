import React from 'react';

const AlertBanner = ({ type = 'danger', message, onClose }) => {
  if (!message) return null;

  const iconMap = {
    danger: 'bi-exclamation-triangle-fill',
    success: 'bi-check-circle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill'
  };

  return (
    <div className={`alert alert-${type} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
      <i className={`bi ${iconMap[type] || 'bi-info-circle-fill'} me-2 fs-5`}></i>
      <div className="flex-grow-1">{message}</div>
      {onClose && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onClose}
        ></button>
      )}
    </div>
  );
};

export default AlertBanner;
