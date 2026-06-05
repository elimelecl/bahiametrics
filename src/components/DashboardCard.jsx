import React from 'react';

const DashboardCard = ({ title, icon: Icon, children, className = "" }) => {
  return (
    <div className={`dashboard-card ${className}`}>
      <div className="card-header">
        <div className="card-title-group">
          {Icon && <Icon className="card-icon" />}
          <h2 className="card-title">{title}</h2>
        </div>
      </div>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;
