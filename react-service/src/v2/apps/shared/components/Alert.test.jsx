import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertPopup from './Alert';

// Mock MUI components
jest.mock('@mui/material/Snackbar', () => {
  return function MockSnackbar({ children, open, autoHideDuration, onClose }) {
    return open ? (
      <div data-testid="snackbar" data-auto-hide={autoHideDuration}>
        {children}
        <button data-testid="close-button" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null;
  };
});

jest.mock('@mui/material/Alert', () => {
  return function MockAlert({ children, severity, variant, sx }) {
    return (
      <div
        data-testid="alert"
        data-severity={severity}
        data-variant={variant}
        style={sx}
      >
        {children}
      </div>
    );
  };
});

describe('AlertPopup Component', () => {
  const defaultProps = {
    status: 'success',
    message: 'Test message',
    open: true,
    handleClose: jest.fn(),
    autoHideDuration: 3000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing when all props are provided', () => {
    render(<AlertPopup {...defaultProps} />);
    
    const alert = screen.getByTestId('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Test message');
    expect(alert).toHaveAttribute('data-severity', 'success');
  });

  test('does not render when status is empty', () => {
    render(<AlertPopup {...defaultProps} status="" />);
    
    const snackbar = screen.queryByTestId('snackbar');
    expect(snackbar).not.toBeInTheDocument();
  });

  test('does not render when message is null', () => {
    render(<AlertPopup {...defaultProps} message={null} />);
    
    const snackbar = screen.queryByTestId('snackbar');
    expect(snackbar).not.toBeInTheDocument();
  });

  test('does not render when message is empty string', () => {
    render(<AlertPopup {...defaultProps} message="" />);
    
    const snackbar = screen.queryByTestId('snackbar');
    expect(snackbar).not.toBeInTheDocument();
  });

  test('does not render when open is false', () => {
    render(<AlertPopup {...defaultProps} open={false} />);
    
    const snackbar = screen.queryByTestId('snackbar');
    expect(snackbar).not.toBeInTheDocument();
  });

  test('calls handleClose when close button is clicked', () => {
    const mockHandleClose = jest.fn();
    render(<AlertPopup {...defaultProps} handleClose={mockHandleClose} />);
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(mockHandleClose).toHaveBeenCalledTimes(1);
  });

  test('renders with custom autoHideDuration', () => {
    const customDuration = 5000;
    render(<AlertPopup {...defaultProps} autoHideDuration={customDuration} />);
    
    const snackbar = screen.getByTestId('snackbar');
    expect(snackbar).toHaveAttribute('data-auto-hide', customDuration.toString());
  });

  test('renders with different severity levels', () => {
    const severities = ['success', 'error', 'warning', 'info'];
    
    severities.forEach(severity => {
      const { unmount } = render(
        <AlertPopup {...defaultProps} status={severity} />
      );
      
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('data-severity', severity);
      
      unmount();
    });
  });

  test('renders with filled variant', () => {
    render(<AlertPopup {...defaultProps} />);
    
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveAttribute('data-variant', 'filled');
  });

  test('renders with correct width style', () => {
    render(<AlertPopup {...defaultProps} />);
    
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveStyle({ width: '100%' });
  });

  test('renders correctly with all default props', () => {
    render(
      <AlertPopup
        status="info"
        message="Default test"
        open={true}
        handleClose={jest.fn()}
      />
    );
    
    const snackbar = screen.getByTestId('snackbar');
    const alert = screen.getByTestId('alert');
    
    expect(snackbar).toBeInTheDocument();
    expect(snackbar).toHaveAttribute('data-auto-hide', '3000'); // default value
    expect(alert).toHaveTextContent('Default test');
    expect(alert).toHaveAttribute('data-severity', 'info');
  });

  test('does not render when both status and message are falsy', () => {
    render(<AlertPopup status="" message="" open={true} />);
    
    const snackbar = screen.queryByTestId('snackbar');
    expect(snackbar).not.toBeInTheDocument();
  });

  test('does not render when status is truthy but message is falsy', () => {
    render(<AlertPopup status="success" message="" open={true} />);
    
    const snackbar = screen.queryByTestId('snackbar');
    expect(snackbar).not.toBeInTheDocument();
  });

  test('does not render when status is falsy but message is truthy', () => {
    render(<AlertPopup status="" message="Test message" open={true} />);
    
    const snackbar = screen.queryByTestId('snackbar');
    expect(snackbar).not.toBeInTheDocument();
  });

  test('renders when both status and message are truthy but open is false', () => {
    render(<AlertPopup status="success" message="Test message" open={false} />);
    
    // The component structure should still be returned, but Snackbar won't show
    const snackbar = screen.queryByTestId('snackbar');
    expect(snackbar).not.toBeInTheDocument();
  });

  test('renders with default values for optional props', () => {
    render(
      <AlertPopup status="warning" message="Warning message" />
    );
    
    // Component should render with defaults: open=false, so no snackbar visible
    const snackbar = screen.queryByTestId('snackbar');
    expect(snackbar).not.toBeInTheDocument();
  });

  test('returns empty render when conditions are not met', () => {
    const { container } = render(<AlertPopup />);
    
    // When no status or message provided, component should not render any snackbar
    const snackbar = screen.queryByTestId('snackbar');
    expect(snackbar).not.toBeInTheDocument();
  });

  test('uses default handleClose function when none provided', () => {
    // Test the default handleClose function (no-op)
    render(<AlertPopup status="info" message="Test" open={true} />);
    
    const closeButton = screen.getByTestId('close-button');
    
    // This should not throw an error when clicked, testing the default no-op function
    expect(() => fireEvent.click(closeButton)).not.toThrow();
  });
});