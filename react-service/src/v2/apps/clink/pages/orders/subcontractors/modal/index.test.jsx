import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './index';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkRed: '#dc2626',
      },
      prosper: {
        dimGray2: '#9ca3af',
      },
    },
  },
}));

// Mock i18next
jest.mock('i18next', () => ({
  t: (key) => key,
}));

// Mock the ConfirmModal
jest.mock('v2/apps/shared/components/confirm-modal/v2', () => {
  return {
    __esModule: true,
    default: ({ children, openModal, handleClose, id, onBackdropClick }) => (
      <div
        data-testid="confirm-modal"
        data-open={openModal}
        data-id={id}
        onClick={() => handleClose && handleClose()}
        onKeyDown={() => handleClose && handleClose()}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>
    ),
    Content: ({ children, title, description, handleCancel, handleAccept, cancel, confirm, disabled }) => (
      <div data-testid="modal-content">
        {title && <div data-testid="modal-title">{title}</div>}
        {description && <div data-testid="modal-description">{description}</div>}
        {children}
        <div data-testid="modal-actions">
          {cancel && (
            <button
              data-testid="modal-cancel"
              onClick={handleCancel}
              type="button"
            >
              {cancel}
            </button>
          )}
          {confirm && (
            <button
              data-testid="modal-confirm"
              onClick={handleAccept}
              disabled={disabled}
              type="button"
            >
              {confirm}
            </button>
          )}
        </div>
      </div>
    ),
  };
});

describe('Modal Component', () => {
  const mockSetOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing when open is false', () => {
    const { container } = render(
      <Modal open={false} setOpen={mockSetOpen} />
    );
    expect(container).toBeTruthy();
  });

  it('should render modal when open prop is provided', () => {
    const mockOpen = {
      id: 'test-modal',
      title: 'Test Modal',
      description: 'Test description',
      cancel: 'Cancel',
      confirm: 'Confirm',
      handleAccept: jest.fn(),
    };

    render(<Modal open={mockOpen} setOpen={mockSetOpen} />);

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Test Modal');
    expect(screen.getByTestId('modal-description')).toHaveTextContent('Test description');
  });

  it('should handle modal close', () => {
    const mockOpen = {
      id: 'test-modal',
      title: 'Test Modal',
      handleAccept: jest.fn(),
    };

    render(<Modal open={mockOpen} setOpen={mockSetOpen} />);

    fireEvent.click(screen.getByTestId('confirm-modal'));
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('should handle accept action', () => {
    const mockHandleAccept = jest.fn();
    const mockOpen = {
      id: 'test-modal',
      title: 'Test Modal',
      confirm: 'Confirm',
      handleAccept: mockHandleAccept,
    };

    render(<Modal open={mockOpen} setOpen={mockSetOpen} />);

    fireEvent.click(screen.getByTestId('modal-confirm'));
    expect(mockHandleAccept).toHaveBeenCalled();
  });

  it('should handle cancel action', () => {
    const mockOpen = {
      id: 'test-modal',
      title: 'Test Modal',
      cancel: 'Cancel',
      handleAccept: jest.fn(),
    };

    render(<Modal open={mockOpen} setOpen={mockSetOpen} />);

    fireEvent.click(screen.getByTestId('modal-cancel'));
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('should render textarea when textArea prop is true', () => {
    const mockOpen = {
      id: 'test-modal',
      title: 'Test Modal',
      textArea: true,
      handleAccept: jest.fn(),
    };

    render(<Modal open={mockOpen} setOpen={mockSetOpen} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('boq-republish-reason-input')).toBeInTheDocument();
  });

  it('should handle textarea value changes', () => {
    const mockOpen = {
      id: 'test-modal',
      title: 'Test Modal',
      textArea: true,
      handleAccept: jest.fn(),
    };

    render(<Modal open={mockOpen} setOpen={mockSetOpen} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test reason' } });

    expect(textarea.value).toBe('Test reason');
  });

  it('should disable confirm button when textarea is empty', () => {
    const mockOpen = {
      id: 'test-modal',
      title: 'Test Modal',
      textArea: true,
      confirm: 'Confirm',
      handleAccept: jest.fn(),
    };

    render(<Modal open={mockOpen} setOpen={mockSetOpen} />);

    expect(screen.getByTestId('modal-confirm')).toBeDisabled();
  });

  it('should enable confirm button when textarea has content', () => {
    const mockOpen = {
      id: 'test-modal',
      title: 'Test Modal',
      textArea: true,
      confirm: 'Confirm',
      handleAccept: jest.fn(),
    };

    render(<Modal open={mockOpen} setOpen={mockSetOpen} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test reason' } });

    expect(screen.getByTestId('modal-confirm')).not.toBeDisabled();
  });

  it('should call handleAccept with textarea value when textArea is true', () => {
    const mockHandleAccept = jest.fn();
    const mockOpen = {
      id: 'test-modal',
      title: 'Test Modal',
      textArea: true,
      confirm: 'Confirm',
      handleAccept: mockHandleAccept,
    };

    render(<Modal open={mockOpen} setOpen={mockSetOpen} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test reason' } });
    fireEvent.click(screen.getByTestId('modal-confirm'));

    expect(mockHandleAccept).toHaveBeenCalledWith('Test reason');
  });

  it('should render children when provided', () => {
    const mockOpen = {
      id: 'test-modal',
      title: 'Test Modal',
      handleAccept: jest.fn(),
    };

    render(
      <Modal open={mockOpen} setOpen={mockSetOpen}>
        <div data-testid="custom-children">Custom Content</div>
      </Modal>
    );

    expect(screen.getByTestId('custom-children')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('should call callbackClose when modal is closed', () => {
    const mockCallbackClose = jest.fn();
    const mockOpen = {
      id: 'test-modal',
      title: 'Test Modal',
      callbackClose: mockCallbackClose,
      handleAccept: jest.fn(),
    };

    render(<Modal open={mockOpen} setOpen={mockSetOpen} />);

    fireEvent.click(screen.getByTestId('confirm-modal'));
    expect(mockCallbackClose).toHaveBeenCalled();
  });
});