import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';

const Modal = ({
  title,
  subtitle,
  buttonContent,
  ShowButton,
  backdrop,
  children,
  render,
  showClose,
  onHide,
  externalState = null,
}) => {
  const localState = useState(false);
  const [open, setOpen] = externalState || localState;

  const handleOpen = () => setOpen(true);
  const handleClose = (e, reason) => {
    if (reason === 'backdropClick' && !backdrop) {
      return;
    }
    setOpen(false);
    if (onHide) {
      onHide();
    }
  };
  const setShow = (val) => setOpen(val);

  return (
    <>
      {ShowButton && (
        <ShowButton
          variant="contained"
          size="small"
          content={buttonContent || title}
          handleClick={handleOpen}
        />
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { padding: 2, maxWidth: '750px' } }}
        data-testid="modal"
      >
        {title && (
          <DialogTitle data-testid="modal-title">
            <Typography variant="h4" component="div" fontWeight={600}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="subtitle1" component="div">
                {subtitle}
              </Typography>
            )}
            {showClose && (
              <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>
        )}
        <DialogContent data-testid="modal-content">
          {render ? render({ setShow }) : children}
        </DialogContent>
      </Dialog>
    </>
  );
};

Modal.defaultProps = {
  title: 'Modal',
  subtitle: null,
  buttonContent: null,
  backdrop: true,
  ShowButton: null,
  showClose: true,
};

Modal.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.object,
  ]),
  subtitle: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.object,
  ]),
  buttonContent: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.object,
  ]),
  backdrop: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  ShowButton: PropTypes.func,
  showClose: PropTypes.bool,
};

export default Modal;
