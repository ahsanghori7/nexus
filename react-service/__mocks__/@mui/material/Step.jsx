import React from 'react';

const Step = ({ children, ...props }) => (
  <div data-testid="step" {...props}>
    {children}
  </div>
);

Step.displayName = 'Step';

export default Step;
