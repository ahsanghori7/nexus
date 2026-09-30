import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Confirm from './Confirm';

// Mock the ConfirmModal component
jest.mock('v2/apps/shared/components/confirm-modal/v2', () => ({
  __esModule: true,
  default: ({ id, openModal, handleClose, children }) => (
    <div data-testid="confirm-modal" data-id={id} data-open={openModal}>
      {children}
      <button data-testid="modal-close" onClick={handleClose}>
        Close
      </button>
    </div>
  ),
  Content: ({ title, cancel, confirm, description, handleCancel, handleAccept }) => (
    <div data-testid="modal-content">
      <h2 data-testid="modal-title">{title}</h2>
      <p data-testid="modal-description">{description}</p>
      <button data-testid="modal-cancel" onClick={handleCancel}>
        {cancel}
      </button>
      <button data-testid="modal-confirm" onClick={handleAccept}>
        {confirm}
      </button>
    </div>
  ),
}));

describe('Confirm Component', () => {
  let mockSetOpen;
  let mockHandleConfirm;

  beforeEach(() => {
    mockSetOpen = jest.fn();
    mockHandleConfirm = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the confirm modal when open is true', () => {
      render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    });

    it('should render the confirm modal when open is false', () => {
      render(
        <Confirm
          open={false}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    });

    it('should pass correct id to ConfirmModal', () => {
      render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-id', 'delete-team-member');
    });

    it('should pass open state to ConfirmModal', () => {
      const { rerender } = render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'true');

      rerender(
        <Confirm
          open={false}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'false');
    });
  });

  describe('Content Modal Props', () => {
    it('should render correct title', () => {
      render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('modal-title')).toHaveTextContent('confirm-deleting-team-member');
    });

    it('should render correct description', () => {
      render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('modal-description')).toHaveTextContent('confirm-deleting-team-member-desc');
    });

    it('should render correct button labels', () => {
      render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('modal-cancel')).toHaveTextContent('cancel');
      expect(screen.getByTestId('modal-confirm')).toHaveTextContent('confirm');
    });
  });

  describe('Event Handlers', () => {
    it('should call setOpen(false) when modal close is triggered', () => {
      render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      fireEvent.click(screen.getByTestId('modal-close'));

      expect(mockSetOpen).toHaveBeenCalledWith(false);
      expect(mockSetOpen).toHaveBeenCalledTimes(1);
    });

    it('should call setOpen(false) when cancel button is clicked', () => {
      render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      fireEvent.click(screen.getByTestId('modal-cancel'));

      expect(mockSetOpen).toHaveBeenCalledWith(false);
      expect(mockSetOpen).toHaveBeenCalledTimes(1);
    });

    it('should call handleConfirm when confirm button is clicked', () => {
      render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      fireEvent.click(screen.getByTestId('modal-confirm'));

      expect(mockHandleConfirm).toHaveBeenCalledTimes(1);
      expect(mockSetOpen).not.toHaveBeenCalled();
    });

    it('should handle multiple interactions correctly', () => {
      render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      // First click cancel
      fireEvent.click(screen.getByTestId('modal-cancel'));
      expect(mockSetOpen).toHaveBeenCalledWith(false);
      expect(mockSetOpen).toHaveBeenCalledTimes(1);

      // Then click confirm
      fireEvent.click(screen.getByTestId('modal-confirm'));
      expect(mockHandleConfirm).toHaveBeenCalledTimes(1);

      // setOpen should only have been called once (from cancel)
      expect(mockSetOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Validation', () => {
    it('should handle undefined setOpen gracefully', () => {
      expect(() => {
        render(
          <Confirm
            open={true}
            setOpen={undefined}
            handleConfirm={mockHandleConfirm}
          />
        );
      }).not.toThrow();
    });

    it('should handle undefined handleConfirm gracefully', () => {
      expect(() => {
        render(
          <Confirm
            open={true}
            setOpen={mockSetOpen}
            handleConfirm={undefined}
          />
        );
      }).not.toThrow();
    });

    it('should handle null values gracefully', () => {
      expect(() => {
        render(
          <Confirm
            open={null}
            setOpen={null}
            handleConfirm={null}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('should work with different open states during re-renders', () => {
      const { rerender } = render(
        <Confirm
          open={false}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'false');

      rerender(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'true');

      rerender(
        <Confirm
          open={false}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'false');
    });

    it('should maintain function references across re-renders', () => {
      const { rerender } = render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      const cancelButton = screen.getByTestId('modal-cancel');
      const confirmButton = screen.getByTestId('modal-confirm');

      // Click buttons to verify they work
      fireEvent.click(cancelButton);
      fireEvent.click(confirmButton);

      expect(mockSetOpen).toHaveBeenCalledTimes(1);
      expect(mockHandleConfirm).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      // Clear previous calls
      mockSetOpen.mockClear();
      mockHandleConfirm.mockClear();

      // Click buttons again to verify they still work
      fireEvent.click(screen.getByTestId('modal-cancel'));
      fireEvent.click(screen.getByTestId('modal-confirm'));

      expect(mockSetOpen).toHaveBeenCalledTimes(1);
      expect(mockHandleConfirm).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid successive clicks correctly', () => {
      render(
        <Confirm
          open={true}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      const confirmButton = screen.getByTestId('modal-confirm');
      const cancelButton = screen.getByTestId('modal-cancel');

      // Rapid clicks on confirm button
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);

      expect(mockHandleConfirm).toHaveBeenCalledTimes(3);

      // Rapid clicks on cancel button
      fireEvent.click(cancelButton);
      fireEvent.click(cancelButton);

      expect(mockSetOpen).toHaveBeenCalledTimes(2);
      expect(mockSetOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle boolean conversion for open prop', () => {
      const { rerender } = render(
        <Confirm
          open={1}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', '1');

      rerender(
        <Confirm
          open={0}
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', '0');

      rerender(
        <Confirm
          open=""
          setOpen={mockSetOpen}
          handleConfirm={mockHandleConfirm}
        />
      );

      expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', '');
    });

    it('should work with mock functions that return values', () => {
      const mockSetOpenWithReturn = jest.fn(() => 'closed');
      const mockHandleConfirmWithReturn = jest.fn(() => 'confirmed');

      render(
        <Confirm
          open={true}
          setOpen={mockSetOpenWithReturn}
          handleConfirm={mockHandleConfirmWithReturn}
        />
      );

      fireEvent.click(screen.getByTestId('modal-cancel'));
      fireEvent.click(screen.getByTestId('modal-confirm'));

      expect(mockSetOpenWithReturn).toHaveBeenCalledWith(false);
      expect(mockHandleConfirmWithReturn).toHaveBeenCalled();
    });
  });
});