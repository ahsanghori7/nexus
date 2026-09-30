import React from 'react';

const MockPopover = ({ children, open, ...props }) => {
  return open ? <div {...props}>{children}</div> : null;
};

export default MockPopover;
