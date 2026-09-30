// __mocks__/@mui/material/ListItemText.jsx
import * as React from 'react';

const ListItemText = ({ children, primary, secondary, ...props }) => (
  <div data-testid="listitemtext" {...props}>
    {children}
    {primary && <span className="MuiListItemText-primary">{primary}</span>}
    {secondary && <span className="MuiListItemText-secondary">{secondary}</span>}
  </div>
);

export default ListItemText;
