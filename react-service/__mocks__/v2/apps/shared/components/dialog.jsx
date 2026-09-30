import React from 'react';

const MuiDialog = ({
  title,
  open = false,
  handleClose = jest.fn(),
  handleXClose = jest.fn(),
  actions = null,
  preContent = null,
  children,
  context = 'admin',
  ...props
}) => {
  if (!open) return null;

  return (
    <div data-testid="mui-dialog" role="dialog" preContent={preContent} {...props}>
      <div data-testid="dialog-header">
        <h2>{title}</h2>
        <button
          data-testid="dialog-close-x"
          onClick={handleXClose}
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
      {preContent && (
        <div data-testid="dialog-pre-content">
          {preContent}
        </div>
      )}
      <div data-testid="dialog-content">
        {children}
      </div>
      {actions && (
        <div data-testid="dialog-actions">
          {actions}
        </div>
      )}
      <button
        data-testid="dialog-close"
        onClick={handleClose}
      >
        Close
      </button>
    </div>
  );
};

export default MuiDialog;
