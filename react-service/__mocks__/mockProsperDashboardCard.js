// Mock for v2/apps/shared/components/cards/prosper/DashboardCard
import React from 'react';

const ProsperDashboardCard = ({ title, optionalRightContent, children, theme = 'prosper-dashboard-card' }) => (
  <div data-testid="prosper-dashboard-card" data-theme={theme}>
    {title && (
      <div data-testid="card-header">
        <h3 data-testid="card-title">{title}</h3>
        {optionalRightContent && (
          <div data-testid="optional-right-content">{optionalRightContent}</div>
        )}
      </div>
    )}
    <div data-testid="card-body">{children}</div>
  </div>
);

export default ProsperDashboardCard;
