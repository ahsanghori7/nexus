import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import Accounts from 'v2/apps/admin/pages/prosper/Accounts/index';

// Setup global BASE_URLS
global.BASE_URLS = {
  ADMIN_PROSPER: '/admin/prosper',
};

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

// Create a variable outside the mock to store test data
let mockTestTableData = {};

// Mock clink-components
jest.mock('clink-components', () => ({
  Table: ({ 
    columns, 
    rows, 
    rowsCount, 
    initRowsPerPage, 
    onChangeOrder, 
    onPageChange, 
    pagination, 
    rowsPerPageOptions 
  }) => {
    // Store table data for testing without circular reference issues
    mockTestTableData = {
      columns,
      rows,
      rowsCount,
      initRowsPerPage,
      pagination,
      rowsPerPageOptions
    };
    
    return (
      <div data-testid="mock-table">
        <div data-testid="table-rows-count">{rowsCount}</div>
        <div data-testid="table-init-rows-per-page">{initRowsPerPage}</div>
        <div data-testid="table-pagination">{pagination ? 'true' : 'false'}</div>
        <div data-testid="table-rows-per-page-options">{JSON.stringify(rowsPerPageOptions)}</div>
        <button 
          data-testid="change-order-btn" 
          onClick={() => onChangeOrder && onChangeOrder('company', true)}
        >
          Change Order
        </button>
        <button 
          data-testid="page-change-btn" 
          onClick={() => onPageChange && onPageChange({ page: 1, rowsPerPage: 10 })}
        >
          Change Page
        </button>
        {/* Render rows data for verification */}
        {rows && rows.map((row, index) => (
          <div key={index} data-testid={`table-row-${index}`}>
            {row.actions}
          </div>
        ))}
      </div>
    );
  },
}));

// Mock useContext
jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      fetchUsers: jest.fn(() => Promise.resolve()),
      fetchSubscriptions: jest.fn(() => Promise.resolve()),
      changeSubscription: jest.fn(() => Promise.resolve()),
      updateUsers: jest.fn(),
    },
    pages: {
      accounts: {
        actions: { test: 'action' },
        columns: [
          { key: 'company', label: 'Company' },
          { key: 'subscription', label: 'Subscription' },
        ],
        actionColumn: {
          config: { key: 'actions', label: 'Actions' },
        },
      },
      accountsProsperSupplyChain: {
        columns: [
          { key: 'company', label: 'Company' },
          { key: 'type', label: 'Type' },
        ],
      },
    },
    config: {
      typeAccount: 3,
      website: 2,
    },
  })),
}));

// Mock Actions component
jest.mock('./Actions', () => ({ 
  user, 
  accountsActions, 
  subscriptionsList, 
  regionOptions, 
  handleConfirm 
}) => (
  <div 
    data-testid="mock-actions"
    data-user-id={user?.account_id}
    data-accounts-actions={JSON.stringify(accountsActions)}
    data-subscriptions-count={subscriptionsList?.length || 0}
    data-region-options-count={regionOptions?.length || 0}
  >
    <button 
      data-testid="actions-confirm-btn"
      onClick={() => handleConfirm && handleConfirm(
        { id: 123, label: 'Test Subscription', interval_type: 'monthly' },
        { extra: 'data' }
      )}
    >
      Confirm Action
    </button>
  </div>
));

// Mock capitalize
jest.mock('lodash/capitalize', () => jest.fn((str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''));

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      admin: (state = {}) => state,
      users: (state = {}) => state,
      filters: (state = {}) => state,
      subscription: (state = {}) => state,
    },
    preloadedState: initialState,
  });
};

