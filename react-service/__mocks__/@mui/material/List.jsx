import React from 'react';

const List = ({ children, sx, ...props }) => (
  <ul data-testid="list" style={sx} {...props}>
    {children}
  </ul>
);

List.displayName = 'List';

export default List;
