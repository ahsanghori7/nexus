import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = { no: 'No', yes: 'Yes' };
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
    DialogTitle: ({ children }) => <h2 data-testid="dialog-title">{children}</h2>,
    DialogContent: ({ children }) => (
      <div data-testid="dialog-content">{children}</div>
    ),
    DialogActions: ({ children }) => (
      <div data-testid="dialog-actions">{children}</div>
    ),
    Button: ({ children, onClick, ...props }) => (
      <button type="button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Typography: ({ children, ...props }) => <p {...props}>{children}</p>,
  };
});

describe('ConfirmDeleteDialog', () => {
  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    mockOnCancel.mockReset();
    mockOnConfirm.mockReset();
    lastDialogOnClose = undefined;
  });

  it('does not render the dialog when closed', () => {
    render(
      <ConfirmDeleteDialog
        open={false}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders dialog content when open', () => {
    render(
      <ConfirmDeleteDialog
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Member')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this member?')
    ).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('calls onCancel when the No button is clicked', () => {
    render(
      <ConfirmDeleteDialog
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByText('No'));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when the Yes button is clicked', () => {
    render(
      <ConfirmDeleteDialog
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByText('Yes'));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('triggers onCancel when the dialog onClose handler fires', () => {
    render(
      <ConfirmDeleteDialog
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
