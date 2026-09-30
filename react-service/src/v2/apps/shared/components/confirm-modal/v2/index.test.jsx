import React from 'react';
import { render, screen } from '@testing-library/react';
import ConfirmModal from './index.jsx';

const mockModalImpl = jest.fn(({ children, open, onBackdropClick, ...props }) => {
  // Filter out any other custom event handlers that shouldn't be passed to DOM
  const domProps = Object.keys(props).reduce((acc, key) => {
    if (!key.startsWith('on') || ['onClick', 'onChange', 'onSubmit', 'onFocus', 'onBlur'].includes(key)) {
      acc[key] = props[key];
    }
    return acc;
  }, {});

  return open ? (
    <div data-testid="confirm-modal" {...domProps}>
      {children}
    </div>
  ) : null;
});

jest.mock('@mui/material/Modal', () => ({
  __esModule: true,
  default: (props) => mockModalImpl(props),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: { s3: {}, colors: {} },
}));

jest.mock('./Content', () => ({ children }) => (
  <div data-testid="modal-content">{children}</div>
));

describe('ConfirmModal v2 index', () => {
  beforeEach(() => {
    mockModalImpl.mockClear();
  });

  it('renders modal with provided children when open', () => {
    const handleClose = jest.fn();
    render(
      <ConfirmModal openModal id="test-modal" handleClose={handleClose}>
        <div>Inner content</div>
      </ConfirmModal>
    );

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Inner content')).toBeInTheDocument();

    const modalProps = mockModalImpl.mock.calls[0][0];
    expect(modalProps.id).toBe('test-modal');
    expect(modalProps.onClose).toBe(handleClose);
  });

  it('passes open trigger and backdrop handler when provided', () => {
    const backdrop = jest.fn();
    render(
      <ConfirmModal
        openModal
        openButtonModal={<button>Launch modal</button>}
        onBackdropClick={backdrop}
      >
        <span>Body</span>
      </ConfirmModal>
    );

    expect(screen.getByText('Launch modal')).toBeInTheDocument();
    const modalProps = mockModalImpl.mock.calls[0][0];
    expect(modalProps.onBackdropClick).toBe(backdrop);
  });

  it('defaults to closed when openModal is omitted', () => {
    render(
      <ConfirmModal>
        <span>Body</span>
      </ConfirmModal>
    );

    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('does not attach backdrop handler when not provided', () => {
    render(
      <ConfirmModal openModal>
        <span>Body</span>
      </ConfirmModal>
    );

    const modalProps = mockModalImpl.mock.calls[0][0];
    expect(modalProps.onBackdropClick).toBeUndefined();
  });
});
