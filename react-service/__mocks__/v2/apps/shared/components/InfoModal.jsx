import React from 'react';

const MockInfoModal = ({
  theme,
  message,
  closeLabel,
  disableEscapeKeyDown,
  onHidden
}) => (
  <div data-testid="info-modal">
    <div>{message}</div>
    <button onClick={onHidden}>{closeLabel}</button>
  </div>
);

export default MockInfoModal;
