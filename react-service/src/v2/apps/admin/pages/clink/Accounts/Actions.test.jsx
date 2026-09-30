import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Actions from './Actions';

// Mock all the external dependencies
jest.mock('clink-components', () => ({
  Button: ({ children, handleClick, ...props }) => (
    <button 
      onClick={handleClick} 
      data-testid="mock-button"
      {...props}
    >
      {children}
    </button>
  ),
  Dropdown: ({ content, openButton, ...props }) => (
    <div data-testid="mock-dropdown" {...props}>
      <div data-testid="dropdown-trigger">{openButton}</div>
      <div data-testid="dropdown-content">{content}</div>
    </div>
  ),
}));

jest.mock('v2/apps/admin/ActionsDropdown', () => {
  return function MockActionsDropdown({ content }) {
    return (
      <div data-testid="mock-actions-dropdown">
        {content}
      </div>
    );
  };
});

jest.mock('v2/apps/shared/components/confirm-modal', () => {
  const React = require('react');
  return function MockConfirmModal({ 
    buttonLabel, 
    title, 
    subtitle, 
    handleConfirm, 
    customOpenElement,
    selected,
    data 
  }) {
    // If there's a custom element, clone it and add the click handler
    const triggerElement = customOpenElement ? 
      React.cloneElement(customOpenElement, {
        onClick: () => handleConfirm(data),
        'data-testid': 'confirm-modal-custom-trigger'
      }) : (
        React.createElement('button', {
          onClick: () => handleConfirm(data),
          'data-testid': 'confirm-modal-button',
          'data-selected': selected
        }, buttonLabel)
      );

    return React.createElement('div', { 'data-testid': 'mock-confirm-modal' },
      triggerElement,
      React.createElement('div', { 'data-testid': 'modal-title' }, title),
      React.createElement('div', { 'data-testid': 'modal-subtitle' }, subtitle)
    );
  };
});

jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn((type, path) => `/${type}/${path}`),
  goTo: jest.fn(),
}));

