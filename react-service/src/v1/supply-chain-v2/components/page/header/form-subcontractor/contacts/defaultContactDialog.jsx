import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';
import React from 'react';
import i18next from 'v2/helpers/i18n';

const DefaultContactDialog = ({ open, onClose, onConfirm, message }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{i18next.t('confirm-main-contact-heading')}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="secondary">
        Cancel
      </Button>
      <Button onClick={onConfirm} color="primary" variant="contained">
        Accept
      </Button>
    </DialogActions>
  </Dialog>
);

export default DefaultContactDialog;
