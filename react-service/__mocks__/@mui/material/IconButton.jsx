// __mocks__/@mui/material/IconButton.js
import * as React from 'react';

const IconButton = React.forwardRef((props, ref) => {
  // Use a standard button element to ensure it has the proper 'button' role for testing
  return React.createElement('button', {
    role: 'button',
    type: 'button',
    className: 'MuiIconButton-root',
    'data-testid': 'icon-button',
    ...props,
    ref,
  });
});

IconButton.displayName = 'IconButton';
module.exports = IconButton;
