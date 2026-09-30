import React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import { useTheme } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';

const { white } = CONSTANTS.colors.general;
const { SilverSand } = CONSTANTS.colors.prosper;
const { proxima } = CONSTANTS.fonts;
const { iconCloseButtonCrossGrey } = CONSTANTS.s3;

const OpenModal = ({ children, open = false, handleClose = () => null }) => {
  const theme = useTheme();
  const classes = {
    root: {
      position: 'absolute',
      fontFamily: proxima,
      top: '50%',
      left: '50%',
      width: '100%',
      height: '100%',
      maxWidth: '1200px',
      maxHeight: 'calc(100vh - 100px)',
      transform: 'translate(-50%, -50%)',
      backgroundColor: white,
      borderRadius: '8px',
      border: 0,
      outline: 0,
      padding: 2,
      boxSizing: 'border-box',
      [theme.breakpoints.down('sm')]: {
        maxWidth: 'calc(100vw - 30px)',
        maxHeight: 'calc(100vh - 30px)',
      },
    },
    closeButton: {
      boxSizing: 'border-box',
      position: 'relative',
      '& .MuiButtonBase-root': {
        position: 'absolute!important',
        top: '8px',
        right: '8px',
        backgroundColor: SilverSand,
        borderRadius: '50%',
        width: '39px',
        minWidth: 'auto',
        minHeight: 'auto',
        height: '39px',
        '&:hover': { backgroundColor: SilverSand },
        '& .MuiAvatar-root': {
          width: '28px',
          height: '28px',
        },
      },
    },
    childrenStyles: {
      fontFamily: proxima,
      padding: '0 30px 140px',
      height: '100%',
      [theme.breakpoints.down('sm')]: {
        padding: '0 8px 130px',
      },
    },
  };
  return (
    <Modal open={open} onClose={handleClose} disableEnforceFocus>
      <Box sx={classes.root}>
        <Box sx={classes.closeButton}>
          <Button onClick={handleClose}>
            <Avatar src={iconCloseButtonCrossGrey} />
          </Button>
        </Box>
        <Box sx={classes.childrenStyles}>{children}</Box>
      </Box>
    </Modal>
  );
};

export default OpenModal;
