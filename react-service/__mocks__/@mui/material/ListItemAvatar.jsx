import React from 'react';

const ListItemAvatar = ({ children, ...props }) => (
  <div data-testid="mui-listitemavatar" {...props}>
    {children}
  </div>
);

ListItemAvatar.displayName = 'ListItemAvatar';

export default ListItemAvatar;
