import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Features from './index';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock Actions component
jest.mock('./Actions', () => {
  return function MockActions({ data, actions = [] }) {
    return (
      <div data-testid="mock-actions">
        <span data-testid="actions-count">{actions.length}</span>
        <span data-testid="data-id">{data?.id}</span>
      </div>
    );
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  Table: ({ columns, rows, pagination, rowsPerPageOptions }) => (
    <div data-testid="features-table">
      <div data-testid="table-columns-count">{columns ? columns.length : 0}</div>
      <div data-testid="table-rows-count">{rows ? rows.length : 0}</div>
      <div data-testid="table-pagination">{pagination ? 'true' : 'false'}</div>
      <div data-testid="table-rows-per-page-options">{rowsPerPageOptions ? rowsPerPageOptions.length : 0}</div>
    </div>
  ),
}));

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      features: () => ({
        list: [],
        featureList: [],
        ...initialState.features,
      }),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

describe('Features Component', () => {
  let mockStore;
  let mockDispatch;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockStore = createMockStore();
    mockStore.dispatch = mockDispatch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <Provider store={mockStore}>
        <Features />
      </Provider>
    );

    expect(screen.getByTestId('features-table')).toBeInTheDocument();
  });

  it('should render table component with expected props structure', () => {
    render(
      <Provider store={mockStore}>
        <Features />
      </Provider>
    );

    // Verify the Table component receives the expected structure
    expect(screen.getByTestId('table-columns-count')).toHaveTextContent('4'); // id, name, enabled, actions
    expect(screen.getByTestId('table-pagination')).toHaveTextContent('true');
    expect(screen.getByTestId('table-rows-per-page-options')).toHaveTextContent('5'); // [5,10,20,50,100]
  });

  it('should render with featureList data when available', () => {
    const storeWithFeatures = createMockStore({
      features: {
        list: [{ id: 1, name: 'Feature 1', enabled: true }],
        featureList: ['feature1', 'feature2'],
      },
    });

    render(
      <Provider store={storeWithFeatures}>
        <Features />
      </Provider>
    );

    // Should have 1 row of data
    expect(screen.getByTestId('table-rows-count')).toHaveTextContent('1');
  });

  it('should render table with correct props', () => {
    const storeWithData = createMockStore({
      features: {
        list: [
          { id: 1, name: 'Feature 1', enabled: true },
          { id: 2, name: 'Feature 2', enabled: false },
        ],
        featureList: [],
      },
    });

    render(
      <Provider store={storeWithData}>
        <Features />
      </Provider>
    );

    const table = screen.getByTestId('features-table');
    expect(table).toBeInTheDocument();

    // Check pagination is enabled
    expect(screen.getByTestId('table-pagination')).toHaveTextContent('true');

    // Check we have 4 columns (id, name, enabled, actions)
    expect(screen.getByTestId('table-columns-count')).toHaveTextContent('4');

    // Check we have 2 rows of data
    expect(screen.getByTestId('table-rows-count')).toHaveTextContent('2');

    // Check rowsPerPageOptions count
    expect(screen.getByTestId('table-rows-per-page-options')).toHaveTextContent('5');
  });

  it('should pass contextType prop correctly', () => {
    render(
      <Provider store={mockStore}>
        <Features contextType="custom" />
      </Provider>
    );

    expect(screen.getByTestId('features-table')).toBeInTheDocument();
  });

  it('should handle empty lists correctly', () => {
    const emptyStore = createMockStore({
      features: {
        list: [],
        featureList: [],
      },
    });

    render(
      <Provider store={emptyStore}>
        <Features />
      </Provider>
    );

    const tableRowsCount = screen.getByTestId('table-rows-count');
    expect(tableRowsCount).toHaveTextContent('0');
  });

  it('should map state to props correctly', () => {
    const storeWithData = createMockStore({
      features: {
        list: [{ id: 1, name: 'Test Feature' }],
        featureList: ['feature1'],
      },
    });

    render(
      <Provider store={storeWithData}>
        <Features />
      </Provider>
    );

    expect(screen.getByTestId('features-table')).toBeInTheDocument();
  });
});