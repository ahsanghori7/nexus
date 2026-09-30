import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTranslation } from 'react-i18next';

const EditTemplateDialog = ({
    open,
    originalTitle = '',
    originalBody = '',
    existingTitles,
    onClose,
    onSave,
}) => {
    const { t } = useTranslation();
    const [title, setTitle] = useState(originalTitle);
    const [body, setBody] = useState(originalBody);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setTitle(originalTitle);
            setBody(originalBody);
            setError('');
        }
    }, [open, originalTitle, originalBody]);

    const trimmed = (title || '').trim();
    const origTrim = (originalTitle || '').trim();
    const isChanged = trimmed !== origTrim || body !== originalBody;

    const isDuplicate =
        isChanged &&
        existingTitles
            .filter((n) => (n || '').trim().toLowerCase() !== origTrim.toLowerCase())
            .some((n) => (n || '').trim().toLowerCase() === trimmed.toLowerCase());

    useEffect(() => {
        setError(isDuplicate ? t('duplicate-template') : '');
    }, [isDuplicate, t]);

    const handleSave = () => {
        if (!isChanged || isDuplicate) return;
        onSave({ title: trimmed, body });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{t('edit-sow')}</DialogTitle>
            <DialogContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                    {t('title')}
                </Typography>
                <TextField
                    autoFocus
                    fullWidth
                    margin="dense"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={Boolean(error)}
                    helperText={error || ' '}
                />
                <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                    {t('body')}
                </Typography>
                <ReactQuill
                    value={body}
                    onChange={setBody}
                    style={{ marginTop: 16 }}
                    editorStyle={{ minHeight: 200 }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} color="error" variant="contained">
                    {t('cancel')}
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="success"
                    disabled={!isChanged || isDuplicate}
                >
                    {t('save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditTemplateDialog;
