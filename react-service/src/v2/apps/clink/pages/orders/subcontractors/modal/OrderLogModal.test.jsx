import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OrderLogModal from './index';

const confirmModalMock = jest.fn();
const contentModalMock = jest.fn();

function MockConfirmModal({ children, ...props }) {
  confirmModalMock({ ...props, children });
  return <div data-testid="confirm-modal">{children}</div>;
}

function MockContentModal({
  children,
  handleCancel,
  handleAccept,
  disabled,
  ...props
}) {
  contentModalMock({ ...props, handleCancel, handleAccept, disabled, children });
  return (
    <div data-testid="confirm-modal-content" data-disabled={disabled}>
      <button
        type="button"
        data-testid="cancel-button"
        onClick={() => handleCancel && handleCancel()}
      >
        cancel
      </button>
      <button
        type="button"
        data-testid="accept-button"
        onClick={() => handleAccept && handleAccept()}
        disabled={disabled}
      >
        accept
      </button>
      {children}
    </div>
  );
}

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: { clinkRed: '#f00' },
      prosper: { dimGray2: '#999' },
    },
  },
}));

jest.mock('i18next', () => ({
  t: (key) => key,
}));

jest.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <div data-testid="typography" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@mui/material/TextareaAutosize', () => ({
  __esModule: true,
  default: ({ onChange, ...props }) => (
    <textarea data-testid="textarea" onChange={onChange} {...props} />
  ),
}));

jest.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('v2/apps/shared/components/confirm-modal/v2', () => ({
  __esModule: true,
  default: MockConfirmModal,
  Content: MockContentModal,
}));

describe('OrderLogModal', () => {
  const baseOpen = {
    id: 'modal-id',
    navTitle: 'nav-title',
    title: 'modal-title',
    cancel: 'cancel-label',
    confirm: 'confirm-label',
    description: 'modal-description',
  };
  const setOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    confirmModalMock.mockClear();
    contentModalMock.mockClear();
    setOpen.mockClear();
  });

  it('renders confirm modal with provided metadata and children', () => {
    render(
      <OrderLogModal open={baseOpen} setOpen={setOpen}>
        <span>child-content</span>
      </OrderLogModal>
    );

    const confirmModalProps = confirmModalMock.mock.calls[0][0];
    expect(confirmModalProps).toEqual(
      expect.objectContaining({
        openModal: true,
        id: 'modal-id',
      })
    );

    const contentModalProps =
      contentModalMock.mock.calls[contentModalMock.mock.calls.length - 1][0];
    expect(contentModalProps).toEqual(
      expect.objectContaining({
        navTitle: 'nav-title',
        title: 'modal-title',
        cancel: 'cancel-label',
        confirm: 'confirm-label',
        description: 'modal-description',
      })
    );
    expect(screen.getByText('child-content')).toBeInTheDocument();
  });

  it('closes modal and triggers callback when handleClose fires', () => {
    const callbackClose = jest.fn();
    render(
      <OrderLogModal
        open={{ ...baseOpen, callbackClose }}
        setOpen={setOpen}
      />
    );

    const { handleClose } = confirmModalMock.mock.calls[0][0];
    handleClose({}, undefined);

    expect(setOpen).toHaveBeenCalledWith(false);
    expect(callbackClose).toHaveBeenCalled();
  });

  it('prevents closing on backdrop click when flagged', () => {
    const callbackClose = jest.fn();
    render(
      <OrderLogModal
        open={{ ...baseOpen, backdropClick: true, callbackClose }}
        setOpen={setOpen}
      />
    );

    const { handleClose } = confirmModalMock.mock.calls[0][0];
    handleClose({}, 'backdropClick');

    expect(setOpen).not.toHaveBeenCalled();
    expect(callbackClose).not.toHaveBeenCalled();
  });

  it('disables accept when textarea is empty', () => {
    const handleAccept = jest.fn();
    render(
      <OrderLogModal
        open={{ ...baseOpen, textArea: true, handleAccept }}
        setOpen={setOpen}
      />
    );

    const contentModalProps = contentModalMock.mock.calls[0][0];
    expect(contentModalProps.disabled).toBe(true);
  });

  it('passes textarea value to accept handler after input', () => {
    const handleAccept = jest.fn();
    render(
      <OrderLogModal
        open={{ ...baseOpen, textArea: true, handleAccept }}
        setOpen={setOpen}
      />
    );

    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: 'Reason to republish' } });

    const contentModalProps =
      contentModalMock.mock.calls[contentModalMock.mock.calls.length - 1][0];
    expect(contentModalProps.disabled).toBe(false);

    contentModalProps.handleAccept();
    expect(handleAccept).toHaveBeenCalledWith('Reason to republish');
  });

  it('renders without crashing when closed', () => {
    render(<OrderLogModal open={false} setOpen={setOpen} />);
    const confirmModalProps = confirmModalMock.mock.calls[0][0];
    expect(confirmModalProps.openModal).toBe(false);
  });
});
