import React from 'react';

const StepButton = ({ children, onClick, sx, ...props }) => (
  <button onClick={onClick} style={sx} {...props}>
    {children}
  </button>
);

export default StepButton;
