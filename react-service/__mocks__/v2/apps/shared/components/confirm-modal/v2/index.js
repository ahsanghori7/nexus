// Mock for v2/apps/shared/components/confirm-modal/v2
import React from 'react';

const ConfirmModal = ({
  openModal,
  handleClose,
  openButtonModal,
  children,
  ...props
}) => {
  return (
    <div data-testid="confirm-modal-wrapper">
      {openButtonModal}
      {openModal && (
        <div data-testid="confirm-modal" {...props}>
          {children}
        </div>
      )}
    </div>
  );
};

// Also export the Content component
export const Content = ({ handleAccept, handleCancel, title, description, confirm, cancel, extraDescription, ...props }) => {
  // Mock translation function
  const t = (key) => {
    const translations = {
      'project-unlocked': 'Project Unlocked',
      'project-unlocked-text': 'Project has been unlocked successfully',
      'close': 'Close',
      'confirm-unlocking': 'Confirm Unlocking',
      'confirm-unlocking-text-2': 'Are you sure you want to unlock this project?',
      'cancel': 'Cancel',
      'confirm': 'Confirm'
    };
    return translations[key] || key;
  };

  return (
    <div data-testid="confirm-modal-content" {...props}>
      <h2>{t(title)}</h2>
      <p>{t(description)}</p>
      {extraDescription && <div>{extraDescription}</div>}
      <button onClick={handleCancel} data-testid="cancel-button">{t(cancel || 'cancel')}</button>
      <button onClick={handleAccept} data-testid="accept-button">{t(confirm || 'confirm')}</button>
    </div>
  );
};

export default ConfirmModal;