describe('Actions component', () => {
  const mockAccount = {
    id: '123',
    name: 'Test Account',
    subscription_id: '1',
  };

  const mockAccountsActions = [
    {
      id: 2,
      text: 'Enable/Disable',
      align: 'right',
    },
    {
      id: 3,
      text: 'view-account-details',
      align: 'right',
    },
    {
      id: 4,
      text: 'Change PQQ Exemption',
      align: 'right',
    },
    {
      id: 1,
      text: 'Change Subscription',
      align: 'right',
      children: true,
    },
  ];

  const mockSubscriptionsList = [
    {
      id: '1',
      label: 'Basic',
      interval_type: 'monthly',
    },
    {
      id: '2',
      label: 'Premium',
      interval_type: 'yearly',
    },
  ];

  const defaultProps = {
    account: mockAccount,
    accountsActions: mockAccountsActions,
    subscriptionsList: mockSubscriptionsList,
    changeSubscription: jest.fn(),
    toggleStatus: jest.fn(),
    updateFirstPQQSentProperty: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<Actions {...defaultProps} />);
    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
  });

  it('should render enable/disable action correctly', () => {
    const enableDisableAction = mockAccountsActions.find(action => action.id === 2);
    const props = {
      ...defaultProps,
      accountsActions: [enableDisableAction],
    };

    render(<Actions {...props} />);
    
    expect(screen.getByTestId('mock-confirm-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('enable-disable');
    expect(screen.getByTestId('modal-subtitle')).toHaveTextContent('are-you-sure');
  });

  it('should render view account details action correctly', () => {
    const viewDetailsAction = mockAccountsActions.find(action => action.id === 3);
    const props = {
      ...defaultProps,
      accountsActions: [viewDetailsAction],
    };

    render(<Actions {...props} />);

    expect(screen.getByTestId('clink-accounts-button-view-account')).toBeInTheDocument();
    expect(screen.getByTestId('clink-accounts-button-view-account')).toHaveTextContent('view-account-details');
  });

  it('should handle view account details click', () => {
    const { goTo, getUrl } = require('v2/helpers/url');
    const viewDetailsAction = mockAccountsActions.find(action => action.id === 3);
    const props = {
      ...defaultProps,
      accountsActions: [viewDetailsAction],
    };

    render(<Actions {...props} />);

    const button = screen.getByTestId('clink-accounts-button-view-account');
    fireEvent.click(button);

    expect(getUrl).toHaveBeenCalledWith('admin', 'accounts/123');
    expect(goTo).toHaveBeenCalled();
  });

  it('should render PQQ exemption action correctly', () => {
    const pqqAction = mockAccountsActions.find(action => action.id === 4);
    const props = {
      ...defaultProps,
      accountsActions: [pqqAction],
    };

    render(<Actions {...props} />);
    
    expect(screen.getByTestId('mock-confirm-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('changing-exemption-pqq');
    expect(screen.getByTestId('modal-subtitle')).toHaveTextContent('are-you-sure');
  });

  it('should render subscription dropdown when action has children', () => {
    const subscriptionAction = mockAccountsActions.find(action => action.id === 1);
    const props = {
      ...defaultProps,
      accountsActions: [subscriptionAction],
    };

    render(<Actions {...props} />);
    
    expect(screen.getByTestId('mock-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-trigger')).toHaveTextContent('Change Subscription');
    
    // Check that subscription options are rendered
    const confirmModals = screen.getAllByTestId('mock-confirm-modal');
    expect(confirmModals).toHaveLength(2); // One for each subscription
  });

  it('should mark current subscription as selected', () => {
    const subscriptionAction = mockAccountsActions.find(action => action.id === 1);
    const props = {
      ...defaultProps,
      accountsActions: [subscriptionAction],
    };

    render(<Actions {...props} />);
    
    const buttons = screen.getAllByTestId('confirm-modal-button');
    const basicButton = buttons.find(button => button.textContent.includes('Basic'));
    const premiumButton = buttons.find(button => button.textContent.includes('Premium'));

    expect(basicButton).toHaveAttribute('data-selected', 'true');
    expect(premiumButton).toHaveAttribute('data-selected', 'false');
  });

  it('should handle empty actions array', () => {
    const props = {
      ...defaultProps,
      accountsActions: [],
    };

    render(<Actions {...props} />);
    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
  });

  it('should handle empty subscriptions list', () => {
    const subscriptionAction = mockAccountsActions.find(action => action.id === 1);
    const props = {
      ...defaultProps,
      accountsActions: [subscriptionAction],
      subscriptionsList: [],
    };

    render(<Actions {...props} />);
    
    expect(screen.getByTestId('mock-dropdown')).toBeInTheDocument();
    // Should not crash when subscriptionsList is empty
  });

  it('should handle unknown action ids', () => {
    const unknownAction = {
      id: 999,
      text: 'Unknown Action',
      align: 'right',
    };
    const props = {
      ...defaultProps,
      accountsActions: [unknownAction],
    };

    render(<Actions {...props} />);
    
    // Should not render anything for unknown action IDs
    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
  });

  it('should trigger callbacks through ConfirmModal for enable/disable action', () => {
    const enableDisableAction = mockAccountsActions.find(action => action.id === 2);
    const props = {
      ...defaultProps,
      accountsActions: [enableDisableAction],
    };
    
    render(<Actions {...props} />);
    
    // The enable/disable action uses a custom trigger element
    const customTrigger = screen.getByTestId('confirm-modal-custom-trigger');
    fireEvent.click(customTrigger);
    
    expect(props.toggleStatus).toHaveBeenCalled();
  });

  it('should trigger callbacks through ConfirmModal for PQQ exemption action', () => {
    const pqqAction = mockAccountsActions.find(action => action.id === 4);
    const props = {
      ...defaultProps,
      accountsActions: [pqqAction],
    };
    
    render(<Actions {...props} />);
    
    const customTrigger = screen.getByTestId('confirm-modal-custom-trigger');
    fireEvent.click(customTrigger);
    
    expect(props.updateFirstPQQSentProperty).toHaveBeenCalled();
  });

  it('should trigger subscription change callback', () => {
    const subscriptionAction = mockAccountsActions.find(action => action.id === 1);
    const props = {
      ...defaultProps,
      accountsActions: [subscriptionAction],
    };
    
    render(<Actions {...props} />);
    
    const subscriptionButtons = screen.getAllByTestId('confirm-modal-button');
    expect(subscriptionButtons).toHaveLength(2);
    
    // Click the first subscription option
    fireEvent.click(subscriptionButtons[0]);
    expect(props.changeSubscription).toHaveBeenCalledWith(mockSubscriptionsList[0]);
  });
});