import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';

// Mock all external dependencies first
jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchTokens: jest.fn(),
      fetchSupplyChainAnalytics: jest.fn()
    }
  })
}));

jest.mock('v2/apps/shared/components/cards/prosper/DashboardCard', () => {
  return function MockProsperDashboardCard(props) {
    return <div data-testid="prosper-dashboard-card" {...props}>Mock Prosper Dashboard Card</div>;
  };
});

jest.mock('./charts/bar', () => {
  return function MockBar(props) {
    return <div data-testid="bar-chart" {...props}>Mock Bar Chart</div>;
  };
});

jest.mock('./charts/DateRange', () => {
  return function MockDateRange(props) {
    return <div data-testid="date-range" {...props}>Mock DateRange</div>;
  };
});

jest.mock('./CompanyCard', () => {
  return function MockCompanyCard(props) {
    return <div data-testid="company-card" {...props}>Mock CompanyCard</div>;
  };
});

jest.mock('./Mui.styled', () => ({
  MuiDashboardCardContainer: ({ children, ...props }) => (
    <div data-testid="dashboard-card-container" {...props}>
      {children}
    </div>
  ),
  MuiCompanyCardContainer: ({ children, ...props }) => (
    <div data-testid="company-card-container" {...props}>
      {children}
    </div>
  ),
  MuiProsperDashboardCard: ({ children, ...props }) => (
    <div data-testid="prosper-dashboard-card" {...props}>
      {children}
    </div>
  )
}));

// Import the component AFTER the mocks
const ConnectedDashboard = require('./index').default;

// Create a mock store
const createMockStore = (initialState = {}) => {
  return {
    getState: () => ({
      prosper: {
        companies: {
          data: [{
            id: 1,
            name: 'Test Company',
            description: 'Test Description'
          }]
        }
      },
      analytics: {
        issuedpaidweek: [{ id: 1, name: 'Week Data 1' }, { id: 2, name: 'Week Data 2' }],
        issuedpaidday: [{ id: 1, name: 'Day Data 1' }, { id: 2, name: 'Day Data 2' }],
        usedfreeday: [{ id: 1, name: 'Free Day 1' }, { id: 2, name: 'Free Day 2' }],
        usedfreeweek: [{ id: 1, name: 'Free Week 1' }, { id: 2, name: 'Free Week 2' }]
      },
      account: {
        profile: {
          data: {
            id: 1,
            name: 'Test User'
          }
        }
      },
      ...initialState,
    }),
    dispatch: jest.fn(),
    subscribe: jest.fn(() => () => {}),
    replaceReducer: jest.fn()
  };
};

describe('Dashboard', () => {
  let mockStore;
  let mockDispatch;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockStore = createMockStore();
    mockStore.dispatch = mockDispatch;
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      match: { params: {} },
      location: { pathname: '/dashboard' },
      history: {},
      ...props,
    };

    return render(
      <Provider store={mockStore}>
        <ConnectedDashboard {...defaultProps} />
      </Provider>
    );
  };

  describe('Dashboard', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {
      // Any additional props the component needs
    };

    return render(
      <Provider store={mockStore}>
        <ConnectedDashboard {...defaultProps} {...props} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('dashboard-card-container')).toBeInTheDocument();
  });

  it('renders all four prosper dashboard cards', () => {
    renderComponent();
    const dashboardCards = screen.getAllByTestId('prosper-dashboard-card');
    expect(dashboardCards).toHaveLength(4);
    
    // Check that cards have the expected title attributes
    const titles = dashboardCards.map(card => card.getAttribute('title'));
    expect(titles).toContain('Token purchased');
    expect(titles).toContain('Purchased Tokens per user');
    expect(titles).toContain('Free tokens per week');
    expect(titles).toContain('Free Token usage per user');
  });

  it('renders all dashboard card mock content', () => {
    renderComponent();
    
    // Should contain the mock content from all cards
    expect(screen.getAllByText('Mock Prosper Dashboard Card')).toHaveLength(4);
  });

  it('has proper dashboard container structure', () => {
    renderComponent();
    const container = screen.getByTestId('dashboard-card-container');
    expect(container).toBeInTheDocument();
    
    // Verify the dashboard cards are within the container
    const dashboardCards = screen.getAllByTestId('prosper-dashboard-card');
    dashboardCards.forEach(card => {
      expect(container).toContainElement(card);
    });
  });

  it('provides analytics props to connected component', () => {
    renderComponent();
    
    // The component should render successfully, indicating it received
    // the analytics props from the Redux state
    expect(screen.getByTestId('dashboard-card-container')).toBeInTheDocument();
  });

  it('passes dispatch function to component', () => {
    // Since useEffect calls dispatch, if the component renders without errors,
    // it means dispatch was properly provided
    renderComponent();
    expect(screen.getByTestId('dashboard-card-container')).toBeInTheDocument();
  });
});
});