describe('Accounts', () => {
  let store;
  let mockDispatch;

  const mockUsers = {
    list: [
      {
        account_id: 1,
        company: 'Test Company 1',
        subscription: 'Free Trial',
        subscription_id: 10,
        frequency: 'Monthly',
      },
      {
        account_id: 2,
        company: 'Test Company 2',
        subscription: 'Premium',
        subscription_id: 11,
        frequency: 'Yearly',
      },
    ],
    listCount: 2,
  };

  const mockFilters = {
    list: {
      regions: [
        { id: 1, name: 'Region 1' },
        { id: 2, name: 'Region 2' },
      ],
    },
  };

  const mockSubscription = {
    subscriptionsList: [
      { id: 10, label: 'Free Trial', interval_type: 'monthly' },
      { id: 11, label: 'Premium', interval_type: 'yearly' },
    ],
  };

  beforeEach(() => {
    mockDispatch = jest.fn((action) => {
      // Return a promise for async actions
      if (typeof action === 'function') {
        return Promise.resolve();
      }
      if (action && typeof action.then === 'function') {
        return action;
      }
      return Promise.resolve();
    });
    store = createMockStore({
      admin: {},
      users: mockUsers,
      filters: mockFilters,
      subscription: mockSubscription,
    });
    store.dispatch = mockDispatch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (props = {}) => {
    const defaultProps = {
      users: mockUsers,
      subscription: mockSubscription,
      filters: mockFilters,
      dispatch: mockDispatch,
      params: {},
    };

    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Accounts {...defaultProps} {...props} />
        </BrowserRouter>
      </Provider>
    );
  };

  it('should render the table component', () => {
    renderWithProviders();

    expect(screen.getByTestId('mock-table')).toBeInTheDocument();
  });

  it('should display correct table configuration', () => {
    renderWithProviders();

    expect(screen.getByTestId('table-rows-count')).toHaveTextContent('2');
    expect(screen.getByTestId('table-init-rows-per-page')).toHaveTextContent('20');
    expect(screen.getByTestId('table-pagination')).toHaveTextContent('true');
    
    const rowsPerPageOptions = JSON.parse(screen.getByTestId('table-rows-per-page-options').textContent);
    expect(rowsPerPageOptions).toEqual([5, 10, 20, 50, 100]);
  });

  it('should map user list with company links and actions', () => {
    renderWithProviders();

    const { rows } = mockTestTableData;
    
    expect(rows).toHaveLength(2);
    expect(rows[0].account_id).toBe(1);
    expect(rows[1].account_id).toBe(2);
  });

  it('should render Actions component for each user', () => {
    renderWithProviders();

    const actionsComponents = screen.getAllByTestId('mock-actions');
    expect(actionsComponents).toHaveLength(2);
    
    expect(actionsComponents[0]).toHaveAttribute('data-user-id', '1');
    expect(actionsComponents[1]).toHaveAttribute('data-user-id', '2');
  });

  it('should handle change order', () => {
    renderWithProviders();

    fireEvent.click(screen.getByTestId('change-order-btn'));

    // Should dispatch action
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('should handle page change', () => {
    renderWithProviders();

    fireEvent.click(screen.getByTestId('page-change-btn'));

    // Should dispatch action
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('should handle custom type account for supply chain', () => {
    renderWithProviders({ customTypeAccount: 4 });

    expect(screen.getByTestId('mock-table')).toBeInTheDocument();
    
    const { columns } = mockTestTableData;
    // Should use supply chain columns instead of regular columns
    expect(columns.some(col => col.key === 'type')).toBe(true);
  });

  it('should handle subscription change confirmation', () => {
    renderWithProviders();

    const confirmButton = screen.getAllByTestId('actions-confirm-btn')[0];
    fireEvent.click(confirmButton);

    // Should dispatch changeSubscription action
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('should handle empty user list', () => {
    renderWithProviders({
      users: { list: [], listCount: 0 },
    });

    const { rows } = mockTestTableData;
    expect(rows).toEqual([]);
    expect(screen.getByTestId('table-rows-count')).toHaveTextContent('0');
  });

  it('should handle null user list', () => {
    renderWithProviders({
      users: { list: null, listCount: 0 },
    });

    const { rows } = mockTestTableData;
    expect(rows).toEqual([]);
  });

  it('should use correct column configuration', () => {
    renderWithProviders();

    const { columns } = mockTestTableData;
    
    // Should include action column
    expect(columns.some(col => col.key === 'actions')).toBe(true);
    expect(columns.some(col => col.key === 'company')).toBe(true);
    expect(columns.some(col => col.key === 'subscription')).toBe(true);
  });

  it('should handle params with search term', () => {
    const params = { term: 'test search' };
    renderWithProviders({ params });

    // Component should render without errors
    expect(screen.getByTestId('mock-table')).toBeInTheDocument();
  });

  it('should handle missing region options', () => {
    renderWithProviders({
      filters: { list: { regions: null } },
    });

    const actionsComponents = screen.getAllByTestId('mock-actions');
    expect(actionsComponents[0]).toHaveAttribute('data-region-options-count', '0');
  });

  it('should handle subscription actions correctly', () => {
    renderWithProviders();
    
    const mockActions = screen.getAllByTestId('mock-actions');
    
    expect(mockActions[0]).toHaveAttribute('data-subscriptions-count', '2');
    expect(mockActions[0]).toHaveAttribute('data-region-options-count', '2');
  });

  it('should format column labels with translations', () => {
    renderWithProviders();

    const { columns } = mockTestTableData;
    
    // Should have translated action column
    const actionColumn = columns.find(col => col.key === 'actions');
    expect(actionColumn.label).toBe('translated-table-column-actions');
  });

  it('should handle missing subscriptions list', () => {
    renderWithProviders({
      subscription: { subscriptionsList: null },
    });

    const actionsComponents = screen.getAllByTestId('mock-actions');
    expect(actionsComponents[0]).toHaveAttribute('data-subscriptions-count', '0');
  });
});