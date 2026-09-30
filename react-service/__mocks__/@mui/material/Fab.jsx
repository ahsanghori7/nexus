import React from 'react';

const Fab = ({ children, sx, size, color, 'aria-label': ariaLabel, onClick, ...props }) => (
  <button
    data-testid="mui-fab"
    style={sx}
    aria-label={ariaLabel}
    onClick={onClick}
    className={`MuiFab-root MuiFab-${size || 'medium'} MuiFab-${color || 'default'}`}
    {...props}
  >
    {children}
  </button>
);

export default Fab;
