// __mocks__/@mui/material/AppBar.jsx
import React from 'react';

const MockAppBar = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <div data-testid="mock-mui-appbar" ref={ref} {...props}>
      {children}
    </div>
  );
});

MockAppBar.displayName = 'MockAppBar';
export default MockAppBar;
