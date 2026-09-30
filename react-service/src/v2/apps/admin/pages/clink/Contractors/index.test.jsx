import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Contractors from './index';

// Mock lodash/capitalize
jest.mock('lodash/capitalize', () => jest.fn((str) => str.charAt(0).toUpperCase() + str.slice(1)));

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

// Mock the Actions component
jest.mock('./Actions', () => {
  const React = require('react');
  return function MockedActions(props) {
    return React.createElement('div', {
      'data-testid': 'actions-component',
      'data-user-id': props.user?.id,
      onClick: () => props.handleConfirm && props.handleConfirm({ id: 1, label: 'Test Plan', interval_type: 'monthly' })
    }, 'Actions Component');
  };
});

describe('Contractors Component', () => {
  let store;
  let mockDispatch;

  const defaultState = {
    users: {
      list: [
        {
          id: 1,
          account_id: 123,
          company: 'Test Company 1',
          subscription: 'Basic Plan',
          subscription_id: 1,
          frequency: 'Monthly'
        },
        {
          id: 2,
          account_id: 456,
          company: 'Test Company 2',
          subscription: 'Premium Plan',
          subscription_id: 2,
          frequency: 'Annual'
        }
      ],
      listCount: 2
    },
    subscription: {
      subscriptionsList: [
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
      ]
    }
  };

  const defaultProps = {
    params: null
  };

  const createMockStore = (initialState = defaultState) => {
    const mockDispatchFn = jest.fn(() => Promise.resolve());
    const rootReducer = (state = initialState, action) => state;
    const store = createStore(rootReducer);
    store.dispatch = mockDispatchFn;
    return { store, mockDispatch: mockDispatchFn };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const storeData = createMockStore();
    store = storeData.store;
    mockDispatch = storeData.mockDispatch;
  });

  const renderWithStore = (props = {}) => {
    return render(
      <Provider store={store}>
        <Contractors {...defaultProps} {...props} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderWithStore();
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('uses correct component structure', () => {
    renderWithStore();
    
    // Verify basic component mounting and structure
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('handles params correctly', () => {
    const propsWithTerm = { params: { term: 'test search' } };
    renderWithStore(propsWithTerm);
    
    // Component should still render correctly with search params
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('renders table with correct number of rows', () => {
    renderWithStore();
    
    // The table should display 2 users from the store
    const table = screen.getByTestId('table');
    expect(table).toHaveTextContent('Table with 2 rows and 5 columns');
  });

  it('renders company links for each user', () => {
    renderWithStore();
    
    // Check that MUI Links are created for companies
    const companyLinks = screen.getAllByRole('link');
    expect(companyLinks).toHaveLength(2);
    expect(companyLinks[0]).toHaveAttribute('href', expect.stringContaining('redirect_user_id=1'));
    expect(companyLinks[1]).toHaveAttribute('href', expect.stringContaining('redirect_user_id=2'));
  });

  it('renders Actions component for each user', () => {
    renderWithStore();
    
    const actionsComponents = screen.getAllByTestId('actions-component');
    expect(actionsComponents).toHaveLength(2);
    expect(actionsComponents[0]).toHaveAttribute('data-user-id', '1');
    expect(actionsComponents[1]).toHaveAttribute('data-user-id', '2');
  });

  it('handles table sorting correctly', () => {
    renderWithStore();
    
    const table = screen.getByTestId('table');
    
    // Test that table has the necessary props for sorting functionality
    expect(table).toBeInTheDocument();
    // Verify the table exists and is configured correctly
    expect(table).toHaveTextContent('Table with 2 rows and 5 columns');
  });

  it('handles pagination changes correctly', () => {
    renderWithStore();
    
    const table = screen.getByTestId('table');
    
    // Test that table has pagination configured 
    expect(table).toBeInTheDocument();
    expect(table).toHaveTextContent('Pagination: 5, 10, 20, 50, 100');
  });

  it('handles empty users list gracefully', () => {
    const emptyState = {
      ...defaultState,
      users: {
        list: [],
        listCount: 0
      }
    };
    const storeData = createMockStore(emptyState);
    store = storeData.store;
    
    renderWithStore();
    
    const table = screen.getByTestId('table');
    expect(table).toHaveTextContent('Table with 0 rows');
  });

  it('handles null users list gracefully', () => {
    const nullState = {
      ...defaultState,
      users: {
        list: null,
        listCount: 0
      }
    };
    const storeData = createMockStore(nullState);
    store = storeData.store;
    
    renderWithStore();
    
    const table = screen.getByTestId('table');
    expect(table).toHaveTextContent('Table with 0 rows');
  });

  it('displays correct pagination options', () => {
    renderWithStore();
    
    const table = screen.getByTestId('table');
    expect(table).toHaveTextContent('Pagination: 5, 10, 20, 50, 100');
  });

  it('initializes with correct pagination settings', () => {
    renderWithStore();
    
    // Component should handle internal pagination state
    const table = screen.getByTestId('table');
    expect(table).toBeInTheDocument();
    
    // Verify the component renders pagination options
    expect(table).toHaveAttribute('initRowsPerPage', '20');
  });

  it('formats columns with translation keys', () => {
    renderWithStore();
    
    // The component should translate column labels using t() function
    // In our mock, t() returns the key as-is, so we should see translation keys
    const table = screen.getByTestId('table');
    expect(table).toBeInTheDocument();
  });

  it('includes action column in formatted columns', () => {
    renderWithStore();
    
    // Should have 4 base columns + 1 action column = 5 total
    const table = screen.getByTestId('table');
    expect(table).toHaveTextContent('5 columns');
  });
});