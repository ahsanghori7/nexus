import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import i18next from 'v2/helpers/i18n';
import { useNavigate } from 'react-router-dom';

const RejectModal = ({
  fields,
  approverInfo,
  open,
  onClose,
  onReject,
  setOrderApprovedOrRejected,
  reloadData,
  projectSlug,
  docType,
  isSubmitting = false,
}) => {
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [internalSubmitting, setInternalSubmitting] = useState(false);

  const loading = isSubmitting || internalSubmitting;

  const handleConfirm = async () => {
    if (!comment.trim()) return;
    if (
      projectSlug === 'tender_recommendations' ||
      projectSlug === 'procurement_schedule' ||
      docType === 'tender'
    ) {
      setInternalSubmitting(true);
      try {
        await onReject(comment);
      } finally {
        setInternalSubmitting(false);
      }
    } else {
      setInternalSubmitting(true);
      try {
        await onReject(approverInfo.id, 'Rejected', comment);
        reloadData();
        setSnackbarSeverity('success');
        setSnackbarMessage(fields?.successMessage);
        setOrderApprovedOrRejected(true);
        onClose();
        if (projectSlug) {
          navigate(`/main-contractor/project/${projectSlug}/orders`);
        }
      } catch (err) {
        setSnackbarSeverity('error');
        setSnackbarMessage(fields?.errorMessage);
      } finally {
        setInternalSubmitting(false);
        setSnackbarOpen(true);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth data-testid="document-creator-reject-modal">
        <DialogTitle>{fields?.title}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>{fields?.content}</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={fields?.placeholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            slotProps={{ htmlInput: { 'data-testid': 'document-creator-reject-modal-comment' } }}
          />
          {fields?.note && (
            <Typography sx={{ mt: 1.5, display: 'block' }}>
              <strong>Note: </strong>
              {fields?.note}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading} data-testid="document-creator-reject-modal-cancel-btn">{i18next.t('cancel')}</Button>
          <Button
            onClick={handleConfirm}
            disabled={!comment.trim() || loading}
            variant="contained"
            data-testid="document-creator-reject-modal-confirm-btn"
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
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

export default RejectModal;
