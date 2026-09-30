import React from 'react';

const InputAdornment = ({ children, position, ...props }) => (
  <div data-testid="input-adornment" data-position={position} {...props}>
    {children}
  </div>
);

export default InputAdornment;
