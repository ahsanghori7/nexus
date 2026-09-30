import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import i18next from 'v2/helpers/i18n';
import { useNavigate } from 'react-router-dom';

const ApproveOrderModal = ({
  approverInfo,
  open,
  onClose,
  onApprove,
  subcontractorName = i18next.t('default_subcontractor'),
  setOrderApprovedOrRejected,
  reloadData,
  projectSlug,
}) => {
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleConfirm = async () => {
    try {
      await onApprove(approverInfo.id, 'Approved');
      reloadData();
      setSnackbarSeverity('success');
      setSnackbarMessage(i18next.t('approve_order_success'));
      setOrderApprovedOrRejected(true);
      onClose();
      if (projectSlug) {
        navigate(`/main-contractor/project/${projectSlug}/orders`);
      }
    } catch (err) {
      setSnackbarSeverity('error');
      setSnackbarMessage(i18next.t('approve_order_error'));
    } finally {
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth data-testid="document-creator-approve-modal">
        <DialogTitle>{i18next.t('approve_order_title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {i18next.t('approve_order_description', { subcontractorName })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} data-testid="document-creator-approve-modal-cancel-btn">{i18next.t('cancel')}</Button>
          <Button onClick={handleConfirm} variant="contained" data-testid="document-creator-approve-modal-confirm-btn">
            {i18next.t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
      >
        <MuiAlert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            whiteSpace: 'pre-line',
            '& .MuiAlert-icon': {
              alignSelf: 'center',
            },
            '& .MuiAlert-action': {
              alignSelf: 'center',
            },
          }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default ApproveOrderModal;
