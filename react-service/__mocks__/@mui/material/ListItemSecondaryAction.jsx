import React from 'react';

const ListItemSecondaryAction = ({ children, ...props }) => (
  <div data-testid="list-item-secondary-action" {...props}>
    {children}
  </div>
);

export default ListItemSecondaryAction;
