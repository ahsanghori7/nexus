// __mocks__/@mui/material/Snackbar.js
import * as React from 'react';

const Snackbar = React.forwardRef((props, ref) => {
  const { open, autoHideDuration, onClose, ...rest } = props;

  // Implement the autoHide functionality
  React.useEffect(() => {
    if (open && autoHideDuration && onClose) {
      const timer = setTimeout(() => {
        onClose(new Event('timeout'), 'timeout');
      }, autoHideDuration);

      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [open, autoHideDuration, onClose]);

  // If not open, return null
  if (!open) {
    return null;
  }

  return React.createElement('snackbar', {
    className: 'MuiSnackbar-root',
    'data-testid': 'mui-snackbar',
    open: open ? '' : undefined, // Convert to empty string attribute
    autoHideDuration: autoHideDuration?.toString(),
    ...rest,
    ref,
  });
});

Snackbar.displayName = 'Snackbar';
module.exports = Snackbar;
