import React from 'react';

const MockModal = ({
  open,
  setOpen,
  style,
  acceptStyleProp,
  cancelStyleProp
}) => {
  if (!open) return null;

  return (
    <div data-testid="submit-quote-modal">
      <div>Mock Modal</div>
      <button onClick={() => setOpen(false)}>Close</button>
    </div>
  );
};

export default MockModal;
