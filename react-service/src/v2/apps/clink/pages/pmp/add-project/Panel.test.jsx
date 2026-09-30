import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Panel from './Panel';

// Mock the AddIcon SVG component
jest.mock('v1/global/public/images/svg/add.svg', () => () => (
  <div data-testid="add-icon">Add Icon</div>
));

describe('Panel Component', () => {
  const mockHandleClick = jest.fn();

  beforeEach(() => {
    mockHandleClick.mockClear();
  });

  test('renders correctly with all elements', () => {
    render(<Panel handleClick={mockHandleClick} />);

    // Check if the add icon is rendered
    expect(screen.getByTestId('add-icon')).toBeInTheDocument();

    // Check if the text is rendered
    expect(screen.getByText('Add new project')).toBeInTheDocument();
  });

  test('calls handleClick when clicked', () => {
    const { container } = render(<Panel handleClick={mockHandleClick} />);

    // Use container.firstChild to get the root element
    const panel = container.firstChild;

    // Click on the panel
    fireEvent.click(panel);

    // Verify that handleClick was called
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  test('has correct initial styling', () => {
    const { container } = render(<Panel handleClick={mockHandleClick} />);

    // Use container.firstChild to get the root element
    const panel = container.firstChild;

    // Check for basic element properties instead of CSS
    expect(panel).toBeTruthy();
    expect(panel.tagName).toBe('DIV');
    expect(panel).toHaveClass('MuiGrid-root'); // Material UI Grid classes
  });

  test('propTypes validation throws error when required props are missing', () => {
    // Save original console.error
    const originalConsoleError = console.error;

    // Create a mock function for console.error
    console.error = jest.fn();

    // Render without required props
    render(<Panel />);

    // Check if PropTypes warning was logged
    expect(console.error).toHaveBeenCalled();

    // Check if the error messages contain references to the missing prop
    const errorCalls = console.error.mock.calls;
    expect(errorCalls.length).toBeGreaterThan(0);

    // Check if any of the arguments in any call reference handleClick
    const containsHandleClickReference = errorCalls.some((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('handleClick'))
    );

    expect(containsHandleClickReference).toBe(true);

    // Restore original console.error
    console.error = originalConsoleError;
  });
});
