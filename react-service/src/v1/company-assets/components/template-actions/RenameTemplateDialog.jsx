import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

const RenameTemplateDialog = ({
    open,
    originalName,
    existingNames = [],
    onClose,
    onSubmit,
}) => {
    const { t } = useTranslation();
    const [value, setValue] = useState(originalName || '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setValue(originalName || '');
            setError('');
        }
    }, [open, originalName]);

    const trimmed = value.trim();
    const origTrim = (originalName || '').trim();
    const isChanged = trimmed !== '' && trimmed !== origTrim;

    const isDuplicate =
        isChanged &&
        existingNames
            .filter((n) => (n || '').trim() !== origTrim)
            .some((n) => (n || '').trim().toLowerCase() === trimmed.toLowerCase());

    useEffect(() => {
        setError(isDuplicate ? t('duplicate-template') : '');
    }, [isDuplicate, t]);

    const handleConfirm = () => {
        if (!isChanged || isDuplicate) return;
        onSubmit(trimmed);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t('rename-template')}</DialogTitle>
            <DialogContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                    {t('new-name')}
                </Typography>
                <TextField
                    autoFocus
                    fullWidth
                    margin="dense"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    error={Boolean(error)}
                    helperText={error || ' '}
                />
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button color="error" variant="contained" onClick={onClose}>
                    {t('cancel')}
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color="success"
                    disabled={!isChanged || isDuplicate}
                >
                    {t('rename')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RenameTemplateDialog
