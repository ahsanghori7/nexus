// __mocks__/@mui/material/DialogContent.js
import * as React from 'react';

const DialogContent = React.forwardRef((props, ref) => {
  return React.createElement('dialogcontent', {
    className: 'MuiDialogContent-root',
    'data-testid': 'modal-content',
    ...props,
    ref,
  });
});

DialogContent.displayName = 'DialogContent';
module.exports = DialogContent;
