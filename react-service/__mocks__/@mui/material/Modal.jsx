// __mocks__/@mui/material/Modal.jsx
import React from 'react';

const MockModal = React.forwardRef(({ children, open, onClose, ...props }, ref) => {
  if (!open) {
    return null;
  }
  // Ensure all passed props are spread, including any event handlers or aria attributes
  return (
    <div data-testid="mock-mui-modal" ref={ref} {...props}>
      {typeof onClose === 'function' && (
        <button
          type="button"
          data-testid="modal-backdrop-dismiss"
          onClick={() => onClose({}, 'backdropClick')}
        >
          dismiss
        </button>
      )}
      {children}
    </div>
  );
});

MockModal.displayName = 'MockModal';
export default MockModal;
