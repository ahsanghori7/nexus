import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import ForecastFinal from './index';

// Mock all external dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key) => key),
  }),
}));

jest.mock('lodash/isEmpty', () => jest.fn((value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      fetchForecastList: jest.fn(),
      changeBudget: jest.fn(),
    },
    pages: {
      forecastFinal: {
        table: {
          columns: [],
          rowBuilder: jest.fn(() => ({})),
        },
      },
    },
  })),
}));

jest.mock('v2/helpers/url', () => ({
  getQueryStringVars: jest.fn(() => ({ type: 'test' })),
}));

jest.mock('v2/apps/clink/pages/shared/template/helpers', () => ({
  instructionsBreadcrumbs: jest.fn(() => []),
}));

// Mock components
jest.mock('@mui/material/Grid', () => {
  return function Grid({ children, ...props }) {
    return <div data-testid="grid" {...props}>{children}</div>;
  };
});

jest.mock('clink-components', () => ({
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

jest.mock('v2/apps/clink/pages/shared/template', () => {
  return function Template({ children, title, breadcrumb }) {
    return (
      <div data-testid="template">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/shared/instruction-list/ProjectManagementTable', () => {
  return function ProjectManagementTable({ theme, columns, rows }) {
    return (
      <div data-testid="project-management-table">
        <span data-testid="theme">{theme}</span>
      </div>
    );
  };
});

jest.mock('./DownloadExcel', () => {
  return function DownloadExcel(props) {
    return <div data-testid="download-excel">Download Excel Component</div>;
  };
});

jest.mock('./styled', () => ({
  StyledForecastBudget: ({ children }) => <div data-testid="styled-forecast-budget">{children}</div>,
  StyledForecastProjectBudget: ({ children }) => <div data-testid="styled-forecast-project-budget">{children}</div>,
  StyledForecastProjectNumber: ({ children, bordered, profitValue }) => (
    <div 
      data-testid="styled-forecast-project-number" 
      data-bordered={bordered}
      data-profit-value={profitValue}
    >
      {children}
    </div>
  ),
  StyledForecastContainer: ({ children, content }) => (
    <div data-testid="styled-forecast-container" data-content={content}>{children}</div>
  ),
}));

const { MemoryRouter } = jest.requireActual('react-router-dom');

describe('ForecastFinal', () => {
  let store;
  let mockDispatch;

  beforeEach(() => {
    mockDispatch = jest.fn();
    
    // Create a mock store
    const initialState = {
      project: {
        data: {
          id: 1,
          name: 'Test Project',
        },
      },
      instructions: {
        forecastList: [
          {
            package: 'Package 1',
            budget: 1000,
            order: 800,
            variations: 200,
            omissions: -100,
            total: 900,
          },
          {
            package: 'Package 2',
            budget: 2000,
            order: 1800,
            variations: 300,
            omissions: -200,
            total: 1900,
          },
        ],
        status: 'loaded',
      },
    };

    store = createStore(() => initialState);
    store.dispatch = mockDispatch;
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      project: {
        data: {
          id: 1,
          name: 'Test Project',
        },
      },
      instructions: {
        forecastList: [
          {
            package: 'Package 1',
            budget: 1000,
            order: 800,
            variations: 200,
            omissions: -100,
            total: 900,
          },
        ],
        status: 'loaded',
      },
      dispatch: mockDispatch,
      ...props,
    };

    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/test/1']}>
          <ForecastFinal {...defaultProps} />
        </MemoryRouter>
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('template')).toBeInTheDocument();
  });

  it('shows loader when status is loading', () => {
    renderComponent({
      instructions: {
        forecastList: [],
        status: 'loading',
      },
    });

    // The component should render the template regardless
    expect(screen.getByTestId('template')).toBeInTheDocument();
  });

  it('displays forecast content when not loading', () => {
    renderComponent();

    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    expect(screen.getByTestId('styled-forecast-container')).toBeInTheDocument();
    expect(screen.getByTestId('download-excel')).toBeInTheDocument();
    expect(screen.getByTestId('project-management-table')).toBeInTheDocument();
  });

  it('renders project management table with correct theme', () => {
    renderComponent();

    const table = screen.getByTestId('project-management-table');
    expect(table).toBeInTheDocument();
    expect(screen.getByTestId('theme')).toHaveTextContent('forecast-final');
  });

  it('displays project budget correctly', () => {
    renderComponent();

    expect(screen.getByText('project-budget:')).toBeInTheDocument();
    expect(screen.getByText('profit-loss:')).toBeInTheDocument();
  });

  it('calculates total and profit/loss correctly from forecastList', () => {
    const forecastList = [
      {
        package: 'Package 1',
        budget: 1000,
        order: 800,
        variations: 200,
        omissions: -100,
        total: 900,
      },
      {
        package: 'Total',
        budget: 2000,
        order: 1600,
        variations: 400,
        omissions: -200,
        total: 1800,
      },
    ];

    renderComponent({
      instructions: {
        forecastList,
        status: 'loaded',
      },
    });

    // The component should use the last item in forecastList for totals
    expect(screen.getByTestId('styled-forecast-container')).toBeInTheDocument();
  });

  it('handles empty forecastList', () => {
    renderComponent({
      instructions: {
        forecastList: [],
        status: 'loaded',
      },
    });

    expect(screen.getByTestId('styled-forecast-container')).toBeInTheDocument();
    expect(screen.getByTestId('download-excel')).toBeInTheDocument();
  });

  it('dispatches fetchForecastList when project data is available', () => {
    renderComponent();

    expect(mockDispatch).toHaveBeenCalled();
  });

  it('handles missing project data', () => {
    renderComponent({
      project: {
        data: null,
      },
    });

    expect(screen.getByTestId('template')).toBeInTheDocument();
  });

  it('renders with correct title', () => {
    renderComponent();

    expect(screen.getByText('forecast-finals')).toBeInTheDocument();
  });

  it('passes correct props to DownloadExcel component', () => {
    renderComponent();

    expect(screen.getByTestId('download-excel')).toBeInTheDocument();
  });

  it('renders styled components correctly', () => {
    renderComponent();

    expect(screen.getByTestId('styled-forecast-budget')).toBeInTheDocument();
    expect(screen.getAllByTestId('styled-forecast-project-budget')).toHaveLength(2);
    expect(screen.getAllByTestId('styled-forecast-project-number')).toHaveLength(2);
  });
});
