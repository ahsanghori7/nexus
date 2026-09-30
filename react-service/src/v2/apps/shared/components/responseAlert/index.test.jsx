import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResponseAlert from './index.jsx';

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

jest.mock('@mui/material/Stack', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="response-stack">{children}</div>,
}));

jest.mock('@mui/material/Snackbar', () => ({
  __esModule: true,
  default: ({ children, onClose, open }) => (
    <div data-testid="response-snackbar" data-open={open}>
      <button type="button" onClick={() => onClose?.({}, 'timeout')}>
        trigger-close
      </button>
      {children}
    </div>
  ),
}));

jest.mock('@mui/material/Alert', () => ({
  __esModule: true,
  default: ({ children, onClose, action, severity }) => (
    <div data-testid="response-alert" data-severity={severity}>
      <button type="button" onClick={onClose}>
        alert-close
      </button>
      {action}
      <span>{children}</span>
    </div>
  ),
}));

jest.mock('@mui/material/IconButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@mui/icons-material/Close', () => ({
  __esModule: true,
  default: () => <span>close-icon</span>,
}));

describe('ResponseAlert', () => {
  it('renders with the default success message', () => {
    render(<ResponseAlert open handleClose={jest.fn()} setOpen={jest.fn()} />);

    expect(screen.getByTestId('response-stack')).toBeInTheDocument();
    expect(screen.getByTestId('response-snackbar')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('response-alert')).toHaveAttribute('data-severity', 'success');
    expect(screen.getByText('suggestion-created')).toBeInTheDocument();
  });

  it('displays custom content and handles close interactions', async () => {
    const handleClose = jest.fn();
    const setOpen = jest.fn();
    const user = userEvent.setup();

    render(
      <ResponseAlert
        open
        handleClose={handleClose}
        setOpen={setOpen}
        severity="error"
        message="Custom message"
      />,
    );

    expect(screen.getByTestId('response-alert')).toHaveAttribute('data-severity', 'error');
    expect(screen.getByText('Custom message')).toBeInTheDocument();

    await user.click(screen.getByText('trigger-close'));
    expect(handleClose).toHaveBeenCalledWith({}, 'timeout');

    await user.click(screen.getByRole('button', { name: 'close' }));
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});
