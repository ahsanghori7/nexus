import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import tabs from './tabs';

// Mock the DataTable component
jest.mock('v2/apps/admin/DataTable', () => {
  return function MockDataTable(props) {
    return (
      <div 
        data-testid="mock-data-table"
        data-id={props.id || ''}
        data-context-type={props.contextType || ''}
        data-data-type={props.dataType || ''}
        data-table={props.table || ''}
      >
        Mock DataTable
      </div>
    );
  };
});

// Mock useParams hook
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

describe('tabs component', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ accountId: '123' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing and return array of tab objects', () => {
    const contextType = 'test-context';
    const totalEnquiries = 5;
    const totalQuotes = 10;

    const result = tabs(contextType, totalEnquiries, totalQuotes);

    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('id', 0);
    expect(result[0]).toHaveProperty('label', 'engagement');
    expect(result[0]).toHaveProperty('content');
  });

  it('should render engagement tab content correctly', () => {
    const contextType = 'clink';
    const totalEnquiries = 15;
    const totalQuotes = 25;

    const result = tabs(contextType, totalEnquiries, totalQuotes);
    const engagementTab = result[0];

    // Render the content within a router context
    render(
      <MemoryRouter>
        {engagementTab.content}
      </MemoryRouter>
    );

    // Check for enquiries count
    expect(screen.getByText(/enquiries_sent/i)).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    // Check for orders count
    expect(screen.getByText(/orders_sent/i)).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();

    // Check DataTable is rendered with correct props
    const dataTable = screen.getByTestId('mock-data-table');
    expect(dataTable).toBeInTheDocument();
    expect(dataTable).toHaveAttribute('data-id', '123');
    expect(dataTable).toHaveAttribute('data-context-type', 'clink');
    expect(dataTable).toHaveAttribute('data-data-type', 'engagement');
    expect(dataTable).toHaveAttribute('data-table', 'account');
  });

  it('should handle default parameters correctly', () => {
    const result = tabs('default-context');

    // Render the content to check default values
    render(
      <MemoryRouter>
        {result[0].content}
      </MemoryRouter>
    );

    // Should use default values of 0 for enquiries and quotes
    const enquiriesText = screen.getByText(/enquiries_sent/i).parentElement;
    const ordersText = screen.getByText(/orders_sent/i).parentElement;
    
    expect(enquiriesText).toHaveTextContent('0');
    expect(ordersText).toHaveTextContent('0');
  });

  it('should use accountId from params in DataTable', () => {
    mockUseParams.mockReturnValue({ accountId: '456' });
    
    const result = tabs('test-context', 1, 2);

    render(
      <MemoryRouter>
        {result[0].content}
      </MemoryRouter>
    );

    const dataTable = screen.getByTestId('mock-data-table');
    expect(dataTable).toHaveAttribute('data-id', '456');
  });

  it('should handle missing accountId in params', () => {
    mockUseParams.mockReturnValue({});
    
    const result = tabs('test-context', 1, 2);

    render(
      <MemoryRouter>
        {result[0].content}
      </MemoryRouter>
    );

    const dataTable = screen.getByTestId('mock-data-table');
    expect(dataTable).toHaveAttribute('data-id', '');
  });
});