import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArchiveDialog from './dialog';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'archive-dialog-title' && options) {
        return `${key}-${options.action}`;
      }
      if (key === 'archive-dialog-confirm' && options) {
        return `${key}-${options.action}`;
      }
      return key;
    }
  })
}));

// Mock Material-UI Dialog components to avoid Portal issues
jest.mock('@mui/material', () => ({
  Dialog: ({ open, children }) => 
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogTitle: ({ children }) => <div data-testid="dialog-title">{children}</div>,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogContentText: ({ children }) => <div data-testid="dialog-content-text">{children}</div>,
  DialogActions: ({ children }) => <div data-testid="dialog-actions">{children}</div>,
  Button: ({ onClick, children, color, ...props }) => (
    <button 
      data-testid="dialog-button" 
      onClick={onClick} 
      data-color={color}
      {...props}
    >
      {children}
    </button>
  )
}));

describe('ArchiveDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const mockEnquiry = {
    id: 1,
    archived: false,
    company: 'Test Company'
  };

  const mockArchivedEnquiry = {
    id: 2,
    archived: true,
    company: 'Archived Company'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when enquiry is not provided', () => {
    const { container } = render(
      <ArchiveDialog
        open={true}
        enquiry={null}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('does not render when open is false', () => {
    render(
      <ArchiveDialog
        open={false}
        enquiry={mockEnquiry}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders archive dialog for non-archived enquiry', () => {
    render(
      <ArchiveDialog
        open={true}
        enquiry={mockEnquiry}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('archive-dialog-title-archive');
    expect(screen.getByTestId('dialog-content-text')).toHaveTextContent('archive-dialog-archive-text');
    expect(screen.getByText('archive-dialog-cancel')).toBeInTheDocument();
    expect(screen.getByText('archive-dialog-confirm-archive')).toBeInTheDocument();
  });

  it('renders revert dialog for archived enquiry', () => {
    render(
      <ArchiveDialog
        open={true}
        enquiry={mockArchivedEnquiry}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('archive-dialog-title-revert');
    expect(screen.getByTestId('dialog-content-text')).toHaveTextContent('archive-dialog-revert-text');
    expect(screen.getByText('archive-dialog-cancel')).toBeInTheDocument();
    expect(screen.getByText('archive-dialog-confirm-revert')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <ArchiveDialog
        open={true}
        enquiry={mockEnquiry}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByText('archive-dialog-cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm with enquiry when confirm button is clicked', () => {
    render(
      <ArchiveDialog
        open={true}
        enquiry={mockEnquiry}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByText('archive-dialog-confirm-archive');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(mockEnquiry);
  });

  it('sets error color on confirm button', () => {
    render(
      <ArchiveDialog
        open={true}
        enquiry={mockEnquiry}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByText('archive-dialog-confirm-archive');
    expect(confirmButton).toHaveAttribute('data-color', 'error');
  });
});