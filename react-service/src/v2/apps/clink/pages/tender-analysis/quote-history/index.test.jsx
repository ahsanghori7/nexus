import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuoteHistory from './index';

// Mock dependencies
jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: jest.fn((value) => value.toString()),
  currencyConfig: {
    USD: { symbol: '$', decimal: '.', thousand: ',' },
    EUR: { symbol: '€', decimal: '.', thousand: ',' },
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

jest.mock('moment', () => {
  const mockMoment = jest.fn((date) => ({
    format: jest.fn((format) => '01/01/2023 10:30:00'),
  }));
  return mockMoment;
});

jest.mock('v2/apps/shared/components/boq/Table', () => {
  return function MockTable({ Columns, items, Body, actions }) {
    return (
      <div data-testid="mock-table">
        <div data-testid="table-columns">{JSON.stringify(Columns)}</div>
        <div data-testid="table-items">{JSON.stringify(items)}</div>
        <div data-testid="table-body">{JSON.stringify(Body)}</div>
        <div data-testid="table-actions">{JSON.stringify(actions)}</div>
      </div>
    );
  };
});

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('v2/apps/shared/components/boq/quote-history-config', () => ({
  __esModule: true,
  default: function MockQuoteHistoryTableRows() {
    return <div data-testid="quote-history-rows" />;
  },
  Columns: ['column1', 'column2', 'column3'],
}));

describe('QuoteHistory', () => {
  const mockData = [
    {
      created_at: '2023-01-01T10:30:00Z',
      version: 1,
      sections: {
        quotation_price: 10000,
        measured_work: 8000,
        prelims: 1500,
        other_items: 500,
        weeks: { text: '12' },
      },
    },
    {
      created_at: '2023-01-15T14:45:00Z',
      version: 2,
      sections: {
        quotation_price: 12000,
        measured_work: 9000,
        prelims: 2000,
        other_items: 1000,
        weeks: { text: '10' },
      },
    },
  ];

  const mockEntity = { id: 1, name: 'Test Entity' };
  const mockSubcontractor = { id: 2, name: 'Test Subcontractor' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders quote history title', () => {
    render(<QuoteHistory data={[]} />);
    
    expect(screen.getByText('quote-history')).toBeInTheDocument();
  });

  it('renders table with correct props', () => {
    render(<QuoteHistory data={mockData} entity={mockEntity} subcontractor={mockSubcontractor} />);
    
    expect(screen.getByTestId('mock-table')).toBeInTheDocument();
    expect(screen.getByTestId('table-actions')).toHaveTextContent('false');
  });

  it('processes data correctly and creates table rows', () => {
    render(<QuoteHistory data={mockData} entity={mockEntity} subcontractor={mockSubcontractor} />);
    
    const tableItems = JSON.parse(screen.getByTestId('table-items').textContent);
    
    expect(tableItems).toHaveLength(2);
    expect(tableItems[0]).toMatchObject({
      id: 'mock-uuid-123',
      entity: mockEntity,
      subcontractor: mockSubcontractor,
      version: 1,
      date: '01/01/2023 10:30:00',
      price: '10000',
      work: '8000',
      prelims: '1500',
      sums: '500',
      weeks: '12',
    });
    expect(tableItems[1]).toMatchObject({
      version: 2,
      price: '12000',
      work: '9000',
      prelims: '2000',
      sums: '1000',
      weeks: '10',
    });
  });

  it('handles empty data array', () => {
    render(<QuoteHistory data={[]} />);
    
    const tableItems = JSON.parse(screen.getByTestId('table-items').textContent);
    expect(tableItems).toHaveLength(0);
  });

  it('handles missing data prop', () => {
    render(<QuoteHistory />);
    
    const tableItems = JSON.parse(screen.getByTestId('table-items').textContent);
    expect(tableItems).toHaveLength(0);
  });

  it('handles data with missing sections', () => {
    const dataWithMissingSections = [
      {
        created_at: '2023-01-01T10:30:00Z',
        version: 1,
        sections: null,
      },
    ];

    render(<QuoteHistory data={dataWithMissingSections} />);
    
    const tableItems = JSON.parse(screen.getByTestId('table-items').textContent);
    expect(tableItems).toHaveLength(1);
    expect(tableItems[0]).toMatchObject({
      version: 1,
      date: '01/01/2023 10:30:00',
      price: 'N/A',
      work: 'N/A',
      prelims: 'N/A',
      sums: 'N/A',
      weeks: 'N/A',
    });
  });

  it('handles data with missing created_at', () => {
    const dataWithMissingDate = [
      {
        version: 1,
        sections: {
          quotation_price: 5000,
        },
      },
    ];

    render(<QuoteHistory data={dataWithMissingDate} />);
    
    const tableItems = JSON.parse(screen.getByTestId('table-items').textContent);
    expect(tableItems[0].date).toBe('N/A');
  });

  it('handles partial sections data', () => {
    const dataWithPartialSections = [
      {
        created_at: '2023-01-01T10:30:00Z',
        version: 1,
        sections: {
          quotation_price: 5000,
          measured_work: 4000,
          // Missing prelims, other_items, weeks
        },
      },
    ];

    render(<QuoteHistory data={dataWithPartialSections} />);
    
    const tableItems = JSON.parse(screen.getByTestId('table-items').textContent);
    expect(tableItems[0]).toMatchObject({
      price: '5000',
      work: '4000',
      prelims: 'N/A',
      sums: 'N/A',
      weeks: 'N/A',
    });
  });

  it('handles weeks without text property', () => {
    const dataWithWeeksNumber = [
      {
        created_at: '2023-01-01T10:30:00Z',
        version: 1,
        sections: {
          quotation_price: 5000,
          weeks: null,
        },
      },
    ];

    render(<QuoteHistory data={dataWithWeeksNumber} />);
    
    const tableItems = JSON.parse(screen.getByTestId('table-items').textContent);
    expect(tableItems[0].weeks).toBe('N/A');
  });

  it('renders with default empty props', () => {
    render(<QuoteHistory />);
    
    expect(screen.getByText('quote-history')).toBeInTheDocument();
    expect(screen.getByTestId('mock-table')).toBeInTheDocument();
  });

  it('passes correct columns to table', () => {
    render(<QuoteHistory data={mockData} />);
    
    const tableColumns = JSON.parse(screen.getByTestId('table-columns').textContent);
    expect(tableColumns).toEqual(['column1', 'column2', 'column3']);
  });

  it('generates unique IDs for each row', () => {
    const { v4: uuidv4 } = require('uuid');
    uuidv4.mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2');

    render(<QuoteHistory data={mockData} />);
    
    const tableItems = JSON.parse(screen.getByTestId('table-items').textContent);
    expect(tableItems[0].id).toBe('uuid-1');
    expect(tableItems[1].id).toBe('uuid-2');
  });
});