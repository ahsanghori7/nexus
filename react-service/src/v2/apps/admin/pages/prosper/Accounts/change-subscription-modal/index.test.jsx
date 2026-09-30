import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChangeSubscriptionModal from 'v2/apps/admin/pages/prosper/Accounts/change-subscription-modal/index';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key) => `translated-${key}`),
  }),
}));

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `translated-${key}`),
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  Button: ({ children, layout, align }) => (
    <button data-testid="mock-button" data-layout={layout} data-align={align}>
      {children}
    </button>
  ),
  Modal: ({ openElement, className, render }) => (
    <div data-testid="mock-modal" className={className}>
      {openElement}
      {render && render({ handleClose: jest.fn() })}
    </div>
  ),
  ModalContent: ({ children }) => (
    <div data-testid="mock-modal-content">{children}</div>
  ),
}));

// Mock ConfirmModal
jest.mock('v2/apps/shared/components/confirm-modal', () => ({ 
  data, 
  selected, 
  buttonLabel, 
  title, 
  subtitle, 
  handleConfirm 
}) => (
  <div 
    data-testid="mock-confirm-modal"
    data-selected={selected}
    data-button-label={buttonLabel}
    data-title={title}
    data-subtitle={subtitle}
  >
    Confirm Modal for {data?.label}
  </div>
));

// Mock Regional and Flexi components
jest.mock('./Regional', () => ({ subscription, placeholder, options, modalProps, handleConfirm }) => (
  <div 
    data-testid="mock-regional"
    data-subscription-id={subscription?.id}
    data-placeholder={placeholder}
  >
    Regional Component
  </div>
));

jest.mock('./Flexi', () => ({ subscription, placeholder, modalProps, handleConfirm }) => (
  <div 
    data-testid="mock-flexi"
    data-subscription-id={subscription?.id}
    data-placeholder={placeholder}
  >
    Flexi Component
  </div>
));

// Mock styled components
jest.mock('./Mui.styled', () => ({
  MuiChangeSubscriptionsModal: ({ children }) => (
    <div data-testid="mui-change-subscriptions-modal">{children}</div>
  ),
  MuiTitleWrapper: ({ children }) => (
    <div data-testid="mui-title-wrapper">{children}</div>
  ),
  MuiTitle: ({ children }) => (
    <h1 data-testid="mui-title">{children}</h1>
  ),
  MuiSmall: ({ children }) => (
    <small data-testid="mui-small">{children}</small>
  ),
}));

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      users: (state = {}) => state,
      filters: (state = {}) => state,
    },
    preloadedState: initialState,
  });
};

