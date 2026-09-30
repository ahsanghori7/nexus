import React from 'react';

const Divider = ({ children, ...props }) => (
  <div data-testid="mui-divider" {...props}>
    {children}
  </div>
);

Divider.displayName = 'Divider';

export default Divider;
