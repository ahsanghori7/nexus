import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useSnackbar } from '../hooks/useSnackbar';

/**
 * Global Snackbar Component
 * Displays snackbar notifications from the SnackbarContext
 * This component should be placed once at the root level of your app
 */
const GlobalSnackbar = () => {
  const { snackbar, closeSnackbar } = useSnackbar();

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={snackbar.autoHideDuration || 4000}
      onClose={closeSnackbar}
      anchorOrigin={{
        vertical: snackbar.vertical || 'top',
        horizontal: snackbar.horizontal || 'right',
      }}
    >
      <Alert
        onClose={closeSnackbar}
        severity={snackbar.severity || 'info'}
        variant="filled"
        sx={{ width: '100%', whiteSpace: 'pre-line' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;
