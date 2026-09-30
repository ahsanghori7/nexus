import React from 'react';

export default function Popper({ children, open = false, anchorEl, ...props }) {
  return open ? <div data-testid="popper" {...props}>{children}</div> : null;
}
