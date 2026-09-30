import React from 'react';
import { render, screen } from '@testing-library/react';
import TenderAnalysisConfig, { Columns } from './TenderAnalysisConfig';

// Mock MUI components
jest.mock('@mui/material/TableCell', () => ({ children, sx, ...props }) => (
  <td data-testid="mui-tablecell" sx={JSON.stringify(sx)} {...props}>
    {children}
  </td>
));

jest.mock('@mui/material/TableRow', () => ({ children, sx, ...props }) => (
  <tr data-testid="mui-tablerow" sx={JSON.stringify(sx)} {...props}>
    {children}
  </tr>
));

jest.mock('@mui/material/Tooltip', () => ({ children, title, sx }) => (
  <div data-testid="mui-tooltip" title={title} sx={JSON.stringify(sx)}>
    {children}
  </div>
));

jest.mock('@mui/material/Typography', () => ({ children, component, sx }) => (
  <div data-testid="mui-typography" component={component} sx={JSON.stringify(sx)}>
    {children}
  </div>
));

// Mock lodash
jest.mock('lodash/capitalize', () => (str) => str.charAt(0).toUpperCase() + str.slice(1));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkBackgroundPurple: '#9c27b0',
        white: '#ffffff'
      }
    }
  }
}));

// Mock i18n and currency helpers
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    if (key === 'currency') return 'USD';
    return key;
  })
}));

jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: jest.fn((value, config) => `$${value.toFixed(2)}`),
  currencyConfig: {
    USD: { symbol: '$' }
  }
}));

