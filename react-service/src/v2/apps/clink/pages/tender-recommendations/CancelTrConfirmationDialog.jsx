import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';

const CancelTrConfirmationDialog = ({ open, onCancel, onConfirm, loading }) => {
  const { t } = useTranslation();
  return (
    <Dialog data-testid="cancel-tr-dialog" open={open} onClose={!loading ? onCancel : undefined}>
      <DialogTitle>{t('cancel-tr')}</DialogTitle>
      <DialogContent>
        <Typography
          sx={{ whiteSpace: 'pre-line' }}
          dangerouslySetInnerHTML={{ __html: t('cancel-tr-dialog-description') }}
        />
      </DialogContent>
      <DialogActions>
        <Button data-testid="cancel-tr-keep-btn" onClick={onCancel} disabled={loading}>{t('keep-recommendation')}</Button>
        <Button
          data-testid="cancel-tr-confirm-btn"
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {t('cancel-tr')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelTrConfirmationDialog;
