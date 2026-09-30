import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import i18next from 'v2/helpers/i18n';

const ApproveRejectTenderInquiryModal = ({
  open,
  onClose,
  tenderInfo,
  handleConfirm
}) => {
  const [decision, setDecision] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleReject = () => {
    setDecision('reject');
    setFeedback('');
  };

  const handleApprove = () => {
    setDecision('approve');
    setFeedback('');
  };

  const isConfirmEnabled = () => {
    if (decision === 'approve') {
      return true;
    }
    if (decision === 'reject' && feedback.trim() !== '') {
      return true;
    }
    return false;
  };



  const handleClose = () => {
    setDecision('');
    setFeedback('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
          {i18next.t('approve-or-reject-tender') || 'Approve or Reject Tender'}
          <IconButton
            aria-label="close"
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Tender Document Section */}
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            {i18next.t('tender-document')}
          </Typography>

          <Typography variant="body2" mb={3} color="text.secondary">
            {i18next.t('tender-document-description')} <strong>{tenderInfo?.pkgName} - {tenderInfo?.tenderType} {decision === 'approve' && <CheckCircleIcon fontSize='small' color='success' />}</strong>
          </Typography>

          {/* Approve/Reject Buttons */}
          <Box display="flex" gap={2} mb={2}>
            <Button
              variant={decision === 'reject' ? 'contained' : 'outlined'}
              color="error"
              onClick={handleReject}
            >
              {i18next.t('reject-button')}
            </Button>
            <Button
              variant={decision === 'approve' ? 'contained' : 'outlined'}
              color="success"
              onClick={handleApprove}
            >
              {i18next.t('approve-button')}
            </Button>
          </Box>

          {/* Feedback Field - Only shown when Reject is selected */}
          {decision === 'reject' && (
            <Box mt={3}>
              <Typography
                variant="body2"
                mb={1}
                fontWeight={500}
                color="text.primary"
              >
                {i18next.t('feedback')}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Please provide a reason for rejection..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <Typography variant="caption" color="error" mt={0.5}>
                {i18next.t('feedback-required')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions px={3} py={2}>
          <Button
            onClick={handleClose}
          >
            {i18next.t('cancel')}
          </Button>
          <Button
            onClick={() => handleConfirm(decision, feedback)}
            variant="contained"
            disabled={!isConfirmEnabled()}
            color="success"
          >
            {i18next.t('confirm-decision')}
          </Button>
        </DialogActions>
      </Dialog>
  );
};

export default ApproveRejectTenderInquiryModal;
