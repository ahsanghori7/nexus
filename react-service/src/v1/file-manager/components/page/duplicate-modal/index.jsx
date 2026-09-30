import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid2 from '@mui/material/Grid2';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 500,
    bgcolor: 'background.paper',
    borderRadius: '12px',
    boxShadow: 24,
    p: 3,
    textAlign: 'center',
};

const DuplicateFilesModal = ({
    open,
    onClose,
    duplicateFiles = [],
    onRename,
    onOverwrite
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="duplicate-modal-title"
            aria-describedby="duplicate-modal-description"
        >
            <Box sx={modalStyle}>
                <Typography
                    id="duplicate-modal-title"
                    variant="h5"
                    sx={{ mb: 2, fontWeight: 600 }}
                >
                    {t('overwrite-existing-file')}
                </Typography>
                <Box id="duplicate-modal-description" sx={{ textAlign: 'left' }}>

                    <Typography sx={{ mb: 2, fontSize: 16 }}>
                        {t('fallowing-files-exists-1')}

                        <Typography component="span" sx={{ fontWeight: 700 }}>
                            {duplicateFiles.map(f => f.rawFile.name).join(', ')}
                        </Typography>

                        {t('fallowing-files-exists-2')}
                    </Typography>


                    <Grid2 container spacing={2}>
                        <Grid2 size={4}>
                            <Button
                                variant="contained"
                                color="success"
                                fullWidth
                                sx={{ lineHeight: 1 }}
                                onClick={onRename}
                            >
                                {t('save-new-version')}
                            </Button>
                        </Grid2>
                        <Grid2 size={4}>
                            <Button
                                variant="outlined"
                                color="error"
                                fullWidth
                                sx={{ lineHeight: 1 }}
                                onClick={onOverwrite}
                            >
                                {t('yes-overwrite')}
                            </Button>
                        </Grid2>
                        <Grid2 size={4}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                fullWidth
                                sx={{ lineHeight: 1 }}
                                onClick={onClose}
                            >
                                {t('cancel')}
                            </Button>
                        </Grid2>
                    </Grid2>
                </Box>
            </Box>
        </Modal>
    );
};

export default DuplicateFilesModal;
