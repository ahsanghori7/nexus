import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Logs from './index';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock clink-components Table component to allow testing callbacks
jest.mock('clink-components', () => ({
  Table: jest.fn(({ onChangeOrder, onPageChange, ...props }) => {
    // Store callbacks for testing
    global.mockTableCallbacks = { onChangeOrder, onPageChange };
    return (
      <div
        data-testid="table"
        rowsCount={props.rowsCount}
        initRowsPerPage={props.initRowsPerPage}
      >
        <div data-testid="table-content">
          Table with {props.rows.length} rows and {props.columns.length} columns
        </div>
        {props.pagination && (
          <div data-testid="table-pagination">
            Pagination: {props.rowsPerPageOptions?.join(', ') || 'default options'}
          </div>
        )}
      </div>
    );
  })
}));

describe('Logs Component', () => {
  const mockProps = {
    logs: {
      list: [
        {
          id: 1,
          action_date: '2024-10-30T10:00:00Z',
          action: 'User Login',
          user_id: 123,
          description: 'User logged into system',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 Chrome/129.0'
        },
        {
          id: 2,
          action_date: '2024-10-30T11:30:00Z',
          action: 'Data Export',
          user_id: 456,
          description: 'Exported user data',
          ip_address: '192.168.1.2',
          user_agent: 'Mozilla/5.0 Firefox/128.0'
        }
      ],
      listCount: 2
    },
    dispatch: jest.fn(),
    params: { term: 'test' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.mockTableCallbacks = {};
  });

  test('renders without crashing', () => {
    render(<Logs {...mockProps} />);
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  test('displays table with correct data', () => {
    render(<Logs {...mockProps} />);
    
    const table = screen.getByTestId('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute('rowsCount', '2');
    expect(table).toHaveAttribute('initRowsPerPage', '20');
  });

  test('calls fetchLogs on mount', () => {
    const mockDispatch = jest.fn();
    const props = {
      ...mockProps,
      dispatch: mockDispatch
    };

    render(<Logs {...props} />);
    
    expect(mockDispatch).toHaveBeenCalled();
  });

  test('handles empty logs list', () => {
    const emptyProps = {
      ...mockProps,
      logs: {
        list: [],
        listCount: 0
      }
    };

    render(<Logs {...emptyProps} />);
    
    const table = screen.getByTestId('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute('rowsCount', '0');
  });

  test('handles missing params', () => {
    const noParamsProps = {
      ...mockProps,
      params: undefined
    };

    render(<Logs {...noParamsProps} />);
    
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  test('creates table with pagination options', () => {
    render(<Logs {...mockProps} />);
    
    const pagination = screen.getByTestId('table-pagination');
    expect(pagination).toBeInTheDocument();
    expect(pagination).toHaveTextContent('5, 10, 20, 50, 100');
  });

  test('onChangeOrder callback works correctly', () => {
    const mockDispatch = jest.fn();
    const props = {
      ...mockProps,
      dispatch: mockDispatch
    };

    render(<Logs {...props} />);
    
    // Get the onChangeOrder callback
    const { onChangeOrder } = global.mockTableCallbacks;
    
    // Clear the mount call
    mockDispatch.mockClear();
    
    // Test ascending sort
    onChangeOrder('action_date', false);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FETCH_LOGS'
      })
    );

    // Test descending sort
    mockDispatch.mockClear();
    onChangeOrder('action_date', true);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FETCH_LOGS'
      })
    );
  });

  test('onPageChange callback works correctly', () => {
    const mockDispatch = jest.fn();
    const props = {
      ...mockProps,
      dispatch: mockDispatch
    };

    render(<Logs {...props} />);
    
    // Get the onPageChange callback
    const { onPageChange } = global.mockTableCallbacks;
    
    // Clear the mount call
    mockDispatch.mockClear();
    
    // Test page change
    const pageSettings = { rowsPerPage: 50, page: 1 };
    onPageChange(pageSettings);
    
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FETCH_LOGS'
      })
    );
  });

  test('handles params with empty term', () => {
    const propsWithEmptyTerm = {
      ...mockProps,
      params: { term: '' }
    };

    render(<Logs {...propsWithEmptyTerm} />);
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  test('handles params with null term', () => {
    const propsWithNullTerm = {
      ...mockProps,
      params: { term: null }
    };

    render(<Logs {...propsWithNullTerm} />);
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  test('snapshot test', () => {
    const { container } = render(<Logs {...mockProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});