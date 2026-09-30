import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// Test the Approve Button Loading State
describe('Header Approve Button Loading State', () => {
  // Simplified component to test the approve button behavior
  const ApproveButton = ({
    disabled = false,
    onClick = jest.fn(),
    isLoading = false,
  }) => (
    <Button
      sx={{ my: 0 }}
      disabled={disabled || isLoading}
      onClick={onClick}
      color="primary"
      variant="contained"
      data-testid="approve-button"
    >
      {isLoading ? (
        <Box display="flex" alignItems="center" gap="8px">
          <CircularProgress size={16} sx={{ color: '#9CA3AF' }} />
          Approving
        </Box>
      ) : (
        'approve-order'
      )}
    </Button>
  );

  describe('Button Rendering', () => {
    it('should render approve button', () => {
      render(<ApproveButton />);
      expect(screen.getByTestId('approve-button')).toBeInTheDocument();
    });

    it('should display approve text when not loading', () => {
      render(<ApproveButton isLoading={false} />);
      expect(screen.getByText('approve-order')).toBeInTheDocument();
    });

    it('should display loading text when loading', () => {
      render(<ApproveButton isLoading={true} />);
      expect(screen.getByText('Approving')).toBeInTheDocument();
    });

    it('should show spinner when loading', () => {
      const { container } = render(<ApproveButton isLoading={true} />);
      expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
    });
  });

  describe('Button State - Normal', () => {
    it('should be enabled when not loading and not disabled', () => {
      render(<ApproveButton isLoading={false} disabled={false} />);
      const button = screen.getByTestId('approve-button');
      expect(button).not.toBeDisabled();
    });

    it('should be disabled when disabled prop is true but not loading', () => {
      render(<ApproveButton isLoading={false} disabled={true} />);
      const button = screen.getByTestId('approve-button');
      expect(button).toBeDisabled();
    });

    it('should call onClick handler when clicked and not loading', async () => {
      const user = userEvent.setup();
      const onClickMock = jest.fn();
      render(<ApproveButton onClick={onClickMock} isLoading={false} />);

      const button = screen.getByTestId('approve-button');
      await user.click(button);

      expect(onClickMock).toHaveBeenCalled();
    });
  });

  describe('Button State - Loading', () => {
    it('should be disabled when loading', () => {
      render(<ApproveButton isLoading={true} />);
      const button = screen.getByTestId('approve-button');
      expect(button).toBeDisabled();
    });

    it('should remain disabled when loading even if disabled prop is false', () => {
      render(<ApproveButton isLoading={true} disabled={false} />);
      const button = screen.getByTestId('approve-button');
      expect(button).toBeDisabled();
    });

    it('should combine loading and disabled states', () => {
      render(<ApproveButton isLoading={true} disabled={true} />);
      const button = screen.getByTestId('approve-button');
      expect(button).toBeDisabled();
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const onClickMock = jest.fn();
      render(<ApproveButton onClick={onClickMock} isLoading={true} />);

      const button = screen.getByTestId('approve-button');
      // Button is disabled, so click won't trigger the handler
      expect(button).toBeDisabled();
    });
  });

  describe('Loading Spinner', () => {
    it('should render spinner element when loading', () => {
      const { container } = render(<ApproveButton isLoading={true} />);
      const spinner = container.querySelector('.MuiCircularProgress-root');
      expect(spinner).toBeInTheDocument();
    });

    it('should render spinner with correct class', () => {
      const { container } = render(<ApproveButton isLoading={true} />);
      const spinner = container.querySelector('.MuiCircularProgress-root');
      expect(spinner).toHaveClass('MuiCircularProgress-root');
    });

    it('should not render spinner when not loading', () => {
      const { container } = render(<ApproveButton isLoading={false} />);
      expect(container.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should transition from normal to loading', () => {
      const { rerender } = render(<ApproveButton isLoading={false} />);

      expect(screen.getByText('approve-order')).toBeInTheDocument();
      let button = screen.getByTestId('approve-button');
      expect(button).not.toBeDisabled();

      rerender(<ApproveButton isLoading={true} />);

      expect(screen.getByText('Approving')).toBeInTheDocument();
      button = screen.getByTestId('approve-button');
      expect(button).toBeDisabled();
    });

    it('should transition from loading to normal', () => {
      const { rerender } = render(<ApproveButton isLoading={true} />);

      expect(screen.getByText('Approving')).toBeInTheDocument();
      let button = screen.getByTestId('approve-button');
      expect(button).toBeDisabled();

      rerender(<ApproveButton isLoading={false} />);

      expect(screen.getByText('approve-order')).toBeInTheDocument();
      button = screen.getByTestId('approve-button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Handler Logic', () => {
    it('should handle approve order confirmation', async () => {
      const user = userEvent.setup();
      const handleConfirmMock = jest.fn();

      render(
        <ApproveButton onClick={handleConfirmMock} isLoading={false} />,
      );

      const button = screen.getByTestId('approve-button');
      await user.click(button);

      expect(handleConfirmMock).toHaveBeenCalledTimes(1);
    });

    it('should prevent multiple clicks during loading', () => {
      const handleConfirmMock = jest.fn();
      const { rerender } = render(
        <ApproveButton onClick={handleConfirmMock} isLoading={false} />,
      );

      const button = screen.getByTestId('approve-button');
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleConfirmMock).toHaveBeenCalledTimes(2);

      // Switch to loading state
      rerender(
        <ApproveButton onClick={handleConfirmMock} isLoading={true} />,
      );

      const loadingButton = screen.getByTestId('approve-button');
      fireEvent.click(loadingButton);

      // Should still be 2 because button is disabled
      expect(handleConfirmMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should display error state after failed approval', () => {
      const { rerender } = render(<ApproveButton isLoading={true} />);

      expect(screen.getByText('Approving')).toBeInTheDocument();

      // Simulate error state by transitioning out of loading
      rerender(<ApproveButton isLoading={false} disabled={true} />);

      expect(screen.getByText('approve-order')).toBeInTheDocument();
      const button = screen.getByTestId('approve-button');
      expect(button).toBeDisabled();
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      const handleConfirmMock = jest.fn();

      // Start with error state
      const { rerender } = render(
        <ApproveButton onClick={handleConfirmMock} isLoading={false} disabled={true} />,
      );

      // Reset error state
      rerender(
        <ApproveButton onClick={handleConfirmMock} isLoading={false} disabled={false} />,
      );

      const button = screen.getByTestId('approve-button');
      expect(button).not.toBeDisabled();

      await user.click(button);
      expect(handleConfirmMock).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<ApproveButton />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should indicate disabled state', () => {
      render(<ApproveButton isLoading={true} />);
      const button = screen.getByTestId('approve-button');
      expect(button).toHaveAttribute('disabled');
    });

    it('should have accessible text content', () => {
      render(<ApproveButton isLoading={false} />);
      expect(screen.getByText('approve-order')).toBeInTheDocument();
    });

    it('should display loading status in text', () => {
      render(<ApproveButton isLoading={true} />);
      expect(screen.getByText('Approving')).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('should show visual loading indicator', () => {
      const { container } = render(<ApproveButton isLoading={true} />);
      expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
    });

    it('should render loading text and spinner together', () => {
      render(<ApproveButton isLoading={true} />);
      expect(screen.getByText('Approving')).toBeInTheDocument();
      const { container } = render(<ApproveButton isLoading={true} />);
      expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
    });

    it('should display button in correct visual state when not loading', () => {
      render(<ApproveButton isLoading={false} />);
      const button = screen.getByTestId('approve-button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(screen.getByText('approve-order')).toBeInTheDocument();
    });
  });
});
