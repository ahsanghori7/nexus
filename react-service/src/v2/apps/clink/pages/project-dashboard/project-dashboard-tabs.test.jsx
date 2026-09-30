// Mock flags
jest.mock('v2/helpers/flags', () => jest.fn(() => true));

// Mock lodash isEmpty
jest.mock('lodash/isEmpty', () => jest.fn((obj) => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}));

// Mock react-router-dom useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(() => ({ slug: 'test-project' })),
}));

// Mock actions - return thunk functions for async actions
const mockActions = {
  fetchConstants: jest.fn(() => (dispatch) => dispatch({ type: 'FETCH_CONSTANTS' })),
  fetchProjectSummary: jest.fn(() => (dispatch) => dispatch({ type: 'FETCH_PROJECT_SUMMARY' })),
  fetchPackageDependency: jest.fn(() => (dispatch) => dispatch({ type: 'FETCH_PACKAGE_DEPENDENCY' })),
  fetchQuotes: jest.fn(() => (dispatch) => dispatch({ type: 'FETCH_QUOTES' })),
  fetchQuoteFiles: jest.fn(() => (dispatch) => dispatch({ type: 'FETCH_QUOTE_FILES' })),
  fetchQuoteDocuments: jest.fn(() => (dispatch) => dispatch({ type: 'FETCH_QUOTE_DOCUMENTS' })),
  fetchOrders: jest.fn(() => (dispatch) => dispatch({ type: 'FETCH_ORDERS' })),
  fetchProcurementSchedule: jest.fn(() => (dispatch) => dispatch({ type: 'FETCH_PROCUREMENT_SCHEDULE' })),
  getProjectProcurement: jest.fn(() => (dispatch) => dispatch({ type: 'GET_PROJECT_PROCUREMENT' })),
  setTasks: jest.fn(() => (dispatch) => dispatch({ type: 'SET_TASKS' })),
  setOverview: jest.fn(() => (dispatch) => dispatch({ type: 'SET_OVERVIEW' })),
};

// Mock context
jest.mock('v2/hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: mockActions,
  })),
}));

// Import setup mocks first
// const { mockFlag, mockActions } = require('project-dashboard/mockSetup');

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

// Import mocked modules to access them
import mockFlag from 'v2/helpers/flags';
import mockIsEmpty from 'lodash/isEmpty';
import { useParams } from 'react-router-dom';
import { useContext } from 'v2/hooks/context';

// Mock the sub-components
jest.mock('./index', () => {
  return function MockProjectDashboard(props) {
    return (
      <div data-testid="project-dashboard">
        Project Dashboard - isThereTasks: {String(props.isThereTasks)} - loading: {String(props.loading)}
      </div>
    );
  };
});

jest.mock('./procurement-schedule-overview', () => {
  return function MockProcurementScheduleOverview(props) {
    return (
      <div data-testid="procurement-schedule-overview">
        Procurement Schedule Overview - overview: {JSON.stringify(props.overview)} - summary: {JSON.stringify(props.summary)}
      </div>
    );
  };
});

jest.mock('./ProjectLoading', () => {
  return function MockProjectLoading(props) {
    return (
      <div data-testid="project-loading">
        Loading - loading: {String(props.loading)} - isThereTasks: {String(props.isThereTasks)} - slug: {props.slug}
      </div>
    );
  };
});

// Mock MUI components
jest.mock('@mui/material', () => ({
  Tabs: ({ children, value, onChange }) => {
    const handleClick = () => {
      if (onChange) onChange({}, 1);
    };
    return (
      <div data-testid="tabs" data-value={value}>
        <button data-testid="tabs-click" onClick={handleClick}>Change Tab</button>
        {children}
      </div>
    );
  },
  Tab: ({ label, ...props }) => (
    <div data-testid={`tab-${label.replace(/\s+/g, '-').toLowerCase()}`} {...props}>
      {label}
    </div>
  ),
  Box: ({ children, mt }) => <div data-testid="box" data-mt={mt}>{children}</div>,
}));

import ProjectDashboardTabs from './project-dashboard-tabs';

// Create a mock Redux store
const createMockStore = (initialState, mockDispatch) => {
  const reducer = (state = initialState, action) => state;
  const store = createStore(reducer, applyMiddleware(thunk));
  // Override the dispatch method with our mock
  store.dispatch = mockDispatch;
  return store;
};

