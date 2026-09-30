import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DataTable from './DataTable';

// Mock the hooks/context module
jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

// Mock react-redux connect to inject our mock dispatch
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  connect: (mapStateToProps) => (Component) => (props) => {
    const mockState = {
      opportunities: { list: [], status: { message: null } },
      activity: { list: [], status: { message: null } },
      user: {},
      engagement: { list: [], status: { message: null } },
      supply_chain: { list: [], status: { message: null } },
      ...props.mockState,
    };
    const mappedProps = mapStateToProps ? mapStateToProps(mockState) : {};
    return <Component {...props} {...mappedProps} dispatch={props.mockDispatch || jest.fn()} />;
  },
}));

// Mock the hooks/context module
jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

// Mock the clink-components Table
jest.mock('clink-components', () => ({
  Table: ({ columns = [], rows = [], pagination, rowsPerPageOptions }) => (
    <div data-testid="table">
      <div data-testid="table-content">
        Table with {rows.length} rows and {columns.length} columns
      </div>
      {pagination && (
        <div data-testid="table-pagination">
          Pagination: {rowsPerPageOptions?.join(', ') || 'default options'}
        </div>
      )}
    </div>
  ),
}));

// Mock the Loading component
jest.mock('v2/apps/shared/components/Loading', () => ({ status }) => (
  <div data-testid="loading-component">{status}</div>
));

// Mock @mui/material/Box
jest.mock('@mui/material/Box', () => ({ children, pt }) => (
  <div data-testid="box" style={{ paddingTop: pt }}>
    {children}
  </div>
));

// Import the mocked useContext after mocking
import { useContext } from 'hooks/context';

