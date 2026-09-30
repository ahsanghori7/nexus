import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmUpdateDialog from './ConfirmUpdateDialog';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        notification: 'Notification',
        'threshold-update-confirmation-text':
          'Are you sure you want to update the threshold settings?',
        no: 'No',
        yes: 'Yes',
      };
      return translations[key] || key;
    },
  }),
}));

let lastDialogOnClose;
jest.mock('@mui/material', () => {
  const React = require('react');

  return {
    __esModule: true,
    Dialog: ({ open, onClose, children, ...props }) => {
      lastDialogOnClose = onClose;

      if (!open) {
        return null;
      }

      return (
        <div role="dialog" data-testid="dialog" {...props}>
          {children}
        </div>
      );
    },
    DialogTitle: ({ children }) => (
      <h2 data-testid="dialog-title">{children}</h2>
    ),
    DialogContent: ({ children }) => (
      <div data-testid="dialog-content">{children}</div>
    ),
    DialogActions: ({ children }) => (
      <div data-testid="dialog-actions">{children}</div>
    ),
    Button: ({ children, onClick, type = 'button', ...props }) => (
      <button type={type} onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Typography: ({ children, ...props }) => (
      <p data-testid="dialog-typography" {...props}>
        {children}
      </p>
    ),
  };
});

describe('ConfirmUpdateDialog', () => {
  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    mockOnCancel.mockReset();
    mockOnConfirm.mockReset();
    lastDialogOnClose = undefined;
  });

  it('does not render dialog content when closed', () => {
    render(
      <ConfirmUpdateDialog
        open={false}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders dialog details when open', () => {
    render(
      <ConfirmUpdateDialog
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Notification')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to update the threshold settings?')
    ).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('invokes onCancel when the No button is pressed', () => {
    render(
      <ConfirmUpdateDialog
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByText('No'));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('invokes onConfirm when the Yes button is pressed', () => {
    render(
      <ConfirmUpdateDialog
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByText('Yes'));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when the dialog onClose handler runs', () => {
    render(
      <ConfirmUpdateDialog
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );

    expect(typeof lastDialogOnClose).toBe('function');
    lastDialogOnClose();

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
