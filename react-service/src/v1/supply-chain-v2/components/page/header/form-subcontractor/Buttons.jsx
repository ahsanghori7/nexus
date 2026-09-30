import React, { useState } from 'react';
import { Button as MuiButton } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import i18next from 'v2/helpers/i18n';
import GreenButton from '../../../../../global/components/general-ui/Buttons';

const CloseButton = ({ backPage, label = "Go Back" }) => (
  <MuiButton type="buton" onClick={backPage} color="error" variant="outlined">
    {label}
  </MuiButton>
);

const SubmitButton = ({ isDisabled, handleSubmit }) => {
  return (
    <GreenButton
      onClick={handleSubmit}
      type="button"
      label="Add"
      disabled={isDisabled}
    />
  );
};

const SubcontractorSubmitButton = ({ isDisabled, handleSubmit }) => {
  const [openConfirmation, setOpenConfirmation] = useState(false);

  const handleOpenConfirmation = () => {
    setOpenConfirmation(true);
  };

  const handleCloseConfirmation = () => {
    setOpenConfirmation(false);
  };

  const handleConfirmChanges = () => {
    handleSubmit();
    handleCloseConfirmation();
  };

  return (
    <>
      <MuiButton
        variant="contained"
        color="primary"
        onClick={handleOpenConfirmation}
        disabled={isDisabled}
      >
        {i18next.t('sc-save-changes')}
      </MuiButton>
      <Dialog open={openConfirmation} onClose={handleCloseConfirmation}>
        <DialogContent sx={{ p: 3 }}>
          <DialogContentText>
            {i18next.t('sc-save-changes-confirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <MuiButton
            onClick={handleCloseConfirmation}
            variant="outlined"
            color="secondary"
          >
            {i18next.t('cancel')}
          </MuiButton>
          <MuiButton
            onClick={handleConfirmChanges}
            variant="contained"
            color="primary"
            autoFocus
          >
            {i18next.t('sc-confirm-changes')}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export { CloseButton, SubmitButton, SubcontractorSubmitButton };
