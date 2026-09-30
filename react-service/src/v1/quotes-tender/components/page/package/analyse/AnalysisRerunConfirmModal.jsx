import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import i18next from 'v2/helpers/i18n';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  maxWidth: 'calc(100vw - 32px)',
  bgcolor: 'background.paper',
  borderRadius: '12px',
  boxShadow: 24,
  p: 3,
};

const AnalysisRerunConfirmModal = ({ open, onClose, onConfirm }) => (
  <Modal
    open={open}
    onClose={onClose}
    aria-labelledby="analysis-rerun-confirm-title"
    aria-describedby="analysis-rerun-confirm-description"
  >
    <Box sx={modalStyle}>
      <Typography id="analysis-rerun-confirm-title" variant="h6" component="h2">
        {i18next.t('analysis-tool-rerun-confirm-title')}
      </Typography>
      <Typography
        id="analysis-rerun-confirm-description"
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2, lineHeight: 1.5 }}
      >
        {i18next.t('analysis-tool-rerun-confirm-message')}
      </Typography>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          {i18next.t('cancel')}
        </Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          {i18next.t('confirm')}
        </Button>
      </Box>
    </Box>
  </Modal>
);

export default AnalysisRerunConfirmModal;
