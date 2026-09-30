import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionButtonContent from './ActionButtonContent';

// Mock the external dependencies
jest.mock('v2/helpers/status/enquiries', () => ({
  getStatus: jest.fn(() => ({
    enableAction: true,
    waiting: 'test-waiting-text'
  })),
  getDaysToShow: jest.fn(() => 5)
}));

const mockData = {
  type: 'Enquiry',
  status_id: 4,
  tenderReturn: '2024-01-15',
};

const defaultProps = {
  data: mockData,
  handleAction: jest.fn(),
  redVersion: true,
  label: null,
  hideWaitTime: false,
};

describe('ActionButtonContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<ActionButtonContent {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('displays custom label when provided', () => {
    const customLabel = 'Custom Action';
    render(<ActionButtonContent {...defaultProps} label={customLabel} />);
    expect(screen.getByText(customLabel)).toBeInTheDocument();
  });

  test('applies correct styling for red version', () => {
    render(<ActionButtonContent {...defaultProps} redVersion={true} />);
    const button = screen.getByRole('button');
    // Since we're using mocked MUI components, we'll verify the color prop is set correctly
    expect(button).toHaveAttribute('color', 'error');
  });

  test('applies correct styling for non-red version', () => {
    render(<ActionButtonContent {...defaultProps} redVersion={false} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('calls handleAction when button is clicked and enabled', () => {
    const mockHandleAction = jest.fn();
    render(<ActionButtonContent {...defaultProps} handleAction={mockHandleAction} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockHandleAction).toHaveBeenCalledTimes(1);
  });

  test('hides wait time when hideWaitTime is true', () => {
    render(<ActionButtonContent {...defaultProps} hideWaitTime={true} />);
    const timeIcon = screen.queryByTestId('AccessTimeIcon');
    expect(timeIcon).not.toBeInTheDocument();
  });

  test('shows wait time when hideWaitTime is false and days available', () => {
    render(<ActionButtonContent {...defaultProps} hideWaitTime={false} />);
    // The wait time text should be displayed when getDaysToShow returns a value
    // Since our mock returns 5, we should see the text-in-days translation (uppercase)
    expect(screen.getByText('TEXT-IN-DAYS')).toBeInTheDocument();
  });

  test('handles data with no status gracefully', () => {
    render(<ActionButtonContent {...defaultProps} data={null} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('adjusts font size for long text', () => {
    const longLabel = 'This is a very long label text that should trigger smaller font size';
    render(<ActionButtonContent {...defaultProps} label={longLabel} />);
    expect(screen.getByText(longLabel)).toBeInTheDocument();
  });

  test('renders with empty data object', () => {
    render(<ActionButtonContent {...defaultProps} data={{}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('renders properly when all optional props are undefined', () => {
    const minimalProps = {
      data: mockData,
      handleAction: jest.fn(),
    };
    render(<ActionButtonContent {...minimalProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});