// __mocks__/@mui/material/Dialog.js
import * as React from 'react';

// Create a proper Dialog mock that handles open state
const Dialog = React.forwardRef(({ open = false, ...props }, ref) => {
  if (!open) {
    return null;
  }

  return React.createElement('dialog', {
    className: 'MuiDialog-root',
    'data-testid': 'modal',
    ...props,
    ref,
  });
});

Dialog.displayName = 'Dialog';
module.exports = Dialog;
