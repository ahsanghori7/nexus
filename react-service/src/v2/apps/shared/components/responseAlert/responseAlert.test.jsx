import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import responseAlert from './index'; // Adjust the import based on your file structure

// Mock i18next translation function
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn().mockReturnValue('Test message'),
}));

describe('responseAlert Component', () => {
  let setOpenMock;

  beforeEach(() => {
    setOpenMock = jest.fn();
  });

  test('should render alert with default message', () => {
    render(
      responseAlert({
        open: true,
        handleClose: jest.fn(),
        setOpen: setOpenMock,
      })
    );

    // Check if the alert message is rendered correctly
    expect(screen.getByText('Test message')).not.toBeNull();
  });

  test('should render alert with custom message', () => {
    render(
      responseAlert({
        open: true,
        handleClose: jest.fn(),
        setOpen: setOpenMock,
        message: 'Custom alert message',
      })
    );

    // Check if the custom message is rendered
    expect(screen.getByText('Custom alert message')).not.toBeNull();
  });

  test('should render alert with success severity', () => {
    render(
      responseAlert({
        open: true,
        handleClose: jest.fn(),
        setOpen: setOpenMock,
        severity: 'success',
      })
    );

    // Check if the alert has the 'success' severity
    const alert = screen.getByRole('alert');
    expect(alert.classList.contains('MuiAlert-filledSuccess')).toBe(true);
  });

  test('should render alert with error severity', () => {
    render(
      responseAlert({
        open: true,
        handleClose: jest.fn(),
        setOpen: setOpenMock,
        severity: 'error',
      })
    );

    // Check if the alert has the 'error' severity
    const alert = screen.getByRole('alert');
    expect(alert.classList.contains('MuiAlert-filledError')).toBe(true);
  });

  test('should close alert when close button is clicked', async () => {
    render(
      responseAlert({
        open: true,
        handleClose: jest.fn(),
        setOpen: setOpenMock,
      })
    );

    // Click on the close button
    fireEvent.click(screen.getByLabelText('close'));

    // Wait for the setOpen function to be called
    await waitFor(() => {
      expect(setOpenMock).toHaveBeenCalledWith(false);
    });
  });

  test('should auto-hide after the given duration', async () => {
    jest.useFakeTimers(); // Mock setTimeout

    const handleCloseMock = jest.fn();
    render(
      responseAlert({
        open: true,
        handleClose: handleCloseMock,
        setOpen: setOpenMock,
      })
    );

    // Fast forward the time by 3000ms (autoHideDuration)
    jest.advanceTimersByTime(3000);

    // Verify that the handleClose function is called after the timeout
    await waitFor(() => {
      expect(handleCloseMock).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers(); // Clean up the fake timers
  });
});
