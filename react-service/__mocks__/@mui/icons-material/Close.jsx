// __mocks__/@mui/icons-material/Close.js
import * as React from 'react';
const CloseIcon = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    'data-testid': 'close-icon',
    ...props,
    ref,
  });
});
CloseIcon.displayName = 'CloseIcon';
module.exports = CloseIcon;
