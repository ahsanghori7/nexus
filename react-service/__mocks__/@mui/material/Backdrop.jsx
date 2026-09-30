import React from 'react';

const Backdrop = React.forwardRef(({ children, open, onClick, sx, ...props }, ref) => {
  if (!open) return null;

  return React.createElement('div', {
    ref,
    'data-testid': 'mui-backdrop',
    onClick: onClick,
    className: 'MuiBackdrop-root',
    style: sx,
    ...props
  }, children);
});

export default Backdrop;
