// Mock for v2/apps/shared/components/Alert
import React from 'react';

const FlashMessage = ({ status, message, open, handleClose }) => {
  if (!open) return null;

  return (
    <div
      data-testid="flash-message"
      data-status={status}
      className={`flash-message flash-message-${status}`}
    >
      <div data-testid="flash-message-content">{message}</div>
      <button
        data-testid="flash-message-close"
        onClick={handleClose}
      >
        Close
      </button>
    </div>
  );
};

export default FlashMessage;
