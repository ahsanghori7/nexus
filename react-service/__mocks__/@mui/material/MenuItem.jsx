import React from 'react';

const MenuItem = ({ children, ...props }) => (
  <div data-testid="mui-menu-item" {...props}>
    {children}
  </div>
);

MenuItem.displayName = 'MenuItem';

export default MenuItem;
