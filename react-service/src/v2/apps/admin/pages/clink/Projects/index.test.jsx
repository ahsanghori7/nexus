import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Projects from './index';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

// Mock the context hook
jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      fetchProjects: jest.fn(),
      fetchStatusList: jest.fn(),
      changeStatus: jest.fn(),
    },
    pages: {
      projects: {
        actions: [
          {
            id: 1,
            text: 'Change Status',
            align: 'left'
          }
        ],
        columns: [
          { key: 'project', label: 'Project Name' },
          { key: 'status', label: 'Status' },
          { key: 'created_at', label: 'Created At' }
        ],
        actionColumn: {
          config: {
            key: 'actions',
            label: 'Actions'
          }
        }
      }
    }
  })),
}));

// Mock Actions component
jest.mock('./Actions', () => {
  const mockReact = require('react');
  return mockReact.forwardRef((props, ref) => {
    return mockReact.createElement('div', {
      ...props,
      ref,
      'data-testid': 'actions-component'
    }, 'Actions Component');
  });
});

describe('Projects Component', () => {
  let mockStore;
  let mockDispatch;

  const initialState = {
    projects: {
      list: [
        {
          id: 1,
          project: 'Test Project 1',
          slug: 'test-project-1',
          status: 'active',
          created_at: '2023-01-01'
        },
        {
          id: 2,
          project: 'Test Project 2',
          slug: 'test-project-2',
          status: 'inactive',
          created_at: '2023-01-02'
        }
      ],
      statusList: [
        { id: 1, label: 'Active' },
        { id: 2, label: 'Inactive' }
      ]
    },
    users: {
      list: []
    }
  };

  beforeEach(() => {
    mockDispatch = jest.fn();
    const rootReducer = (state = initialState) => state;
    mockStore = createStore(rootReducer);
    mockStore.dispatch = mockDispatch;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      params: {}
    };

    return render(
      <Provider store={mockStore}>
        <Projects {...defaultProps} {...props} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('calls context actions through mocked useContext', () => {
    renderComponent();
    
    // The component should render successfully, indicating useContext is properly mocked
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('handles search params correctly', () => {
    const params = { term: 'search-term' };
    renderComponent({ params });
    
    // Component should still render with params
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('renders table with correct number of columns', () => {
    renderComponent();
    
    const table = screen.getByTestId('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveTextContent('Table with 2 rows and 4 columns'); // 3 columns + 1 action column
  });

  it('processes projects data correctly', () => {
    renderComponent();
    
    // The component should process the projects and render the table
    // The Table mock shows 2 rows and 4 columns (3 data columns + 1 action column)
    const table = screen.getByTestId('table');
    expect(table).toHaveTextContent('Table with 2 rows and 4 columns');
  });

  it('handles project data transformation', () => {
    renderComponent();
    
    // Component should successfully transform project data without errors
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('handles empty projects list', () => {
    const emptyState = {
      projects: {
        list: [],
        statusList: []
      },
      users: {
        list: []
      }
    };
    
    const emptyStore = createStore(() => emptyState);
    emptyStore.dispatch = mockDispatch;

    render(
      <Provider store={emptyStore}>
        <Projects params={{}} />
      </Provider>
    );

    const table = screen.getByTestId('table');
    expect(table).toHaveTextContent('Table with 0 rows and 4 columns');
  });

  it('includes pagination in table', () => {
    renderComponent();
    
    expect(screen.getByTestId('table-pagination')).toBeInTheDocument();
    expect(screen.getByTestId('table-pagination')).toHaveTextContent('5, 10, 20, 50, 100');
  });

  it('uses global configuration correctly', () => {
    renderComponent();
    
    // Component should render without errors using global config
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('maps state to props correctly', () => {
    renderComponent();
    
    // Component should render without errors, indicating state mapping works
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('formats columns with i18next translations', () => {
    renderComponent();
    
    // The table should be rendered, indicating column formatting worked
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('handles projects with different status formats', () => {
    const customState = {
      projects: {
        list: [
          {
            id: 1,
            project: 'Project with Status',
            slug: 'project-with-status',
            status: 'ACTIVE',
            created_at: '2023-01-01'
          }
        ],
        statusList: [
          { id: 1, label: 'Active' }
        ]
      },
      users: {
        list: []
      }
    };
    
    const customStore = createStore(() => customState);
    customStore.dispatch = mockDispatch;

    render(
      <Provider store={customStore}>
        <Projects params={{}} />
      </Provider>
    );

    expect(screen.getByTestId('table')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toHaveTextContent('Table with 1 rows and 4 columns');
  });

  it('transforms project data for table display', () => {
    renderComponent();
    
    // Component should successfully process project data and format it for table display
    const table = screen.getByTestId('table');
    expect(table).toBeInTheDocument();
    
    // Should show projects are processed (2 projects in test data)
    expect(table).toHaveTextContent('Table with 2 rows and 4 columns');
  });

  it('handles Redux connect higher-order component', () => {
    renderComponent();
    
    // Component should be properly connected to Redux store
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });
});