import React from 'react';

const Stepper = ({ children, ...props }) => (
  <div data-testid="stepper" {...props}>
    {children}
  </div>
);

Stepper.displayName = 'Stepper';

export default Stepper;
