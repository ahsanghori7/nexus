// __mocks__/@mui/material/DialogContentText.jsx
import * as React from 'react';

const DialogContentText = React.forwardRef((props, ref) => {
  return React.createElement('dialogcontenttext', {
    className: 'MuiDialogContentText-root',
    'data-testid': 'dialog-content-text',
    ...props,
    ref,
  });
});

DialogContentText.displayName = 'DialogContentText';

export default DialogContentText;
