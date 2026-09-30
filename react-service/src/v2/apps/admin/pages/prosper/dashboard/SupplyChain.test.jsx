import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import '@testing-library/jest-dom';
import SupplyChainDashboard from './SupplyChain';

// Mock the hooks/context module
jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchSupplyChainAnalytics: jest.fn()
    }
  })
}));

// Mock the Mui.styled components
jest.mock('./Mui.styled', () => ({
  MuiDashboardCardContainer: ({ children, supplyChain, ...props }) => (
    <div data-testid="dashboard-card-container" supplychain={supplyChain ? 'true' : undefined} {...props}>
      {children}
    </div>
  )
}));

// Mock the Doughnut component
jest.mock('./charts/doughnut', () => {
  return function MockDoughnut({ data }) {
    return (
      <div data-testid="doughnut-chart">
        Doughnut Chart
        {data && <div data-testid="chart-data">{JSON.stringify(data)}</div>}
      </div>
    );
  };
});

// Mock the DateRange component
jest.mock('./charts/DateRange', () => {
  return function MockDateRange({ start, end, handleStart, handleEnd }) {
    return (
      <div data-testid="date-range">
        <span data-testid="start-date">{start?.toISOString().slice(0, 10)}</span>
        <span data-testid="end-date">{end?.toISOString().slice(0, 10)}</span>
      </div>
    );
  };
});

// Create a mock store
const createMockStore = (initialState = {}) => {
  const mockReducer = (state = { analytics: { supplyChain: {} } }, action) => {
    return state;
  };

  return createStore(mockReducer, {
    analytics: { supplyChain: {} },
    ...initialState,
  });
};

describe('SupplyChainDashboard', () => {
  let mockStore;
  let mockDispatch;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockStore = createMockStore();
    mockStore.dispatch = mockDispatch;
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      analytics: { supplyChain: {} },
      dispatch: mockDispatch,
      ...props,
    };

    return render(
      <Provider store={mockStore}>
        <SupplyChainDashboard {...defaultProps} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('prosper-dashboard-card')).toBeInTheDocument();
  });

  it('displays the correct title', () => {
    renderComponent();
    expect(screen.getByTestId('card-title')).toHaveTextContent('Activated %');
  });

  it('renders the Doughnut chart component', () => {
    renderComponent();
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
  });

  it('renders the DateRange component', () => {
    renderComponent();
    expect(screen.getByTestId('date-range')).toBeInTheDocument();
  });

  it('passes analytics data to Doughnut component', () => {
    const mockAnalytics = { 
      supplyChain: { 
        activated: 85,
        total: 120,
        percentage: 70.8 
      } 
    };
    
    renderComponent({ analytics: mockAnalytics });
    
    const chartData = screen.getByTestId('chart-data');
    expect(chartData).toHaveTextContent(JSON.stringify(mockAnalytics.supplyChain));
  });

  it('has proper container styling', () => {
    renderComponent();
    const container = screen.getByTestId('dashboard-card-container');
    expect(container).toHaveAttribute('supplychain');
  });

  it('renders with date range showing start and end dates', () => {
    renderComponent();
    const dateRange = screen.getByTestId('date-range');
    expect(dateRange).toBeInTheDocument();
    
    // Check that start and end dates are rendered
    expect(screen.getByTestId('start-date')).toBeInTheDocument();
    expect(screen.getByTestId('end-date')).toBeInTheDocument();
  });
});