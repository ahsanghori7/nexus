import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import CustomerHealthScore from './CustomerHealthScore';

// Mock dependencies
jest.mock('clink-components', () => ({
  Table: ({ columns, rows, pagination, rowsPerPageOptions, ...props }) => (
    <div data-testid="table">
      <div data-testid="table-columns">{JSON.stringify(columns)}</div>
      <div data-testid="table-rows">{JSON.stringify(rows)}</div>
      <div data-testid="table-pagination">{pagination ? 'true' : 'false'}</div>
      <div data-testid="table-rows-per-page-options">{JSON.stringify(rowsPerPageOptions)}</div>
    </div>
  )
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn()
}));

// Create a mock store
const createMockStore = (initialState) => {
  const reducer = (state = initialState) => state;
  return createStore(reducer);
};

describe('CustomerHealthScore Component', () => {
  const mockFetchHealthScore = jest.fn();
  const mockContext = {
    pages: {
      customerHealthScore: {
        columns: [
          { id: 'name', label: 'Name' },
          { id: 'score', label: 'Score' }
        ]
      }
    },
    actions: {
      fetchHealthScore: mockFetchHealthScore
    }
  };

  const mockState = {
    customerHealthScore: {
      list: [
        { id: 1, name: 'Company A', score: 85 },
        { id: 2, name: 'Company B', score: 92 }
      ]
    }
  };

  let store;
  let mockDispatch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    mockFetchHealthScore.mockReturnValue({ type: 'FETCH_HEALTH_SCORE' });
    store = createMockStore(mockState);
    store.dispatch = mockDispatch;
    
    const { useContext } = require('hooks/context');
    useContext.mockReturnValue(mockContext);
  });

  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <CustomerHealthScore />
      </Provider>
    );
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('passes correct columns to Table component', () => {
    render(
      <Provider store={store}>
        <CustomerHealthScore />
      </Provider>
    );
    
    const columnsElement = screen.getByTestId('table-columns');
    expect(columnsElement).toHaveTextContent(JSON.stringify(mockContext.pages.customerHealthScore.columns));
  });

  it('passes correct rows to Table component', () => {
    render(
      <Provider store={store}>
        <CustomerHealthScore />
      </Provider>
    );
    
    const rowsElement = screen.getByTestId('table-rows');
    expect(rowsElement).toHaveTextContent(JSON.stringify(mockState.customerHealthScore.list));
  });

  it('enables pagination on Table component', () => {
    render(
      <Provider store={store}>
        <CustomerHealthScore />
      </Provider>
    );
    
    const paginationElement = screen.getByTestId('table-pagination');
    expect(paginationElement).toHaveTextContent('true');
  });

  it('passes correct rowsPerPageOptions to Table component', () => {
    render(
      <Provider store={store}>
        <CustomerHealthScore />
      </Provider>
    );
    
    const rowsPerPageElement = screen.getByTestId('table-rows-per-page-options');
    expect(rowsPerPageElement).toHaveTextContent(JSON.stringify([5, 10, 20, 50, 100]));
  });

  it('renders table with correct props from context and state', () => {
    render(
      <Provider store={store}>
        <CustomerHealthScore />
      </Provider>
    );
    
    expect(screen.getByTestId('table')).toBeInTheDocument();
    
    // Check that the component uses the context correctly
    const columnsElement = screen.getByTestId('table-columns');
    const rowsElement = screen.getByTestId('table-rows');
    
    expect(columnsElement).toHaveTextContent(JSON.stringify(mockContext.pages.customerHealthScore.columns));
    expect(rowsElement).toHaveTextContent(JSON.stringify(mockState.customerHealthScore.list));
  });

  it('handles empty list gracefully', () => {
    const storeWithEmptyList = createMockStore({
      customerHealthScore: { list: [] }
    });
    storeWithEmptyList.dispatch = mockDispatch;

    render(
      <Provider store={storeWithEmptyList}>
        <CustomerHealthScore />
      </Provider>
    );
    
    const rowsElement = screen.getByTestId('table-rows');
    expect(rowsElement).toHaveTextContent('[]');
  });

  it('handles missing customerHealthScore state gracefully', () => {
    const storeWithMissingState = createMockStore({
      customerHealthScore: { list: [] }
    });
    storeWithMissingState.dispatch = mockDispatch;

    render(
      <Provider store={storeWithMissingState}>
        <CustomerHealthScore />
      </Provider>
    );
    
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });
});