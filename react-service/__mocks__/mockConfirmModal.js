// Mock for v2/apps/shared/components/confirm-modal
import React from 'react';

const ConfirmModal = ({
  data,
  selected,
  buttonLabel,
  title,
  subtitle,
  handleConfirm,
  ...props
}) => {
  const handleClick = () => {
    if (handleConfirm && data) {
      handleConfirm(data);
    }
  };

  return React.createElement('button', {
    'data-testid': 'confirm-modal',
    onClick: handleClick,
    className: selected ? 'selected' : '',
    ...props
  }, buttonLabel || 'Confirm');
};

export default ConfirmModal;
