// __mocks__/@mui/material/Chip.jsx
import React from 'react';

const Chip = React.forwardRef(({ label, size, sx, onDelete, deleteIcon, ...props }, ref) => {
  return (
    <button data-testid="chip" ref={ref} {...props}>
      {label}
      {onDelete && (
        <span data-testid="chip-delete" onClick={onDelete}>
          {deleteIcon || 'X'}
        </span>
      )}
    </button>
  );
});

Chip.displayName = 'Chip';

export default Chip;
