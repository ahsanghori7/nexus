import React from 'react';
import PropTypes from 'prop-types';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const AlertPopup = ({
  status = '',
  message = null,
  open = false,
  handleClose = () => null,
  autoHideDuration = 3000,
}) => {
  return (
    status &&
    message && (
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
      >
        <Alert variant="filled" severity={status} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    )
  );
};

AlertPopup.propTypes = {
  status: PropTypes.string,
  message: PropTypes.string,
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  autoHideDuration: PropTypes.number,
};

export default AlertPopup;
