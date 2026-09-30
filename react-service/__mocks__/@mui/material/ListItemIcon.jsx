import React from 'react';

const ListItemIcon = ({ children, ...props }) => (
  <div data-testid="mui-listitemicon" {...props}>
    {children}
  </div>
);

ListItemIcon.displayName = 'ListItemIcon';

export default ListItemIcon;
