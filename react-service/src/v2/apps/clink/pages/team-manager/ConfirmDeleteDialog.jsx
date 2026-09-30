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

const ConfirmDeleteDialog = ({ open, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onCancel} data-testid="confirm-delete-dialog">
      <DialogTitle>{'Delete Member'}</DialogTitle>
      <DialogContent>
        <Typography>
          {'Are you sure you want to delete this member?'}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} data-testid="confirm-delete-no-button">{t('no')}</Button>
        <Button variant="contained" onClick={onConfirm} data-testid="confirm-delete-yes-button">
          {t('yes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
