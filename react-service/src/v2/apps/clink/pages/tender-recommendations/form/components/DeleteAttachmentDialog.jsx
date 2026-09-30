import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import i18next from 'v2/helpers/i18n';

const DeleteAttachmentDialog = ({ open, onCancel, onConfirm, loading }) => {
  return (
    <Dialog data-testid="delete-attachment-dialog" open={open} onClose={!loading ? onCancel : undefined}>
      <DialogTitle>{i18next.t('delete-attachment')}</DialogTitle>
      <DialogContent>
        <Typography>
          {i18next.t('delete-attachment-confirmation')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button data-testid="delete-attachment-cancel-btn" onClick={onCancel} disabled={loading} variant="outlined" color="primary">
          {i18next.t('cancel')}
        </Button>
        <Button
          data-testid="delete-attachment-confirm-btn"
          variant="contained"
          sx={{
            backgroundColor: 'error.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'error.dark',
              color: 'white',
            },
          }}
          color="error"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {i18next.t('delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAttachmentDialog;
