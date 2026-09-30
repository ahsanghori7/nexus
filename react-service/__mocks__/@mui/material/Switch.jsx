import React from 'react';

const Switch = ({ children, ...props }) => (
  <input type="checkbox" data-testid="switch" {...props}>
    {children}
  </input>
);

export default Switch;
