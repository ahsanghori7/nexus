import React from 'react';
import { render, screen } from '@testing-library/react';
import Actions from 'v2/apps/admin/pages/prosper/Accounts/Actions';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key) => `translated-${key}`),
  }),
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  Dropdown: ({ children, openButton, align, isFixed }) => (
    <div 
      data-testid="mock-dropdown" 
      data-open-button={openButton}
      data-align={align}
      data-is-fixed={isFixed}
    >
      {children}
    </div>
  ),
}));

// Mock ActionsDropdown
jest.mock('v2/apps/admin/ActionsDropdown', () => ({ children, className, content }) => (
  <div data-testid="mock-actions-dropdown" className={className}>
    {Array.isArray(content) ? content.map((item, index) => <div key={index}>{item}</div>) : content}
    {children}
  </div>
));

// Mock ChangeSubscriptionModal
jest.mock('./change-subscription-modal', () => ({ 
  subscription, 
  user, 
  buttonLabel, 
  title, 
  handleConfirm, 
  options 
}) => (
  <div 
    data-testid="mock-change-subscription-modal"
    data-subscription-id={subscription?.id}
    data-user-id={user?.id}
    data-button-label={buttonLabel}
    data-title={title}
  >
    Change Subscription Modal
  </div>
));

describe('Actions', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
  };

  const mockAccountsActions = [
    {
      id: 1,
      text: 'Change Subscription',
      align: 'left',
      children: true,
    },
  ];

  const mockSubscriptionsList = [
    {
      id: 1,
      label: 'Premium',
      interval_type: 'monthly',
    },
    {
      id: 2,
      label: 'Basic',
      interval_type: 'yearly',
    },
  ];

  const mockRegionOptions = [
    { id: 1, label: 'US' },
    { id: 2, label: 'EU' },
  ];

  const mockHandleConfirm = jest.fn();

  const defaultProps = {
    user: mockUser,
    accountsActions: mockAccountsActions,
    subscriptionsList: mockSubscriptionsList,
    handleConfirm: mockHandleConfirm,
    regionOptions: mockRegionOptions,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<Actions {...defaultProps} />);

    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
  });

  it('should render with correct className', () => {
    render(<Actions {...defaultProps} />);

    expect(screen.getByTestId('mock-actions-dropdown')).toHaveClass('prosper-accounts-actions');
  });

  it('should render dropdown when actions have children', () => {
    render(<Actions {...defaultProps} />);

    expect(screen.getByTestId('mock-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dropdown')).toHaveAttribute('data-open-button', 'Change Subscription');
    expect(screen.getByTestId('mock-dropdown')).toHaveAttribute('data-align', 'left');
    expect(screen.getByTestId('mock-dropdown')).toHaveAttribute('data-is-fixed', 'false');
  });

  it('should render dropdown structure correctly', () => {
    render(<Actions {...defaultProps} />);

    expect(screen.getByTestId('mock-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dropdown')).toHaveAttribute('data-open-button', 'Change Subscription');
    expect(screen.getByTestId('mock-dropdown')).toHaveAttribute('data-align', 'left');
    expect(screen.getByTestId('mock-dropdown')).toHaveAttribute('data-is-fixed', 'false');
  });

  it('should handle empty accountsActions array', () => {
    render(<Actions {...defaultProps} accountsActions={[]} />);

    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-dropdown')).not.toBeInTheDocument();
  });

  it('should handle null accountsActions', () => {
    render(<Actions {...defaultProps} accountsActions={null} />);

    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-dropdown')).not.toBeInTheDocument();
  });

  it('should handle empty subscriptionsList array', () => {
    render(<Actions {...defaultProps} subscriptionsList={[]} />);

    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dropdown')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-change-subscription-modal')).not.toBeInTheDocument();
  });

  it('should handle null subscriptionsList', () => {
    render(<Actions {...defaultProps} subscriptionsList={null} />);

    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dropdown')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-change-subscription-modal')).not.toBeInTheDocument();
  });

  it('should not render dropdown when action has no children', () => {
    const actionsWithoutChildren = [
      {
        id: 1,
        text: 'Simple Action',
        align: 'left',
        children: false,
      },
    ];

    render(<Actions {...defaultProps} accountsActions={actionsWithoutChildren} />);

    expect(screen.getByTestId('mock-actions-dropdown')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-dropdown')).not.toBeInTheDocument();
  });
});