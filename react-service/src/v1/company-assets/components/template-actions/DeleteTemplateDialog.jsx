import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { useTranslation } from 'react-i18next';

const DeleteTemplateDialog = ({ open, onClose, onConfirm }) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{t('sow-confirm-delete')}</DialogTitle>
            <DialogContent>
                <DialogContentText>{t('sow-undone-action')}</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button
                    color="success"
                    variant="contained"
                    onClick={onClose}
                    sx={{ mr: 1 }}
                >
                    {t('cancel')}
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    {t('delete')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteTemplateDialog;
