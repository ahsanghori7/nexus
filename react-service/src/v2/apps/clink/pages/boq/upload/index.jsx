import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import defaultEntries from './initialEntries';

const { clinkLightPurple, black, clinkGreen } = CONSTANTS.colors.general;

const sxContent = {
  success: {
    height: '700px',
    width: '800px',
    maxWidth: '800px',
    m: 2,
  },
  error: {
    height: '700px',
    width: '800px',
    maxWidth: '800px',
    m: 2,
  },
};
const sxModal = {
  error: {
    width: '847px',
    maxWidth: '847px',
  },
  success: {
    width: '847px',
    maxWidth: '847px',
  },
};

const updateFunc =
  (currentEntity, dispatchFunc) =>
    (entries = null) => {
      if (currentEntity?.id) {
        const newEntries = entries?.length ? entries : defaultEntries;
        const data = {
          notes: {
            id: null,
            text: '',
          },
          entries: newEntries,
        };
        dispatchFunc(currentEntity, data);
      }
    };

const UploadButton = ({
  startIcon,
  handleButtonClick,
  buttonContent,
  disabled = false,
}) => (
  <Button
    startIcon={startIcon ?? null}
    onClick={handleButtonClick}
    disabled={disabled}
    sx={{
      width: '97%',
      color: 'black',
      fontSize: '13px',
      border: `1px solid ${clinkLightPurple}`,
      pl: '4px',
      py: '10px',
      mb: 1,
      justifyContent: 'flex-start',
      minHeight: '50px',
      '& .MuiButton-startIcon': { ml: 0, mr: '4px' },
    }}
  >
    {buttonContent}
  </Button>
);

const UploadModal = ({
  children,
  handleClick = null,
  modal = false,
  setModal = () => null,
  ButtonModal = () => null,
  buttonModalProps = {},
}) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setModal(false);
  };

  const handleButtonClick = () => {
    if (handleClick) {
      handleClick();
      return;
    }
    setOpen(true);
  };

  const styleModal = sxModal[modal] || {};
  const styleModalContent = sxContent[modal] || {
    height: '380px',
    maxHeight: '100%',
    m: 2,
  };
  return (
    <>
      <Grid item xs={12} lg={6}>
        <ButtonModal handleButtonClick={handleButtonClick} {...buttonModalProps} />
      </Grid>
      <Dialog
        open={open}
        onClose={handleClose}
        sx={{
          '& .MuiPaper-root': { borderRadius: 0 },
          '& .MuiDialog-container': {
            '& > div': styleModal,
          },
        }}
      >
        <Box
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 6px 6px 16px',
            borderBottom: `1px solid ${clinkLightPurple}`,
          }}
        >
          <Typography variant="h6" component="div" sx={{ fontSize: '14px' }}>
            {i18next.t('boq-import-file')}
          </Typography>
          <IconButton onClick={handleClose} aria-label="close" sx={{ p: 0 }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={styleModalContent}>{children}</Box>
      </Dialog>
    </>
  );
};

const Upload = ({ title = '', description = '', children, transform = '' }) => {
  return (
    <>
      <SystemUpdateAltIcon
        sx={{
          color: clinkGreen,
          fontSize: 36,
          mb: 1,
          mt: 2,
          transform,
        }}
      />
      <Box sx={{ mb: 2 }}>
        <Typography component="h3" sx={{ fontSize: '13px', color: black }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '13px', color: black, opacity: '0.5' }}>
          {description}
        </Typography>
      </Box>
      {children}
    </>
  );
};

export default Upload;
export { UploadModal, UploadButton, updateFunc };
