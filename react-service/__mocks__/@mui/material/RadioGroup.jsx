import React from 'react';

const RadioGroup = ({ children, ...props }) => (
  <div data-testid="radio-group" {...props}>
    {children}
  </div>
);

export default RadioGroup;
