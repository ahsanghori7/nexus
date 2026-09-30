// __mocks__/@mui/material/DialogTitle.js
import * as React from 'react';

const DialogTitle = React.forwardRef((props, ref) => {
  return React.createElement('dialogtitle', {
    className: 'MuiDialogTitle-root',
    'data-testid': 'modal-title',
    ...props,
    ref,
  });
});

DialogTitle.displayName = 'DialogTitle';
module.exports = DialogTitle;
