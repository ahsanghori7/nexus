import React from 'react';

const StepLabel = ({ children, ...props }) => (
  <div data-testid="step-label" {...props}>
    {children}
  </div>
);

StepLabel.displayName = 'StepLabel';

export default StepLabel;
