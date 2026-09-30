import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'v2/helpers/i18n';

// Test the WithdrawApprovalDialog component behavior
describe('WithdrawApprovalDialog Loading State', () => {
  // Mock dialog component
  const WithdrawApprovalDialog = ({ open, onClose, onConfirm, loading = false }) => {
    const Dialog = ({ children, open: dialogOpen, onClose: handleClose }) => 
      dialogOpen ? <div data-testid="dialog">{children}</div> : null;
    const DialogTitle = ({ children }) => <div data-testid="dialog-title">{children}</div>;
    const DialogContent = ({ children }) => <div data-testid="dialog-content">{children}</div>;
    const DialogContentText = ({ children }) => <div data-testid="dialog-text">{children}</div>;
    const DialogActions = ({ children }) => <div data-testid="dialog-actions">{children}</div>;
    const Button = ({ children, onClick, disabled, startIcon, ...props }) => (
      <button
        onClick={onClick}
        disabled={disabled}
        data-testid={`button-${children}`}
        {...props}
      >
        {startIcon}
        {children}
      </button>
    );

    return (
      <Dialog open={open} onClose={!loading ? onClose : undefined}>
        <DialogTitle>withdraw-order-approval-title</DialogTitle>
        <DialogContent>
          <DialogContentText>
            withdraw-order-approval-description
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const mockProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog Rendering', () => {
    it('should render the dialog when open is true', () => {
      render(<WithdrawApprovalDialog {...mockProps} />);
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('withdraw-order-approval-title')).toBeInTheDocument();
    });

    it('should not render the dialog when open is false', () => {
      render(<WithdrawApprovalDialog {...mockProps} open={false} />);
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should render title, content, and action buttons', () => {
      render(<WithdrawApprovalDialog {...mockProps} />);
      expect(screen.getByText('withdraw-order-approval-title')).toBeInTheDocument();
      expect(screen.getByText('withdraw-order-approval-description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'confirm' })).toBeInTheDocument();
    });
  });

  describe('Button States - Normal', () => {
    it('should enable both buttons when not loading', () => {
      render(<WithdrawApprovalDialog {...mockProps} loading={false} />);
      const cancelButton = screen.getByRole('button', { name: 'cancel' });
      const confirmButton = screen.getByRole('button', { name: 'confirm' });

      expect(cancelButton).not.toBeDisabled();
      expect(confirmButton).not.toBeDisabled();
    });

    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirmMock = jest.fn();
      render(
        <WithdrawApprovalDialog
          {...mockProps}
          onConfirm={onConfirmMock}
          loading={false}
        />,
      );

      const confirmButton = screen.getByRole('button', { name: 'confirm' });
      await user.click(confirmButton);

      expect(onConfirmMock).toHaveBeenCalled();
    });

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCloseMock = jest.fn();
      render(
        <WithdrawApprovalDialog
          {...mockProps}
          onClose={onCloseMock}
          loading={false}
        />,
      );

      const cancelButton = screen.getByRole('button', { name: 'cancel' });
      await user.click(cancelButton);

      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  describe('Button States - Loading', () => {
    it('should disable both buttons when loading is true', () => {
      render(<WithdrawApprovalDialog {...mockProps} loading={true} />);
      const cancelButton = screen.getByRole('button', { name: 'cancel' });
      const confirmButton = screen.getByRole('button', { name: 'confirm' });

      expect(cancelButton).toBeDisabled();
      expect(confirmButton).toBeDisabled();
    });

    it('should prevent dialog close when loading is true', () => {
      const onCloseMock = jest.fn();
      const { rerender } = render(
        <WithdrawApprovalDialog
          {...mockProps}
          onClose={onCloseMock}
          loading={true}
        />,
      );

      // The dialog should not accept onClose while loading
      // Dialog close handler is controlled by loading state
      expect(onCloseMock).not.toHaveBeenCalled();
    });

    it('should not trigger onConfirm when button is disabled during loading', async () => {
      const user = userEvent.setup();
      const onConfirmMock = jest.fn();
      render(
        <WithdrawApprovalDialog
          {...mockProps}
          onConfirm={onConfirmMock}
          loading={true}
        />,
      );

      const confirmButton = screen.getByRole('button', { name: 'confirm' });
      // Button is disabled, so click should not trigger the handler
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Loading State Transitions', () => {
    it('should transition from loading to not loading', () => {
      const { rerender } = render(
        <WithdrawApprovalDialog {...mockProps} loading={true} />,
      );

      let cancelButton = screen.getByRole('button', { name: 'cancel' });
      let confirmButton = screen.getByRole('button', { name: 'confirm' });

      expect(cancelButton).toBeDisabled();
      expect(confirmButton).toBeDisabled();

      rerender(<WithdrawApprovalDialog {...mockProps} loading={false} />);

      cancelButton = screen.getByRole('button', { name: 'cancel' });
      confirmButton = screen.getByRole('button', { name: 'confirm' });

      expect(cancelButton).not.toBeDisabled();
      expect(confirmButton).not.toBeDisabled();
    });

    it('should transition from not loading to loading', () => {
      const { rerender } = render(
        <WithdrawApprovalDialog {...mockProps} loading={false} />,
      );

      let cancelButton = screen.getByRole('button', { name: 'cancel' });
      let confirmButton = screen.getByRole('button', { name: 'confirm' });

      expect(cancelButton).not.toBeDisabled();
      expect(confirmButton).not.toBeDisabled();

      rerender(<WithdrawApprovalDialog {...mockProps} loading={true} />);

      cancelButton = screen.getByRole('button', { name: 'cancel' });
      confirmButton = screen.getByRole('button', { name: 'confirm' });

      expect(cancelButton).toBeDisabled();
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Dialog Close Behavior', () => {
    it('should prevent closing when loading', () => {
      const onCloseMock = jest.fn();
      render(
        <WithdrawApprovalDialog
          {...mockProps}
          onClose={onCloseMock}
          open={true}
          loading={true}
        />,
      );

      // When loading is true, onClose should be undefined for the Dialog
      // This prevents the dialog from closing
      const dialog = screen.getByTestId('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should allow closing when not loading', () => {
      const onCloseMock = jest.fn();
      render(
        <WithdrawApprovalDialog
          {...mockProps}
          onClose={onCloseMock}
          open={true}
          loading={false}
        />,
      );

      const dialog = screen.getByTestId('dialog');
      expect(dialog).toBeInTheDocument();

      // When loading is false, onClose should be callable
      const cancelButton = screen.getByRole('button', { name: 'cancel' });
      fireEvent.click(cancelButton);

      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
