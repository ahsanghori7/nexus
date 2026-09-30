import React from 'react';

const SafeBox = ({ children, sx, className, ...props }) => (
  <div
    className={className}
    data-testid="safe-box-mock"
    style={sx ? {} : undefined}
    {...props}
  >
    {children}
  </div>
);

export default SafeBox;
