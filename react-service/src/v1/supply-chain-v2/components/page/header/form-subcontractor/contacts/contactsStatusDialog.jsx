import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import i18next from 'v2/helpers/i18n';

export default function StatusDialog({ open, type, message, onClose }) {
  const isSuccess = type === 'success';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ textAlign: 'center', pt: 5, pb: 4 }}>
        <Box display="flex" justifyContent="center" mb={2}>
          {isSuccess ? (
            <CheckCircleOutlineIcon
              sx={{ fontSize: 70, color: 'success.main' }}
            />
          ) : (
            <ErrorOutlineIcon sx={{ fontSize: 70, color: 'error.main' }} />
          )}
        </Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {isSuccess ? 'Success' : 'Error'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          {i18next.t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
