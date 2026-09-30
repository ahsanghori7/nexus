import React from 'react';

const Menu = ({ children, anchorEl, open, onClose, sx, ...props }) =>
  open ? (
    <div data-testid="mui-menu" style={sx} {...props}>
      {children}
    </div>
  ) : null;

Menu.displayName = 'Menu';

export default Menu;
