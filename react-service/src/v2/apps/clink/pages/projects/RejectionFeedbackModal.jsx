import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import { formatUKorAnzDateTime } from 'helpers/date';
import i18next from 'helpers/i18n';
import Avatar from '@mui/material/Avatar';

const RejectionFeedbackModal = ({
  open,
  onClose,
  status,
  approverName,
  pendingSince,
  comment,
  countryCode,
}) => {
  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{i18next.t('rejection-feedback')}</span>
        <IconButton aria-label="close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{ mb: 1 }}
        >
          {i18next.t('order-status')}:
          <strong style={{ marginLeft: '12px' }}>{status}</strong>
        </Typography>

        <Box display="flex" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            {i18next.t('approver-name')}:
          </Typography>
          <Avatar
            sx={{
              fontSize: 14,
              color: 'black !important',
              width: 36,
              height: 36,
              mx: 1.5,
            }}
          >
            <strong>
              {(approverName || '')
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .map((n) => n[0])
                .join('')
                .toUpperCase() || '?'}
            </strong>
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            <strong>{approverName || '—'}</strong>
          </Typography>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{ mb: 1.5 }}
        >
          {i18next.t('date')}:
          <strong style={{ marginLeft: '12px' }}>
            {formatUKorAnzDateTime(pendingSince, countryCode).date}
          </strong>
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{ mb: 1.5 }}
        >
          {i18next.t('time')}:
          <strong style={{ marginLeft: '12px' }}>
            {formatUKorAnzDateTime(pendingSince, countryCode).time}
          </strong>
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{ mb: 2, wordBreak: 'break-word' }}
        >
          {i18next.t('description')}:
          <strong style={{ marginLeft: '12px', whiteSpace: 'pre-wrap' }}>
            {comment}
          </strong>
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default RejectionFeedbackModal;