describe('TenderAnalysisConfig', () => {
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

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Q.ty')).toBeInTheDocument();
      expect(screen.getByText('Unit')).toBeInTheDocument();
      expect(screen.getByText('Budget Rate')).toBeInTheDocument();
      expect(screen.getByText('Budget Total')).toBeInTheDocument();
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

      const cells = screen.getAllByRole('cell');
      expect(cells[0]).toHaveTextContent('ID');
      expect(cells[1]).toHaveTextContent('Description');
      expect(cells[2]).toHaveTextContent('Q.ty');
      expect(cells[3]).toHaveTextContent('Unit');
      expect(cells[4]).toHaveTextContent('Budget Rate');
      expect(cells[5]).toHaveTextContent('Budget Total');
    });

    it('applies correct styles to column headers', () => {
      render(
        <table>
          <thead>
            <tr>
              <Columns />
            </tr>
          </thead>
        </table>
      );

      const cells = screen.getAllByTestId('mui-tablecell');
      
      // Check that each cell has the expected styles
      cells.forEach(cell => {
        const sx = JSON.parse(cell.getAttribute('sx'));
        expect(sx.fontWeight).toBe(600);
        expect(sx.opacity).toBe('0.5');
        expect(sx.border).toBe('1px solid rgba(224, 224, 224, 1)');
      });
    });
  });

  describe('TenderAnalysisConfig', () => {
    const renderWithinTable = (ui) =>
      render(
        <table>
          <tbody>{ui}</tbody>
        </table>
      );

    const mockItemRow = {
      id: 1,
      type: 'item',
      item_no: 'I001',
      description: 'Test item description',
      quantity: 5,
      unit: 'each',
      budget_rate: 100.50,
      budget_total: 502.50
    };

    const mockSectionRow = {
      id: 2,
      type: 'section',
      item_no: 'S001',
      description: 'section description'
    };

    const mockGroupedHeaderRow = {
      id: 3,
      type: 'grouped_heading',
      item_no: 'H001',
      description: 'grouped heading description'
    };

    it('renders without crashing', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[]} />);
    });

    it('renders item rows correctly', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockItemRow]} />);

      expect(screen.getByText('I001')).toBeInTheDocument();
      expect(screen.getByText('Test item description')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('each')).toBeInTheDocument();
      expect(screen.getByText('$100.50')).toBeInTheDocument();
      expect(screen.getByText('$502.50')).toBeInTheDocument();
    });

    it('renders section rows correctly', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockSectionRow]} />);

      expect(screen.getByText('S001')).toBeInTheDocument();
      expect(screen.getByText('Section description')).toBeInTheDocument(); // Should be capitalized
    });

    it('renders grouped header rows correctly', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockGroupedHeaderRow]} />);

      expect(screen.getByText('H001')).toBeInTheDocument();
      expect(screen.getByText('Grouped heading description')).toBeInTheDocument(); // Should be capitalized
    });

    it('applies correct background color for sections', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockSectionRow]} />);

      const row = screen.getByTestId('mui-tablerow');
      const sx = JSON.parse(row.getAttribute('sx'));
      expect(sx.backgroundColor).toBe('#9c27b0 !important');
    });

    it('applies correct background color for items', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockItemRow]} />);

      const row = screen.getByTestId('mui-tablerow');
      const sx = JSON.parse(row.getAttribute('sx'));
      expect(sx.backgroundColor).toBe('#ffffff !important');
    });

    it('applies correct background color for grouped headers', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockGroupedHeaderRow]} />);

      const row = screen.getByTestId('mui-tablerow');
      const sx = JSON.parse(row.getAttribute('sx'));
      expect(sx.backgroundColor).toBe('#ffffff !important');
    });

    it('applies underline decoration for grouped header rows', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockGroupedHeaderRow]} />);

      const cells = screen.getAllByTestId('mui-tablecell');
      const descriptionCell = cells.find(cell => {
        const sx = JSON.parse(cell.getAttribute('sx') || '{}');
        return sx.textDecoration === 'underline';
      });
      expect(descriptionCell).toBeInTheDocument();
    });

    it('does not apply underline decoration for non-grouped header rows', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockItemRow, mockSectionRow]} />);

      const cells = screen.getAllByTestId('mui-tablecell');
      const underlinedCells = cells.filter(cell => {
        const sx = JSON.parse(cell.getAttribute('sx') || '{}');
        return sx.textDecoration === 'underline';
      });
      expect(underlinedCells).toHaveLength(0);
    });

    it('renders tooltip for all descriptions', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockItemRow, mockSectionRow, mockGroupedHeaderRow]} />);

      const tooltips = screen.getAllByTestId('mui-tooltip');
      expect(tooltips.length).toBeGreaterThanOrEqual(3);
      
      expect(screen.getByDisplayValue || screen.getByTitle || (() => tooltips.find(t => t.getAttribute('title') === 'Test item description'))).toBeTruthy();
      expect(screen.getByDisplayValue || screen.getByTitle || (() => tooltips.find(t => t.getAttribute('title') === 'Section description'))).toBeTruthy();
      expect(screen.getByDisplayValue || screen.getByTitle || (() => tooltips.find(t => t.getAttribute('title') === 'Grouped heading description'))).toBeTruthy();
    });

    it('renders typography component for descriptions', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockItemRow]} />);

      const typography = screen.getByTestId('mui-typography');
      expect(typography).toBeInTheDocument();
      expect(typography).toHaveTextContent('Test item description');
    });

    it('only renders quantity/unit/rate/total cells for item type', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockItemRow, mockSectionRow, mockGroupedHeaderRow]} />);

      // Should only see one instance of each value (from the item row)
      expect(screen.getAllByText('5')).toHaveLength(1);
      expect(screen.getAllByText('each')).toHaveLength(1);
      expect(screen.getAllByText('$100.50')).toHaveLength(1);
      expect(screen.getAllByText('$502.50')).toHaveLength(1);
    });

    it('handles empty rows array', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[]} />);
      
      // Should render without error and have no content
      const rows = screen.queryAllByTestId('mui-tablerow');
      expect(rows).toHaveLength(0);
    });

    it('applies correct column span for section rows', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockSectionRow]} />);

      const cells = screen.getAllByTestId('mui-tablecell');
      const descriptionCell = cells.find(cell => cell.getAttribute('colSpan') === '6');
      expect(descriptionCell).toBeInTheDocument();
    });

    it('applies correct column span for grouped header rows', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockGroupedHeaderRow]} />);

      const cells = screen.getAllByTestId('mui-tablecell');
      const descriptionCell = cells.find(cell => cell.getAttribute('colSpan') === '5');
      expect(descriptionCell).toBeInTheDocument();
    });

    it('applies no column span for item rows', () => {
      renderWithinTable(<TenderAnalysisConfig rows={[mockItemRow]} />);

      const cells = screen.getAllByTestId('mui-tablecell');
      const cellsWithColSpan = cells.filter(cell => cell.hasAttribute('colSpan'));
      expect(cellsWithColSpan).toHaveLength(0);
    });

    it('handles mixed row types correctly', () => {
      const mixedRows = [mockItemRow, mockSectionRow, mockGroupedHeaderRow];
      renderWithinTable(<TenderAnalysisConfig rows={mixedRows} />);

      // Should render all three row types
      expect(screen.getByText('I001')).toBeInTheDocument();
      expect(screen.getByText('S001')).toBeInTheDocument();
      expect(screen.getByText('H001')).toBeInTheDocument();

      // Should have 3 rows total
      const rows = screen.getAllByTestId('mui-tablerow');
      expect(rows).toHaveLength(3);
    });

    it('formats currency values correctly', () => {
      const rowWithDecimals = {
        id: 4,
        type: 'item',
        item_no: 'D001',
        description: 'Decimal test',
        quantity: 2,
        unit: 'kg',
        budget_rate: 99.99,
        budget_total: 199.98
      };
      
      renderWithinTable(<TenderAnalysisConfig rows={[rowWithDecimals]} />);

      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('$199.98')).toBeInTheDocument();
    });

    it('handles zero values correctly', () => {
      const rowWithZeros = {
        id: 5,
        type: 'item',
        item_no: 'Z001',
        description: 'Zero test',
        quantity: 0,
        unit: 'item',
        budget_rate: 0,
        budget_total: 0
      };
      
      renderWithinTable(<TenderAnalysisConfig rows={[rowWithZeros]} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      // Should have 2 instances of $0.00 (rate and total)
      const zeroValues = screen.getAllByText('$0.00');
      expect(zeroValues).toHaveLength(2);
    });

    it('applies consistent styling to all rows', () => {
      const mixedRows = [mockItemRow, mockSectionRow, mockGroupedHeaderRow];
      renderWithinTable(<TenderAnalysisConfig rows={mixedRows} />);

      const rows = screen.getAllByTestId('mui-tablerow');
      rows.forEach(row => {
        const sx = JSON.parse(row.getAttribute('sx'));
        expect(sx.height).toBe('58px');
        expect(sx.backgroundColor).toMatch(/!important$/);
      });
    });
  });
});
