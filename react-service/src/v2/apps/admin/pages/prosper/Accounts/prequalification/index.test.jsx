import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Prequalification from 'v2/apps/admin/pages/prosper/Accounts/prequalification/index';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

// Mock hooks/context
jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

// Mock PrequalificationV2 component
jest.mock('v2/apps/prosper/pages/prequalification_v2', () => ({ contextType }) => (
  <div data-testid="mock-prequalification-v2" data-context-type={contextType}>
    Prequalification V2 Component
  </div>
));

const { useParams } = require('react-router-dom');
const { useContext } = require('hooks/context');

// Create a mock store
const createMockStore = (initialState = {}) => {
  const mockDispatch = jest.fn();
  const store = configureStore({
    reducer: {
      prequalificationV2: (state = {}) => state,
    },
    preloadedState: initialState,
  });
  
  // Override dispatch
  store.dispatch = mockDispatch;
  
  return { store, mockDispatch };
};

describe('Prequalification', () => {
  let store;
  let mockDispatch;
  const mockActions = {
    fetchPrequalificationSections: jest.fn(),
    fetchPrequalification_V2: jest.fn(),
  };

  beforeEach(() => {
    // Create a simpler mock store
    store = configureStore({
      reducer: {
        prequalificationV2: (state = { documents: {} }) => state,
      },
      preloadedState: {
        prequalificationV2: {
          documents: {},
        },
      },
    });

    // Mock dispatch to track calls
    mockDispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        // For thunk actions, return a promise
        return Promise.resolve();
      }
      return action;
    });
    store.dispatch = mockDispatch;

    useParams.mockReturnValue({ accountId: '123' });
    useContext.mockReturnValue({ actions: mockActions });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <Provider store={store}>
        <Prequalification contextType="adminProsper" />
      </Provider>
    );

    expect(screen.getByTestId('mock-prequalification-v2')).toBeInTheDocument();
  });

  it('should render PrequalificationV2 with admin contextType', () => {
    render(
      <Provider store={store}>
        <Prequalification contextType="adminProsper" />
      </Provider>
    );

    const prequalV2 = screen.getByTestId('mock-prequalification-v2');
    expect(prequalV2).toHaveAttribute('data-context-type', 'admin');
  });

  it('should render and mount successfully', () => {
    render(
      <Provider store={store}>
        <Prequalification contextType="adminProsper" />
      </Provider>
    );

    // Verify the component renders correctly
    expect(screen.getByTestId('mock-prequalification-v2')).toBeInTheDocument();
  });

  it('should work with documents in state', () => {
    const storeWithDocuments = configureStore({
      reducer: {
        prequalificationV2: (state = { documents: { section1: 'data' } }) => state,
      },
      preloadedState: {
        prequalificationV2: {
          documents: { section1: 'data' },
        },
      },
    });

    render(
      <Provider store={storeWithDocuments}>
        <Prequalification contextType="adminProsper" />
      </Provider>
    );

    expect(screen.getByTestId('mock-prequalification-v2')).toBeInTheDocument();
  });

  it('should handle different accountId from params', () => {
    useParams.mockReturnValue({ accountId: '456' });

    render(
      <Provider store={store}>
        <Prequalification contextType="adminProsper" />
      </Provider>
    );

    expect(screen.getByTestId('mock-prequalification-v2')).toBeInTheDocument();
  });

  it('should work with different contextType', () => {
    render(
      <Provider store={store}>
        <Prequalification contextType="differentContext" />
      </Provider>
    );

    // PrequalificationV2 should still receive 'admin' as contextType
    const prequalV2 = screen.getByTestId('mock-prequalification-v2');
    expect(prequalV2).toHaveAttribute('data-context-type', 'admin');
  });
});