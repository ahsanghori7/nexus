import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useContext } from 'hooks/context';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { getUrl } from 'v2/helpers/url';
import { clinkGreen } from 'v2/constants/colors';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { sendTenderInquiryReminder } from 'v2/store/reducers/clink/tender-inquiry/asyncThunk';
import Tooltip from '@mui/material/Tooltip';

const TemplateActionsMenu = ({ template, pid, tid, onDelete, onViewLogs }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { actions } = useContext('clink');

  // Get existing subcontractors from Redux state if available
  const contactsOpen = useSelector((state) => state.contacts?.open || false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [reminderSentRecently, setReminderSentRecently] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const triggerRef = useRef(null);
  const isMounted = useRef(true);
  const reminderTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const open = Boolean(anchorEl);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (reminderTimerRef.current) {
        clearTimeout(reminderTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditTender = () => {
    handleMenuClose();
    const url = getUrl(
      'clink_app_host',
      `document-creator/template/${template.id}/tender/${tid}`,
    );
    navigate(url);
  };

  const handleSendTender = () => {
    handleMenuClose();

    // Check if subcontractors already exist in Redux state
    let subcontractors = [];
    if (contactsOpen && contactsOpen.subcontractors) {
      // Use existing subcontractors from Redux state
      subcontractors = contactsOpen.subcontractors;
    }

    // Open the Send Document Modal
    dispatch(
      actions.setOpenContactsModal({
        pid,
        tid,
        did: template.id, // Use the current template as the default document
        tenderAddendum: false,
        subcontractors,
      }),
    );
  };

  const handleSendReminder = async () => {
    handleMenuClose();

    if (reminderSentRecently) {
      setSnackbarSeverity('warning');
      setSnackbarMessage(
        t('reminder-already-sent-wait', { seconds: remainingTime }),
      );
      setSnackbarOpen(true);
      return;
    }

    try {
      const result = await dispatch(
        sendTenderInquiryReminder({
          project_id: pid,
          tender_id: tid,
          tender_inquiry_id: template.id,
        }),
      );

      if (
        result.payload?.success ||
        result.meta?.requestStatus === 'fulfilled'
      ) {
        setSnackbarSeverity('success');
        setSnackbarMessage(t('reminder-sent-successfully'));
        setSnackbarOpen(true);

        // Disable the button for 1 minute (60 seconds)
        setReminderSentRecently(true);
        setRemainingTime(60);

        // Countdown timer
        countdownTimerRef.current = setInterval(() => {
          setRemainingTime((prev) => {
            if (prev <= 1) {
              if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Re-enable after 1 minute
        reminderTimerRef.current = setTimeout(() => {
          if (isMounted.current) {
            setReminderSentRecently(false);
            setRemainingTime(0);
          }
        }, 60000); // 60 seconds
      } else {
        throw new Error('Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      setSnackbarSeverity('error');
      setSnackbarMessage(t('reminder-send-failed'));
      setSnackbarOpen(true);
    }
  };

  const handleViewLogs = useCallback(() => {
    handleMenuClose();
    onViewLogs?.(template);
  }, [onViewLogs, template]);

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(
        actions.deleteTenderTemplate({
          did: template.id,
          tid,
          pid,
        }),
      );

      if (isMounted.current) {
        setDeleteDialogOpen(false);
        if (onDelete) {
          onDelete();
        }
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const canEdit = template?.final_status?.toLowerCase() !== 'approved';
  const canSend = template?.final_status?.toLowerCase() === 'approved';
  const canSendReminder =
    template?.final_status?.toLowerCase() === 'pending approval' &&
    !reminderSentRecently;
  const canDelete = template?.final_status?.toLowerCase() !== 'sent';
  const canViewLogs = true;

  return (
    <>
      <IconButton
        ref={triggerRef}
        aria-label="more actions"
        aria-controls={open ? 'actions-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleMenuOpen}
        size="small"
      >
        <MoreVertIcon />
      </IconButton>

      <Menu
        id="actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'actions-button',
        }}
      >
        {canEdit && (
          <MenuItem onClick={handleEditTender}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('edit-tender')}</ListItemText>
          </MenuItem>
        )}

        {canSend &&
          (!template?.can_send_tender ? (
            <Tooltip
              title={t('can-not-send-tender-until-supplier-list-approved')}
              placement="left"
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    fontSize: '1rem',
                    fontWeight: 500,
                    maxWidth: 400,
                  },
                },
              }}
            >
              <span>
                <MenuItem onClick={handleSendTender} disabled>
                  <ListItemIcon>
                    <SendIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t('send-tender')}</ListItemText>
                </MenuItem>
              </span>
            </Tooltip>
          ) : (
            <MenuItem onClick={handleSendTender}>
              <ListItemIcon>
                <SendIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('send-tender')}</ListItemText>
            </MenuItem>
          ))}

        {canDelete && (
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>
              {t('delete-tender')}
            </ListItemText>
          </MenuItem>
        )}

        {canViewLogs && (
          <MenuItem onClick={handleViewLogs}>
            <ListItemIcon>
              <VisibilityOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('view-logs')}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('confirm-delete')}</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            {t('delete-template-confirmation-1')}{' '}
            <Typography component="span" color="error" fontWeight="bold">
              {template.name}
            </Typography>
            ? {t('delete-template-confirmation-2')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{ color: clinkGreen, borderColor: clinkGreen }}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="outlined"
          >
            {t('delete-tender')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TemplateActionsMenu;
