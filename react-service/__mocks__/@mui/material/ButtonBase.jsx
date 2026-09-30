import React from 'react';

const ButtonBase = ({ children, onClick, ...props }) => (
  <div role="button" onClick={onClick} {...props}>
    {children}
  </div>
);

export default ButtonBase;
