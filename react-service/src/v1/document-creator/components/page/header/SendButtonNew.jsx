import React from 'react';
import Button from '@mui/material/Button';
import SendWithContactsButton from './SendWithContactsButton';

const SendButton = ({
  subcontractor,
  disabled,
  handleSend,
  docType,
  children,
  did,
  meta,
}) => {
  if (docType === 'tender') {
    return (
      <Button
        disabled={disabled}
        onClick={handleSend}
        variant="contained"
        color="success"
        data-testid="document-creator-send-btn"
      >
        {children}
      </Button>
    );
  }

  const aid = subcontractor && Number(subcontractor.id);

  return (
    <SendWithContactsButton
      aid={aid}
      did={did}
      meta={meta}
      disabled={disabled}
      data-testid="document-creator-send-btn"
    />
  );
};

export default SendButton;
