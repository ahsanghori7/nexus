import React from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';
import i18next from 'i18next';
import DOMPurify from 'dompurify';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const UploadBox = ({ handleUpload }) => (
  <Button
    sx={{
      border: `2px dashed ${lightPeriwinkle}`,
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: '100px',
    }}
    size="small"
    component="label"
    role={undefined}
    variant="outlined"
    tabIndex={-1}
  >
    <CloudUploadIcon sx={{ fontSize: 40, color: 'black' }} />
    <Typography
      sx={{ mt: 1 }}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(
          i18next.t('browse-to-upload-1', {
            interpolation: { escapeValue: false },
          }),
        ),
      }}
    />
    <Typography variant="body2" color="textSecondary">
      {i18next.t('browse-to-upload-2')}
    </Typography>
    <VisuallyHiddenInput type="file" onChange={handleUpload} />
  </Button>
);

export default UploadBox;
export { VisuallyHiddenInput };
