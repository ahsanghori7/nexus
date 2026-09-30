import React from 'react';
import { CONSTANTS, Image } from 'clink-components';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import DOMPurify from 'dompurify';

const { iconCloseRed } = CONSTANTS.s3;

export default function MuiDialog({
  title = null,
  titleProps = {},
  appBarProps = {},
  children = null,
  preContent = null,
  actions = null,
  handleClose = null,
  handleXClose = null,
  border = true,
  enableFullScreen = true,
  noHeader = false,
  iconClose = iconCloseRed,
  open,
  dialogWidth,
  slotProps = {},
  context = BASE_DIRS.V2.PROSPER,
}) {

  const muitheme = useTheme();
  const mediumScreen = useMediaQuery(muitheme.breakpoints.down('md'));
  const fullScreen = enableFullScreen && mediumScreen;

  const onXClose = handleXClose || handleClose;
  const colorProp = {};
  if (context === BASE_DIRS.V2.PROSPER) {
    colorProp.color = 'white';
  }
  return (
    <Dialog
      slotProps={slotProps}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          maxWidth: dialogWidth ? `${dialogWidth}px` : '600px',
        },
      }}
      fullScreen={fullScreen}
      disableEscapeKeyDown
      open={open}
      onClose={() => handleClose && handleClose()}
    >
      <AppBar
        sx={{
          position: noHeader ? 'absolute' : 'relative',
          boxShadow: 'none',
        }}
        {...appBarProps}
        {...colorProp}
      >
        <Toolbar sx={{ justifyContent: 'end' }}>
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => onXClose && onXClose()}
            aria-label="close"
          >
            <Image src={iconClose} />
          </IconButton>
        </Toolbar>
      </AppBar>
      {title && (
        <DialogTitle {...titleProps} data-testid="dialog-title">
          <Typography
            variant="boldTitle"
            data-i18n="[html]content.body"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(title),
            }}
          />
        </DialogTitle>
      )}
      {preContent}
      <DialogContent>{children}</DialogContent>
      {actions && (
        <DialogActions
          sx={{
            borderTop: border ? '1px solid black' : null,
            justifyContent: 'space-evenly',
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
