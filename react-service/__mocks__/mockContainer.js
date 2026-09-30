import React from 'react';

const MockContainer = ({ children, className, align, ...props }) => (
  <div
    data-testid="container-component"
    className={className}
    style={{ textAlign: align?.replace('text-align: ', '') }}
    {...props}
  >
    {children}
  </div>
);

export default MockContainer;