describe('DataTable', () => {
  let store;
  let mockDispatch;
  
  // Mock actions that return valid action objects
  const mockActions = {
    fetchActivities: jest.fn(() => ({ type: 'FETCH_ACTIVITIES' })),
    fetchOpportunitiesByAccount: jest.fn(() => ({ type: 'FETCH_OPPORTUNITIES' })),
    fetchEngagement: jest.fn(() => ({ type: 'FETCH_ENGAGEMENT' })),
    fetchAdminSupplyChain: jest.fn(() => ({ type: 'FETCH_SUPPLY_CHAIN' })),
  };

  // Default mock context
  const defaultContext = {
    actions: mockActions,
    account: {
      activity: [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'name', headerName: 'Name', width: 150 },
      ],
      opportunities: [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'title', headerName: 'Title', width: 200 },
      ],
      engagement: [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'type', headerName: 'Type', width: 120 },
      ],
      engagement_projects: [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'project', headerName: 'Project', width: 150 },
      ],
      supply_chain: [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'supplier', headerName: 'Supplier', width: 180 },
      ],
    },
  };

  // Default props
  const defaultProps = {
    id: '123',
    contextType: 'admin',
    dataType: 'activity',
  };

  const createMockStore = (initialState = {}) => {
    const defaultState = {
      opportunities: { list: [], status: { message: null } },
      activity: { list: [], status: { message: null } },
      user: {},
      engagement: { list: [], status: { message: null } },
      supply_chain: { list: [], status: { message: null } },
      ...initialState,
    };
    
    return {
      getState: () => defaultState,
      dispatch: mockDispatch,
      subscribe: jest.fn(() => jest.fn()),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    useContext.mockReturnValue(defaultContext);
  });

  const renderWithProvider = (component, storeInstance = store) => {
    return render(
      <Provider store={storeInstance}>
        {component}
      </Provider>
    );
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const mockState = {
        activity: {
          list: [
            { id: 1, name: 'Activity 1' },
            { id: 2, name: 'Activity 2' },
          ],
          status: { message: null },
        },
      };
      
      render(<DataTable {...defaultProps} mockState={mockState} />);
      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('renders the table when no loading status', () => {
      const mockState = {
        activity: {
          list: [
            { id: 1, name: 'Activity 1' },
            { id: 2, name: 'Activity 2' },
          ],
          status: { message: null },
        },
      };
      
      render(<DataTable {...defaultProps} mockState={mockState} />);
      
      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getByTestId('table-content')).toHaveTextContent('Table with 2 rows and 2 columns');
      expect(screen.getByTestId('table-pagination')).toHaveTextContent('Pagination: 5, 10, 20, 50, 100');
    });

    it('renders loading component when status message exists', () => {
      const mockState = {
        activity: {
          list: [],
          status: { message: 'Loading activities...' },
        },
      };

      render(<DataTable {...defaultProps} mockState={mockState} />);
      
      expect(screen.getByTestId('loading-component')).toBeInTheDocument();
      expect(screen.getByTestId('loading-component')).toHaveTextContent('Loading activities...');
      expect(screen.queryByTestId('table')).not.toBeInTheDocument();
    });
  });

  describe('Data Type Handling', () => {
    it('dispatches fetchActivities for activity dataType', () => {
      const mockState = {
        activity: {
          list: [
            { id: 1, name: 'Activity 1' },
            { id: 2, name: 'Activity 2' },
          ],
          status: { message: null },
        },
      };
      
      render(<DataTable {...defaultProps} mockState={mockState} mockDispatch={mockDispatch} />);
      
      expect(mockActions.fetchActivities).toHaveBeenCalledWith('123');
      expect(mockDispatch).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'FETCH_ACTIVITIES' });
    });

    it('dispatches fetchOpportunitiesByAccount for opportunities dataType', () => {
      const opportunitiesProps = {
        ...defaultProps,
        dataType: 'opportunities',
      };
      
      const mockState = {
        opportunities: {
          list: [{ id: 1, title: 'Opportunity 1' }],
          status: { message: null },
        },
      };

      render(<DataTable {...opportunitiesProps} mockState={mockState} mockDispatch={mockDispatch} />);
      
      expect(mockActions.fetchOpportunitiesByAccount).toHaveBeenCalledWith('123');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'FETCH_OPPORTUNITIES' });
    });

    it('dispatches fetchEngagement for engagement dataType', () => {
      const engagementProps = {
        ...defaultProps,
        dataType: 'engagement',
      };
      
      const mockState = {
        engagement: {
          list: [{ id: 1, type: 'Meeting' }],
          status: { message: null },
        },
      };

      render(<DataTable {...engagementProps} mockState={mockState} mockDispatch={mockDispatch} />);
      
      expect(mockActions.fetchEngagement).toHaveBeenCalledWith({ aid: '123', typeData: '' });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'FETCH_ENGAGEMENT' });
    });

    it('dispatches fetchEngagement with table parameter for engagement dataType with table', () => {
      const engagementProps = {
        ...defaultProps,
        dataType: 'engagement',
        table: 'projects',
      };
      
      const mockState = {
        engagement: {
          list: [{ id: 1, project: 'Project 1' }],
          status: { message: null },
        },
      };

      render(<DataTable {...engagementProps} mockState={mockState} mockDispatch={mockDispatch} />);
      
      expect(mockActions.fetchEngagement).toHaveBeenCalledWith({ aid: '123', typeData: 'projects' });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'FETCH_ENGAGEMENT' });
    });

    it('dispatches fetchAdminSupplyChain for supply_chain dataType', () => {
      const supplyChainProps = {
        ...defaultProps,
        dataType: 'supply_chain',
      };
      
      const mockState = {
        supply_chain: {
          list: [{ id: 1, supplier: 'Supplier 1' }],
          status: { message: null },
        },
      };

      render(<DataTable {...supplyChainProps} mockState={mockState} mockDispatch={mockDispatch} />);
      
      expect(mockActions.fetchAdminSupplyChain).toHaveBeenCalledWith('123');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'FETCH_SUPPLY_CHAIN' });
    });

    it('does not dispatch any action for unknown dataType', () => {
      const unknownProps = {
        ...defaultProps,
        dataType: 'unknown',
        // Provide empty unknown state to prevent destructuring error
        unknown: {
          list: [],
          status: { message: null },
        },
      };
      
      const mockState = {
        activity: {
          list: [],
          status: { message: null },
        },
      };

      const contextWithUnknownColumns = {
        ...defaultContext,
        account: {
          ...defaultContext.account,
          unknown: [], // Empty columns for unknown type
        },
      };
      
      useContext.mockReturnValue(contextWithUnknownColumns);

      render(<DataTable {...unknownProps} mockState={mockState} mockDispatch={mockDispatch} />);
      
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('Column Selection', () => {
    it('uses correct columns for dataType without table', () => {
      const mockState = {
        activity: {
          list: [
            { id: 1, name: 'Activity 1' },
            { id: 2, name: 'Activity 2' },
          ],
          status: { message: null },
        },
      };
      
      render(<DataTable {...defaultProps} mockState={mockState} />);
      
      // The columns should be activity columns from context (2 columns)
      expect(screen.getByTestId('table-content')).toHaveTextContent('Table with 2 rows and 2 columns');
    });

    it('uses correct columns for dataType with table suffix', () => {
      const contextWithTableColumns = {
        ...defaultContext,
        account: {
          ...defaultContext.account,
          engagement_projects: [
            { field: 'id', headerName: 'ID', width: 90 },
            { field: 'project', headerName: 'Project', width: 150 },
            { field: 'status', headerName: 'Status', width: 120 },
          ],
        },
      };
      
      useContext.mockReturnValue(contextWithTableColumns);

      const propsWithTable = {
        ...defaultProps,
        dataType: 'engagement',
        table: 'projects',
      };
      
      const mockState = {
        engagement: {
          list: [{ id: 1, project: 'Project 1' }],
          status: { message: null },
        },
      };

      render(<DataTable {...propsWithTable} mockState={mockState} />);
      
      // Should use engagement_projects columns (3 columns)
      expect(screen.getByTestId('table-content')).toHaveTextContent('Table with 1 rows and 3 columns');
    });
  });

  describe('Table Properties', () => {
    it('passes correct props to Table component', () => {
      const mockState = {
        activity: {
          list: [
            { id: 1, name: 'Activity 1' },
            { id: 2, name: 'Activity 2' },
          ],
          status: { message: null },
        },
      };
      
      render(<DataTable {...defaultProps} mockState={mockState} />);
      
      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
      
      const pagination = screen.getByTestId('table-pagination');
      expect(pagination).toHaveTextContent('5, 10, 20, 50, 100');
    });

    it('handles empty list data', () => {
      const mockState = {
        activity: {
          list: [],
          status: { message: null },
        },
      };

      render(<DataTable {...defaultProps} mockState={mockState} />);
      
      expect(screen.getByTestId('table-content')).toHaveTextContent('Table with 0 rows and 2 columns');
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for normal state', () => {
      const mockState = {
        activity: {
          list: [
            { id: 1, name: 'Activity 1' },
            { id: 2, name: 'Activity 2' },
          ],
          status: { message: null },
        },
      };
      
      const { container } = render(<DataTable {...defaultProps} mockState={mockState} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for loading state', () => {
      const mockState = {
        activity: {
          list: [],
          status: { message: 'Loading...' },
        },
      };

      const { container } = render(<DataTable {...defaultProps} mockState={mockState} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});