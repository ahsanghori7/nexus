// __mocks__/@mui/material/Drawer.jsx
import * as React from 'react';

const Drawer = ({ children, open, onClose, ...props }) => (
  <div
    data-testid="mui-drawer"
    data-open={open}
    {...props}
  >
    {open && children}
  </div>
);

Drawer.displayName = 'Drawer';

export default Drawer;
