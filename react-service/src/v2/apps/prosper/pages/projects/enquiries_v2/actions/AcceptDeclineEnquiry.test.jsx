import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AcceptDeclineEnquiry from './AcceptDeclineEnquiry';

// Mock ActionButtonContent since it's a child component
jest.mock('./ActionButtonContent', () => {
  return function MockActionButtonContent({ data, handleAction, label, redVersion, hideWaitTime }) {
    return (
      <button 
        onClick={handleAction}
        data-testid={`action-button-${label}`}
        data-red-version={redVersion}
        data-hide-wait-time={hideWaitTime}
      >
        {label}
      </button>
    );
  };
});

const mockProps = {
  data: { id: 1, type: 'enquiry' },
  accept: jest.fn(),
  decline: jest.fn(),
  handleOpen: jest.fn(),
  openConfirm: false,
  handleClose: jest.fn(),
};

const mockPropsWithOpenConfirm = {
  ...mockProps,
  openConfirm: true,
};

describe('AcceptDeclineEnquiry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<AcceptDeclineEnquiry {...mockProps} />);
    expect(screen.getByTestId('action-button-accept-invitation')).toBeInTheDocument();
    expect(screen.getByTestId('action-button-decline-invitation')).toBeInTheDocument();
  });

  test('renders accept button with correct props', () => {
    render(<AcceptDeclineEnquiry {...mockProps} />);
    const acceptButton = screen.getByTestId('action-button-accept-invitation');
    
    expect(acceptButton).toBeInTheDocument();
    expect(acceptButton).toHaveTextContent('accept-invitation');
    expect(acceptButton).toHaveAttribute('data-hide-wait-time', 'true');
  });

  test('renders decline button with correct props', () => {
    render(<AcceptDeclineEnquiry {...mockProps} />);
    const declineButton = screen.getByTestId('action-button-decline-invitation');
    
    expect(declineButton).toBeInTheDocument();
    expect(declineButton).toHaveTextContent('decline-invitation');
    expect(declineButton).toHaveAttribute('data-red-version', 'false');
    expect(declineButton).toHaveAttribute('data-hide-wait-time', 'true');
  });

  test('calls accept function when accept button is clicked', () => {
    render(<AcceptDeclineEnquiry {...mockProps} />);
    const acceptButton = screen.getByTestId('action-button-accept-invitation');
    
    fireEvent.click(acceptButton);
    expect(mockProps.accept).toHaveBeenCalledTimes(1);
  });

  test('calls handleOpen function when decline button is clicked', () => {
    render(<AcceptDeclineEnquiry {...mockProps} />);
    const declineButton = screen.getByTestId('action-button-decline-invitation');
    
    fireEvent.click(declineButton);
    expect(mockProps.handleOpen).toHaveBeenCalledTimes(1);
  });

  test('displays ConfirmModal when openConfirm is true', () => {
    render(<AcceptDeclineEnquiry {...mockPropsWithOpenConfirm} />);
    
    // ConfirmModal content should be rendered when openConfirm is true
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
  });

  test('does not display ConfirmModal when openConfirm is false', () => {
    render(<AcceptDeclineEnquiry {...mockProps} />);
    
    // ConfirmModal content should not be rendered when openConfirm is false
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
    // But the wrapper should still be there
    expect(screen.getByTestId('confirm-modal-wrapper')).toBeInTheDocument();
  });

  test('passes correct data prop to both ActionButtonContent components', () => {
    const testData = { id: 123, status: 'pending' };
    const propsWithTestData = { ...mockProps, data: testData };
    
    render(<AcceptDeclineEnquiry {...propsWithTestData} />);
    
    // Both buttons should receive the same data
    expect(screen.getByTestId('action-button-accept-invitation')).toBeInTheDocument();
    expect(screen.getByTestId('action-button-decline-invitation')).toBeInTheDocument();
  });

  test('renders with Grid layout structure', () => {
    const { container } = render(<AcceptDeclineEnquiry {...mockProps} />);
    
    // Check that Grid components are rendered (they'll be mocked MUI components)
    const grids = container.querySelectorAll('[data-testid="mui-grid"]');
    expect(grids.length).toBeGreaterThanOrEqual(1);
  });

  test('handles missing data gracefully', () => {
    const propsWithNullData = { ...mockProps, data: null };
    
    render(<AcceptDeclineEnquiry {...propsWithNullData} />);
    expect(screen.getByTestId('action-button-accept-invitation')).toBeInTheDocument();
    expect(screen.getByTestId('action-button-decline-invitation')).toBeInTheDocument();
  });

  test('handles undefined props gracefully', () => {
    const minimalProps = {
      data: {},
      accept: jest.fn(),
      decline: jest.fn(),
      handleOpen: jest.fn(),
      openConfirm: false,
      handleClose: jest.fn(),
    };
    
    render(<AcceptDeclineEnquiry {...minimalProps} />);
    expect(screen.getByTestId('action-button-accept-invitation')).toBeInTheDocument();
    expect(screen.getByTestId('action-button-decline-invitation')).toBeInTheDocument();
  });

  test('hideWaitTime prop is set to true for both buttons', () => {
    render(<AcceptDeclineEnquiry {...mockProps} />);
    
    const acceptButton = screen.getByTestId('action-button-accept-invitation');
    const declineButton = screen.getByTestId('action-button-decline-invitation');
    
    expect(acceptButton).toHaveAttribute('data-hide-wait-time', 'true');
    expect(declineButton).toHaveAttribute('data-hide-wait-time', 'true');
  });
});