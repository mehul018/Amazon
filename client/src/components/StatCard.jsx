import React from 'react';

const StatCard = ({ title, value, icon, bgColor, textColor, changeText, isPositive = true }) => {
  return (
    <div className="stat-card h-100">
      <div className="d-flex flex-column justify-content-between">
        <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.78rem', letterSpacing: '0.5px' }}>
          {title}
        </span>
        <h3 className="fw-bold my-2 text-dark" style={{ fontSize: '1.75rem' }}>
          {value}
        </h3>
        {changeText && (
          <div className="d-flex align-items-center" style={{ fontSize: '0.82rem' }}>
            <span className={`badge ${isPositive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} me-2`}>
              <i className={`bi ${isPositive ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}`}></i>
              {changeText}
            </span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>vs last month</span>
          </div>
        )}
      </div>
      <div
        className="stat-icon"
        style={{
          backgroundColor: bgColor || '#fff8e6',
          color: textColor || '#ff9900'
        }}
      >
        <i className={`bi ${icon}`}></i>
      </div>
    </div>
  );
};

export default StatCard;
