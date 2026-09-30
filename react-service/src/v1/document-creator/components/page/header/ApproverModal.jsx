import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import MuiAlert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import i18next from 'v2/helpers/i18n';
import { useLocation } from 'react-router-dom';

const ApproverModal = ({
  open,
  onClose,
  approvers = [],
  onConfirm,
  reloadData,
  resubmittingRequest,
  setApprovalRequestSent,
}) => {
  const { pathname } = useLocation();
  const [selectedApprover, setSelectedApprover] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    if (approvers.length === 1) {
      setSelectedApprover(approvers[0].id);
    } else {
      setSelectedApprover('');
    }
  }, [approvers]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(selectedApprover);
      if (reloadData) reloadData();
      if (setApprovalRequestSent) setApprovalRequestSent(true);
      setSnackbarOpen(true);
      setSnackbarSeverity('success');
      setSnackbarMessage(
        resubmittingRequest
          ? i18next.t('resubmit-approval-request-success-msg')
          : i18next.t('approval-request-success-msg'),
      );
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage(
        error?.message || i18next.t('approval-request-error-msg'),
      );
    } finally {
      setSubmitting(false);
      setSnackbarOpen(true);
      onClose();
    }
  };

  const getDocumentType = () => {
    return pathname?.includes('/tender_recommendation/') ? i18next.t('recommendation') : i18next.t('document');
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={!submitting ? onClose : undefined}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{i18next.t('approval-modal-heading')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-line' }} >
            {i18next.t('approval-modal-description' , {documentType: getDocumentType()})}
          </Typography>

          <RadioGroup
            value={selectedApprover}
            onChange={(e) => setSelectedApprover(e.target.value)}
          >
            <List disablePadding>
              {approvers.map((approver, index) => (
                <React.Fragment key={approver.id}>
                  <ListItem disableGutters>
                    <ListItemButton
                      onClick={() => setSelectedApprover(approver.id)}
                      sx={{ pl: 0 }}
                    >
                      <Radio
                        checked={selectedApprover === approver.id}
                        value={approver.id}
                        sx={{ mr: 2 }}
                      />
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {approver.display_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1">
                            {approver.display_name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="textSecondary">
                            {approver.email}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < approvers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            {i18next.t('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedApprover || submitting}
            variant="contained"
            startIcon={
              submitting ? <CircularProgress size={20} color="inherit" /> : null
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

export default ApproverModal;
