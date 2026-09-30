import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DateRange from './DateRange';

// Mock the clink-components InputCalendar
jest.mock('clink-components', () => ({
  InputCalendar: ({ label, value, controlledOnChange, ...props }) => (
    <div data-testid={`input-calendar-${label.toLowerCase()}`}>
      <label>{label}</label>
      <input
        value={value ? value.toISOString().split('T')[0] : ''}
        onChange={(e) => controlledOnChange && controlledOnChange(new Date(e.target.value))}
        data-testid={`date-input-${label.toLowerCase()}`}
        {...props}
      />
    </div>
  ),
}));

// Mock the styled components
jest.mock('./Mui.styled', () => ({
  MuiDateRangeContainer: ({ children }) => (
    <div data-testid="date-range-container">{children}</div>
  ),
  MuiCalendarContainer: ({ children }) => (
    <div data-testid="calendar-container">{children}</div>
  ),
}));

describe('DateRange', () => {
  const mockHandleStart = jest.fn();
  const mockHandleEnd = jest.fn();
  const startDate = new Date('2023-10-01');
  const endDate = new Date('2023-10-15');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    start: startDate,
    end: endDate,
    handleStart: mockHandleStart,
    handleEnd: mockHandleEnd,
  };

  it('should render without crashing', () => {
    render(<DateRange {...defaultProps} />);
    
    expect(screen.getByTestId('date-range-container')).toBeInTheDocument();
  });

  it('should render both calendar containers', () => {
    render(<DateRange {...defaultProps} />);
    
    const calendarContainers = screen.getAllByTestId('calendar-container');
    expect(calendarContainers).toHaveLength(2);
  });

  it('should render From and To input calendars', () => {
    render(<DateRange {...defaultProps} />);
    
    expect(screen.getByTestId('input-calendar-from')).toBeInTheDocument();
    expect(screen.getByTestId('input-calendar-to')).toBeInTheDocument();
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
  });

  it('should display correct dates in inputs', () => {
    render(<DateRange {...defaultProps} />);

    const fromInput = screen.getByTestId('daterange-input-from');
    const toInput = screen.getByTestId('daterange-input-to');
    
    expect(fromInput).toHaveValue('2023-10-01');
    expect(toInput).toHaveValue('2023-10-15');
  });

  it('should call handleStart when from date changes', () => {
    render(<DateRange {...defaultProps} />);
    
    const fromInput = screen.getByTestId('daterange-input-from');
    fireEvent.change(fromInput, { target: { value: '2023-09-15' } });
    
    expect(mockHandleStart).toHaveBeenCalledTimes(1);
    expect(mockHandleStart).toHaveBeenCalledWith(new Date('2023-09-15'));
  });

  it('should call handleEnd when to date changes', () => {
    render(<DateRange {...defaultProps} />);
    
    const toInput = screen.getByTestId('daterange-input-to');
    fireEvent.change(toInput, { target: { value: '2023-10-20' } });
    
    expect(mockHandleEnd).toHaveBeenCalledTimes(1);
    expect(mockHandleEnd).toHaveBeenCalledWith(new Date('2023-10-20'));
  });

  it('should handle null dates gracefully', () => {
    render(<DateRange {...defaultProps} start={null} end={null} />);

    const fromInput = screen.getByTestId('daterange-input-from');
    const toInput = screen.getByTestId('daterange-input-to');
    
    expect(fromInput).toHaveValue('');
    expect(toInput).toHaveValue('');
  });

  it('should match snapshot', () => {
    const { container } = render(<DateRange {...defaultProps} />);
    
    expect(container.firstChild).toMatchSnapshot();
  });
});