// __mocks__/@mui/material/Toolbar.jsx
import React from 'react';

const MockToolbar = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <div data-testid="mock-mui-toolbar" ref={ref} {...props}>
      {children}
    </div>
  );
});

MockToolbar.displayName = 'MockToolbar';
export default MockToolbar;
