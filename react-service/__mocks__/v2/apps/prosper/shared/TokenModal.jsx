import React from 'react';

const TokenModal = ({
  openElement,
  onHiddenModal = () => {},
  externalOpen = false,
  children,
  ...props
}) => {
  // Render the openElement that triggers the modal
  const triggerElement = React.isValidElement(openElement)
    ? React.cloneElement(openElement, { 'data-testid': 'token-modal-trigger' })
    : openElement;

  return (
    <div data-testid="token-modal-mock">
      {triggerElement}
      {externalOpen && (
        <div data-testid="token-modal-content">
          <button onClick={onHiddenModal} data-testid="token-modal-close">
            Close Modal
          </button>
          {children}
        </div>
      )}
    </div>
  );
};

export default TokenModal;
