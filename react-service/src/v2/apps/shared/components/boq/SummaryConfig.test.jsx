import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SummaryConfig, { Columns } from './SummaryConfig';

// Mock dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    if (key === 'currency') return 'GBP';
    return key;
  }),
}));

jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: jest.fn((amount, config) => `£${amount.toLocaleString()}`),
  currencyConfig: {
    GBP: { symbol: '£', locale: 'en-GB' },
    USD: { symbol: '$', locale: 'en-US' },
  },
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkPurple: '#6B46C1',
        christmasSilver: '#CCCCCC',
      },
    },
  },
}));

jest.mock('@mui/material/TableRow', () => ({ children, ...props }) => (
  <tr {...props}>{children}</tr>
));

jest.mock('@mui/material/TableCell', () => ({ children, ...props }) => (
  <td {...props}>{children}</td>
));

describe('SummaryConfig', () => {
  const mockRows = [
    {
      id: 1,
      label: 'Package 1',
      budget: 10000,
      status: 1,
    },
    {
      id: 2,
      label: 'Package 2',
      budget: 25000,
      status: 3,
    },
    {
      id: 3,
      label: 'Package 3',
      budget: 15000,
      status: 6,
    },
  ];

  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderWithinTable = (ui) =>
    render(
      <table>
        <tbody>{ui}</tbody>
      </table>
    );

  it('renders without crashing', () => {
    renderWithinTable(<SummaryConfig rows={mockRows} navigate={mockNavigate} />);
    // Should render table rows
    expect(screen.getAllByRole('row')).toHaveLength(4); // 3 data rows + 1 summary row
  });

  it('renders all package rows correctly', () => {
    renderWithinTable(<SummaryConfig rows={mockRows} navigate={mockNavigate} />);
    
    // Check package labels
    expect(screen.getByText('Package 1')).toBeInTheDocument();
    expect(screen.getByText('Package 2')).toBeInTheDocument();
    expect(screen.getByText('Package 3')).toBeInTheDocument();

    // Check package numbers (1-indexed)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays status text correctly', () => {
    renderWithinTable(<SummaryConfig rows={mockRows} navigate={mockNavigate} />);
    
    expect(screen.getByText('Initialized')).toBeInTheDocument(); // status 1
    expect(screen.getByText('Published')).toBeInTheDocument(); // status 3
    expect(screen.getByText('Tendered')).toBeInTheDocument(); // status 6
  });

  it('displays formatted budget amounts', () => {
    renderWithinTable(<SummaryConfig rows={mockRows} navigate={mockNavigate} />);
    
    expect(screen.getByText('£10,000')).toBeInTheDocument();
    expect(screen.getByText('£25,000')).toBeInTheDocument();
    expect(screen.getByText('£15,000')).toBeInTheDocument();
  });

  it('calculates and displays total budget', () => {
    renderWithinTable(<SummaryConfig rows={mockRows} navigate={mockNavigate} />);
    
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('£50,000')).toBeInTheDocument(); // 10000 + 25000 + 15000
  });

  it('calls navigate when package label is clicked', () => {
    renderWithinTable(<SummaryConfig rows={mockRows} navigate={mockNavigate} />);
    
    const package1Label = screen.getByText('Package 1');
    fireEvent.click(package1Label);
    
    expect(mockNavigate).toHaveBeenCalledWith(mockRows[0].tid);
  });

  it('calls navigate with correct row id when different packages are clicked', () => {
    renderWithinTable(<SummaryConfig rows={mockRows} navigate={mockNavigate} />);
    
    const package2Label = screen.getByText('Package 2');
    fireEvent.click(package2Label);
    
    expect(mockNavigate).toHaveBeenCalledWith(mockRows[1].tid);

    const package3Label = screen.getByText('Package 3');
    fireEvent.click(package3Label);
    
    expect(mockNavigate).toHaveBeenCalledWith(mockRows[2].tid);
  });

  it('handles empty rows array', () => {
    renderWithinTable(<SummaryConfig rows={[]} navigate={mockNavigate} />);
    
    expect(screen.getByRole('row')).toBeInTheDocument(); // Only summary row
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('£0')).toBeInTheDocument();
  });

  it('handles missing navigate prop', () => {
    renderWithinTable(<SummaryConfig rows={mockRows} />);
    
    const package1Label = screen.getByText('Package 1');
    // Should not throw error when clicked
    expect(() => fireEvent.click(package1Label)).not.toThrow();
  });

  it('handles all status types correctly', () => {
    const statusTestRows = [
      { id: 1, label: 'Draft Package', budget: 1000, status: 2 },
      { id: 2, label: 'Deleted Package', budget: 1000, status: 4 },
      { id: 3, label: 'Archived Package', budget: 1000, status: 5 },
      { id: 4, label: 'Unknown Status Package', budget: 1000, status: 99 },
    ];

    renderWithinTable(<SummaryConfig rows={statusTestRows} navigate={mockNavigate} />);
    
    expect(screen.getByText('Draft')).toBeInTheDocument(); // status 2
    expect(screen.getByText('Deleted')).toBeInTheDocument(); // status 4
    expect(screen.getByText('Archived')).toBeInTheDocument(); // status 5
    expect(screen.getByText('Unknown')).toBeInTheDocument(); // status 99
  });

  it('handles zero budget amounts', () => {
    const zeroRows = [
      { id: 1, label: 'Zero Package', budget: 0, status: 1 },
    ];

    renderWithinTable(<SummaryConfig rows={zeroRows} navigate={mockNavigate} />);
    
    // Should find £0 in the budget column (first occurrence)
    const budgetCells = screen.getAllByText('£0');
    expect(budgetCells.length).toBeGreaterThan(0);
  });

  it('handles decimal budget amounts', () => {
    const decimalRows = [
      { id: 1, label: 'Decimal Package', budget: 1234.56, status: 1 },
    ];

    renderWithinTable(<SummaryConfig rows={decimalRows} navigate={mockNavigate} />);
    
    // Check that the formatted budget appears (both in row and total)
    const budgetElements = screen.getAllByText('£1,234.56');
    expect(budgetElements.length).toBe(2); // Row budget + total budget
  });
});

describe('Columns', () => {
  it('renders all column headers', () => {
    render(
      <table>
        <thead>
          <tr>
            <Columns />
          </tr>
        </thead>
      </table>
    );

    expect(screen.getByText('Package number')).toBeInTheDocument();
    expect(screen.getByText('Package Title')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders columns in correct order', () => {
    render(
      <table>
        <thead>
          <tr>
            <Columns />
          </tr>
        </thead>
      </table>
    );

    // Use cell role instead of columnheader since MUI renders them as TableCell
    const cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Package number');
    expect(cells[1]).toHaveTextContent('Package Title');
    expect(cells[2]).toHaveTextContent('Budget');
    expect(cells[3]).toHaveTextContent('Status');
  });
});