describe('ChangeSubscriptionModal', () => {
  let store;

  const mockUser = {
    id: 1,
    subscription_id: 10,
  };

  const mockHandleConfirm = jest.fn();

  const baseProps = {
    user: mockUser,
    title: 'Change Subscription',
    buttonLabel: 'Change',
    handleConfirm: mockHandleConfirm,
    options: [{ id: 'option1', label: 'Option 1' }],
  };

  beforeEach(() => {
    store = createMockStore({
      users: {},
      filters: {},
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render Flexi component for flexi subscription', () => {
    const flexiSubscription = { id: 11, label: 'Flexi Plan' };

    render(
      <Provider store={store}>
        <ChangeSubscriptionModal {...baseProps} subscription={flexiSubscription} />
      </Provider>
    );

    expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    expect(screen.getByTestId('mock-flexi')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-regional')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-confirm-modal')).not.toBeInTheDocument();
  });

  it('should render Regional component for regional subscription', () => {
    const regionalSubscription = { id: 12, label: 'Regional Plan' };

    render(
      <Provider store={store}>
        <ChangeSubscriptionModal {...baseProps} subscription={regionalSubscription} />
      </Provider>
    );

    expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    expect(screen.getByTestId('mock-regional')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-flexi')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-confirm-modal')).not.toBeInTheDocument();
  });

  it('should render ConfirmModal for other subscription types', () => {
    const otherSubscription = { id: 13, label: 'Other Plan', interval_type: 'monthly' };

    render(
      <Provider store={store}>
        <ChangeSubscriptionModal {...baseProps} subscription={otherSubscription} />
      </Provider>
    );

    expect(screen.getByTestId('mock-confirm-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-flexi')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-regional')).not.toBeInTheDocument();
  });

  it('should render modal structure correctly for flexi subscription', () => {
    const flexiSubscription = { id: 11, label: 'Flexi Plan' };

    render(
      <Provider store={store}>
        <ChangeSubscriptionModal {...baseProps} subscription={flexiSubscription} />
      </Provider>
    );

    expect(screen.getByTestId('mui-change-subscriptions-modal')).toBeInTheDocument();
    expect(screen.getByTestId('mui-title-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('mui-title')).toHaveTextContent('Change Subscription');
    expect(screen.getByTestId('mui-small')).toHaveTextContent('translated-add-tokens');
  });

  it('should render modal structure correctly for regional subscription', () => {
    const regionalSubscription = { id: 12, label: 'Regional Plan' };

    render(
      <Provider store={store}>
        <ChangeSubscriptionModal {...baseProps} subscription={regionalSubscription} />
      </Provider>
    );

    expect(screen.getByTestId('mui-title')).toHaveTextContent('Change Subscription');
    expect(screen.getByTestId('mui-small')).toHaveTextContent('translated-select-region');
  });

  it('should render button with correct label', () => {
    const flexiSubscription = { id: 11, label: 'Flexi Plan' };

    render(
      <Provider store={store}>
        <ChangeSubscriptionModal {...baseProps} subscription={flexiSubscription} />
      </Provider>
    );

    const button = screen.getByTestId('mock-button');
    expect(button).toHaveTextContent('Change');
    expect(button).toHaveAttribute('data-layout', 'dropdown');
    expect(button).toHaveAttribute('data-align', 'right');
  });

  it('should handle subscription id as string', () => {
    const flexiSubscription = { id: '11', label: 'Flexi Plan' };

    render(
      <Provider store={store}>
        <ChangeSubscriptionModal {...baseProps} subscription={flexiSubscription} />
      </Provider>
    );

    expect(screen.getByTestId('mock-flexi')).toBeInTheDocument();
  });

  it('should handle default title and buttonLabel', () => {
    const flexiSubscription = { id: 11, label: 'Flexi Plan' };

    render(
      <Provider store={store}>
        <ChangeSubscriptionModal 
          subscription={flexiSubscription}
          user={mockUser}
          handleConfirm={mockHandleConfirm}
          options={[]}
        />
      </Provider>
    );

    expect(screen.getByTestId('mui-title')).toHaveTextContent('');
    expect(screen.getByTestId('mock-button')).toHaveTextContent('');
  });

  it('should pass correct props to Flexi component', () => {
    const flexiSubscription = { id: 11, label: 'Flexi Plan' };

    render(
      <Provider store={store}>
        <ChangeSubscriptionModal {...baseProps} subscription={flexiSubscription} />
      </Provider>
    );

    const flexiComponent = screen.getByTestId('mock-flexi');
    expect(flexiComponent).toHaveAttribute('data-subscription-id', '11');
    expect(flexiComponent).toHaveAttribute('data-placeholder', 'translated-add-tokens');
  });

  it('should pass correct props to Regional component', () => {
    const regionalSubscription = { id: 12, label: 'Regional Plan' };

    render(
      <Provider store={store}>
        <ChangeSubscriptionModal {...baseProps} subscription={regionalSubscription} />
      </Provider>
    );

    const regionalComponent = screen.getByTestId('mock-regional');
    expect(regionalComponent).toHaveAttribute('data-subscription-id', '12');
    expect(regionalComponent).toHaveAttribute('data-placeholder', 'translated-select-region');
  });

  it('should handle null options', () => {
    const regionalSubscription = { id: 12, label: 'Regional Plan' };

    render(
      <Provider store={store}>
        <ChangeSubscriptionModal 
          {...baseProps} 
          subscription={regionalSubscription} 
          options={null}
        />
      </Provider>
    );

    expect(screen.getByTestId('mock-regional')).toBeInTheDocument();
  });
});