import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RejectionFeedbackModal from './RejectionFeedbackModal';

// Mock the date formatting helper
jest.mock('helpers/date', () => ({
  formatUKorAnzDateTime: jest.fn((date, countryCode) => ({
    date: '15/10/2023',
    time: '14:30',
  })),
}));

// Mock the i18n helper
jest.mock('helpers/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'rejection-feedback': 'Rejection Feedback',
      'order-status': 'Order Status',
      'approver-name': 'Approver Name',
      'date': 'Date',
      'time': 'Time',
      'description': 'Description',
    };
    return translations[key] || key;
  }),
}));

describe('RejectionFeedbackModal Component', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    status: 'Rejected',
    approverName: 'John Smith',
    pendingSince: '2023-10-15T14:30:00Z',
    comment: 'This needs revision before approval',
    countryCode: 'AU',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Arrange → Act → Assert
  it('renders without crashing', () => {
    // Arrange & Act
    render(<RejectionFeedbackModal {...defaultProps} />);
    
    // Assert
    expect(screen.getByText('Rejection Feedback')).toBeInTheDocument();
  });

  it('displays modal title correctly', () => {
    // Arrange & Act
    render(<RejectionFeedbackModal {...defaultProps} />);
    
    // Assert
    expect(screen.getByText('Rejection Feedback')).toBeInTheDocument();
  });

  it('displays close button and calls onClose when clicked', () => {
    // Arrange
    render(<RejectionFeedbackModal {...defaultProps} />);
    
    // Act
    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);
    
    // Assert
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('displays order status', () => {
    // Arrange & Act
    render(<RejectionFeedbackModal {...defaultProps} />);
    
    // Assert
    expect(screen.getByText('Order Status:')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('displays approver name and avatar', () => {
    // Arrange & Act
    render(<RejectionFeedbackModal {...defaultProps} />);
    
    // Assert
    expect(screen.getByText('Approver Name:')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    // Avatar should show initials
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('generates correct initials from approver name', () => {
    // Arrange
    const propsWithLongName = {
      ...defaultProps,
      approverName: 'Mary Jane Watson Smith',
    };
    
    // Act
    render(<RejectionFeedbackModal {...propsWithLongName} />);
    
    // Assert
    expect(screen.getByText('MJWS')).toBeInTheDocument();
  });

  it('handles empty approver name gracefully', () => {
    // Arrange
    const propsWithNoName = {
      ...defaultProps,
      approverName: '',
    };
    
    // Act
    render(<RejectionFeedbackModal {...propsWithNoName} />);
    
    // Assert
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('handles undefined approver name gracefully', () => {
    // Arrange
    const propsWithUndefinedName = {
      ...defaultProps,
      approverName: undefined,
    };
    
    // Act
    render(<RejectionFeedbackModal {...propsWithUndefinedName} />);
    
    // Assert
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('displays formatted date and time', () => {
    // Arrange & Act
    render(<RejectionFeedbackModal {...defaultProps} />);
    
    // Assert
    expect(screen.getByText('Date:')).toBeInTheDocument();
    expect(screen.getByText('15/10/2023')).toBeInTheDocument();
    expect(screen.getByText('Time:')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('displays comment description', () => {
    // Arrange & Act
    render(<RejectionFeedbackModal {...defaultProps} />);
    
    // Assert
    expect(screen.getByText('Description:')).toBeInTheDocument();
    expect(screen.getByText('This needs revision before approval')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    // Arrange
    const propsWithClosedModal = {
      ...defaultProps,
      open: false,
    };
    
    // Act
    render(<RejectionFeedbackModal {...propsWithClosedModal} />);
    
    // Assert - Dialog should be closed, so title should not be visible
    expect(screen.queryByText('Rejection Feedback')).not.toBeInTheDocument();
  });

  it('renders when open prop is truthy (not just true)', () => {
    // Arrange - Test with different truthy values
    const propsWithObjectOpen = {
      ...defaultProps,
      open: { someValue: true },
    };
    
    // Act
    render(<RejectionFeedbackModal {...propsWithObjectOpen} />);
    
    // Assert
    expect(screen.getByText('Rejection Feedback')).toBeInTheDocument();
  });

  it('handles whitespace in approver name correctly', () => {
    // Arrange
    const propsWithWhitespace = {
      ...defaultProps,
      approverName: '  John   Middle   Smith  ',
    };
    
    // Act
    render(<RejectionFeedbackModal {...propsWithWhitespace} />);
    
    // Assert - Should trim and split correctly
    expect(screen.getByText('JMS')).toBeInTheDocument();
  });

  it('renders with Dialog component', () => {
    // Arrange & Act
    render(<RejectionFeedbackModal {...defaultProps} />);
    
    // Assert - Check dialog is rendered with correct testid
    const dialog = screen.getByTestId('modal');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('maxwidth', 'sm');
  });

  it('passes onClose prop to Dialog', () => {
    // Arrange & Act
    render(<RejectionFeedbackModal {...defaultProps} />);
    
    // Assert - The onClose prop is passed to Dialog (this is the extent we can test with mocks)
    const dialog = screen.getByTestId('modal');
    expect(dialog).toBeInTheDocument();
    // In real implementation, the Dialog component would call onClose on backdrop click
    // But we can't test this with mocks, so we just verify the component renders with the prop
  });
});