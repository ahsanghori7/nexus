import React from 'react';

const Tabs = ({ children, value, onChange, variant, scrollButtons, allowScrollButtonsMobile, TabIndicatorProps, ...props }) => (
  <div data-testid="tabs" data-value={value} {...props}>
    <button
      onClick={(e) => onChange && onChange(e, 1)}
      data-testid="tab-change-button"
      style={{ display: 'none' }}
    >
      Change Tab
    </button>
    {children}
  </div>
);

export default Tabs;
