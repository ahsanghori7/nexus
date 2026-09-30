import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const ConfirmModal = ({
  title = '',
  content = '',
  actionLabel = '',
  closeLabel = '',
  handleAction = () => null,
  externalOpen = false,
}) => {
  const [open, setOpen] = useState(externalOpen);

  useEffect(() => {
    setOpen(externalOpen);
  }, [externalOpen]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <BootstrapDialog onClose={handleClose} open={open}>
        <DialogTitle sx={{ m: 0, p: 2 }}>{title}</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <Typography gutterBottom>{content}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{closeLabel}</Button>
          <Button
            autoFocus
            onClick={() => {
              handleAction();
            }}
          >
            {actionLabel}
          </Button>
        </DialogActions>
      </BootstrapDialog>
  );
};

export default ConfirmModal;
