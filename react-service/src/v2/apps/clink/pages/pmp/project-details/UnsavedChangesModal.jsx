import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

const UnsavedChangesModal = ({ open, onLeave, onSave }) => {
  const { t } = useTranslation();

  return (
    <Dialog sx={{ '& .MuiPaper-root': { maxWidth: 500 } }} open={open}>
      <DialogTitle>{t('unsaved-changes-title')}</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>{t('unsaved-changes-desc')}</Typography>
        <Typography>{t('unsaved-changes-desc-2')}</Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', p: 3 }}>
        <Button variant="contained" color="error" onClick={onLeave}>
          {t('unsaved-changes-leave')}
        </Button>
        <Button variant="contained" color="success" onClick={onSave}>
          {t('unsaved-changes-save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnsavedChangesModal;