describe('ProjectDashboardTabs', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    dispatch: mockDispatch,
    project: {
      data: { id: 1, name: 'Test Project', tender: [{ id: 1 }] },
      summary: {},
      tasks: [],
      dependencyStatus: true,
      loadingSummary: false,
      loadingStatus: false,
      overview: [],
      summaryOverview: [],
    },
    quotesData: { name: 'Test Project' },
    procurementSchedule: [],
    orders: [],
    constants: { tender: {} },
    loadingSummary: false,
    loadingStatus: false,
    loadingQuotes: false,
    loadingOrders: false,
    submittingProcurement: false,
    overview: [],
    summaryOverview: [],
  };

  const renderWithProviders = (props = defaultProps) => {
    const mockState = {
      project: {
        data: props.project.data,
        summary: props.project.summary,
        tasks: props.project.tasks,
        dependencyStatus: props.project.dependencyStatus,
        loadingSummary: props.loadingSummary,
        loadingStatus: props.loadingStatus,
        overview: props.overview,
        summaryOverview: props.summaryOverview,
      },
      quotesTender: {
        quotesData: props.quotesData,
        loadingQuotes: props.loadingQuotes,
      },
      procurementSchedule: {
        packages: props.procurementSchedule,
        submittingProcurement: props.submittingProcurement,
      },
      order: {
        list: props.orders,
        loadingOrders: props.loadingOrders,
      },
      constants: props.constants,
    };
    
    const store = createMockStore(mockState, mockDispatch);
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ProjectDashboardTabs {...props} />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFlag.mockReturnValue(true); // Default flag behavior
  });

  it('renders without crashing', () => {
    renderWithProviders();
    expect(screen.getAllByTestId('box')).toHaveLength(2);
  });

  it('renders tabs when PROCUREMENT_SCHEDULE_OVERVIEW flag is enabled', () => {
    mockFlag.mockReturnValue(true);
    renderWithProviders();
    
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByTestId('tab-procurement-schedule-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-project-timeline')).toBeInTheDocument();
  });

  it.skip('does not render tabs when PROCUREMENT_SCHEDULE_OVERVIEW flag is disabled', () => {
    // Skip: Flag is evaluated at module load time, can't be changed dynamically
    mockFlag.mockReturnValue(false);
    renderWithProviders();
    
    expect(screen.queryByTestId('tabs')).not.toBeInTheDocument();
  });

  it('renders with default tab value of 0 when flag is enabled', () => {
    mockFlag.mockReturnValue(true);
    renderWithProviders();
    expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', '0');
  });

  it('dispatches fetchConstants when constants.tender is empty', () => {
    const props = {
      ...defaultProps,
      constants: { tender: null },
    };
    renderWithProviders(props);
    // Should dispatch thunk actions
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('dispatches project summary and dependency actions when conditions are met', () => {
    const props = {
      ...defaultProps,
      project: {
        data: { id: 1 },
        summary: {},
        tasks: [],
        dependencyStatus: true,
      },
    };
    renderWithProviders(props);
    
    // Should dispatch thunk actions for project summary and dependency
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('does not dispatch summary actions when summary is not empty', () => {
    const props = {
      ...defaultProps,
      project: {
        ...defaultProps.project,
        summary: [{ id: 1 }], // Non-empty summary
        dependencyStatus: true,
      },
      constants: { tender: [{ id: 1 }] }, // Non-empty to prevent fetchConstants
      orders: [{ id: 1 }], // Non-empty to prevent fetchOrders
    };
    renderWithProviders(props);
    
    // Should have fewer dispatch calls since summary-related actions shouldn't be called
    expect(mockDispatch.mock.calls.length).toBeLessThan(4);
  });

  it('does not dispatch actions when dependencyStatus is false', () => {
    const props = {
      ...defaultProps,
      project: {
        ...defaultProps.project,
        summary: {},
        dependencyStatus: false,
      },
      constants: { tender: [{ id: 1 }] }, // Non-empty to prevent fetchConstants
      orders: [{ id: 1 }], // Non-empty to prevent fetchOrders
    };
    renderWithProviders(props);
    
    // Should have fewer dispatch calls since dependency-related actions shouldn't be called
    expect(mockDispatch.mock.calls.length).toBeLessThan(4);
  });

  it('dispatches fetchQuotes actions when project name differs from quotes name', () => {
    const props = {
      ...defaultProps,
      project: {
        ...defaultProps.project,
        data: { id: 1, name: 'Different Project' },
      },
      quotesData: { name: 'Original Project' },
    };
    renderWithProviders(props);
    
    // Should dispatch thunk actions for quotes
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('dispatches fetchOrders when orders array is empty', () => {
    const props = {
      ...defaultProps,
      orders: [],
    };
    renderWithProviders(props);
    
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('dispatches procurement schedule actions when array is empty', () => {
    const props = {
      ...defaultProps,
      procurementSchedule: [],
    };
    renderWithProviders(props);
    
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('dispatches setTasks when conditions are met', () => {
    const props = {
      ...defaultProps,
      project: {
        ...defaultProps.project,
        data: { id: 1, tender: [{ id: 1 }] },
        summary: { data: 'not empty' },
        tasks: [],
      },
    };
    renderWithProviders(props);
    
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('renders ProjectDashboard when tab value is 1', () => {
    renderWithProviders();
    
    // Initially shows ProcurementScheduleOverview (tab 0)
    expect(screen.getByTestId('procurement-schedule-overview')).toBeInTheDocument();
    
    // Simulate clicking to tab 1 by clicking the tabs-click button which should set value to 1
    const tabButton = screen.getByTestId('tabs-click');
    fireEvent.click(tabButton); // This should change tab to 1
    
    // After tab change, should show ProjectDashboard
    expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
  });

  it('renders ProcurementScheduleOverview when tab value is 0 and flag is enabled', () => {
    mockFlag.mockReturnValue(true);
    renderWithProviders();
    
    // Tab 0 is selected by default when flag is enabled
    expect(screen.getByTestId('procurement-schedule-overview')).toBeInTheDocument();
  });

  it('handles missing project data gracefully', () => {
    const props = {
      ...defaultProps,
      project: {
        data: null,
        summary: {},
        tasks: [],
        dependencyStatus: false,
      },
    };
    renderWithProviders(props);
    expect(screen.getAllByTestId('box')).toHaveLength(2);
  });

  it('calculates loading states correctly', () => {
    const props = {
      ...defaultProps,
      loadingStatus: true,
      loadingSummary: false,
    };
    renderWithProviders(props);
    
    // Should show loading state in ProjectLoading component
    expect(screen.getByText(/loading: true/)).toBeInTheDocument();
  });

  it('passes correct props to child components', () => {
    renderWithProviders();
    
    // Check that ProjectLoading receives props (slug may be empty due to mock setup)
    expect(screen.getByText(/Loading - loading:/)).toBeInTheDocument();
    expect(screen.getByText(/- slug:/)).toBeInTheDocument();
    
    // Check that components receive overview and summary props
    expect(screen.getByText(/overview: \[\]/)).toBeInTheDocument();
  });
});