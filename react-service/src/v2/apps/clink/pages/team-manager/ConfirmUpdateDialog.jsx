import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const ConfirmUpdateDialog = ({ open, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onCancel} data-testid="confirm-update-dialog">
      <DialogTitle>{t('notification')}</DialogTitle>
      <DialogContent>
        <Typography>{t('threshold-update-confirmation-text')}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} data-testid="confirm-update-no-button">{t('no')}</Button>
        <Button variant="contained" onClick={onConfirm} data-testid="confirm-update-yes-button">
          {t('yes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmUpdateDialog;
