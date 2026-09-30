import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Actions from './Actions';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
}));

describe('Actions Component', () => {
  const mockUser = {
    id: 1,
    account_id: 123,
    subscription_id: 1,
    company: 'Test Company'
  };

  const mockContractorsActions = [
    {
      id: 1,
      text: 'Change Subscription',
      align: 'left',
      children: true
    },
    {
      id: 2,
      text: 'Other Action',
      align: 'right',
      children: true
    }
  ];

  const mockSubscriptionsList = [
    {
      id: 1,
      label: 'Basic Plan',
      interval_type: 'monthly'
    },
    {
      id: 2,
      label: 'Premium Plan',
      interval_type: 'annual'
    }
  ];

  const mockHandleConfirm = jest.fn();

  const defaultProps = {
    user: mockUser,
    contractorsActions: mockContractorsActions,
    subscriptionsList: mockSubscriptionsList,
    handleConfirm: mockHandleConfirm
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Actions {...defaultProps} />);
    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
  });

  it('does not render when contractorsActions has less than 2 items', () => {
    const propsWithSingleAction = {
      ...defaultProps,
      contractorsActions: [mockContractorsActions[0]]
    };

    const { container } = render(<Actions {...propsWithSingleAction} />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when contractorsActions is empty', () => {
    const propsWithEmptyActions = {
      ...defaultProps,
      contractorsActions: []
    };

    const { container } = render(<Actions {...propsWithEmptyActions} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders confirm modal buttons for each subscription in each action dropdown', () => {
    render(<Actions {...defaultProps} />);
    
    // First open the dropdown to access the content
    const dropdowns = screen.getAllByTestId('dropdown');
    expect(dropdowns).toHaveLength(2);
    
    // For each dropdown, we need to open it to see the confirm modal buttons
    // Click on the action dropdown buttons to open them
    const openButtons = screen.getAllByTestId('open-dropdown');
    fireEvent.click(openButtons[0]);
    fireEvent.click(openButtons[1]);
    
    // Should render confirm modal buttons for each subscription × number of actions
    // 2 contractor actions × 2 subscriptions = 4 confirm modal buttons
    const confirmButtons = screen.getAllByTestId('confirm-modal');
    expect(confirmButtons).toHaveLength(4);
  });

  it('calls handleConfirm when a subscription is selected', () => {
    render(<Actions {...defaultProps} />);
    
    // Open the dropdowns first
    const openButtons = screen.getAllByTestId('open-dropdown');
    fireEvent.click(openButtons[0]);
    fireEvent.click(openButtons[1]);
    
    const confirmButtons = screen.getAllByTestId('confirm-modal');
    fireEvent.click(confirmButtons[0]);
    
    expect(mockHandleConfirm).toHaveBeenCalledWith(mockSubscriptionsList[0]);
  });

  it('marks the current subscription as selected', () => {
    render(<Actions {...defaultProps} />);
    
    // Open the dropdowns first
    const openButtons = screen.getAllByTestId('open-dropdown');
    fireEvent.click(openButtons[0]);
    fireEvent.click(openButtons[1]);
    
    const confirmButtons = screen.getAllByTestId('confirm-modal');
    // First subscription should be selected (user.subscription_id === 1)
    expect(confirmButtons[0]).toHaveClass('selected');
    expect(confirmButtons[1]).not.toHaveClass('selected');
  });

  it('displays subscription label and interval type in button text', () => {
    render(<Actions {...defaultProps} />);
    
    // Open the dropdowns first
    const openButtons = screen.getAllByTestId('open-dropdown');
    fireEvent.click(openButtons[0]);
    fireEvent.click(openButtons[1]);
    
    const confirmButtons = screen.getAllByTestId('confirm-modal');
    expect(confirmButtons[0]).toHaveTextContent('Basic Plan / monthly');
    expect(confirmButtons[1]).toHaveTextContent('Premium Plan / annual');
  });

  it('handles empty subscriptionsList gracefully', () => {
    const propsWithEmptySubscriptions = {
      ...defaultProps,
      subscriptionsList: []
    };

    render(<Actions {...propsWithEmptySubscriptions} />);
    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
    
    // Should not find any confirm modal buttons
    const confirmButtons = screen.queryAllByTestId('confirm-modal');
    expect(confirmButtons).toHaveLength(0);
  });

  it('handles null subscriptionsList gracefully', () => {
    const propsWithNullSubscriptions = {
      ...defaultProps,
      subscriptionsList: null
    };

    render(<Actions {...propsWithNullSubscriptions} />);
    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
  });

  it('handles missing handleConfirm prop gracefully', () => {
    const propsWithoutHandleConfirm = {
      ...defaultProps,
      handleConfirm: undefined
    };

    render(<Actions {...propsWithoutHandleConfirm} />);
    
    // Open the dropdowns first
    const openButtons = screen.getAllByTestId('open-dropdown');
    fireEvent.click(openButtons[0]);
    fireEvent.click(openButtons[1]);
    
    const confirmButtons = screen.getAllByTestId('confirm-modal');
    
    // Should not throw error when clicking without handleConfirm
    expect(() => {
      fireEvent.click(confirmButtons[0]);
    }).not.toThrow();
  });
});