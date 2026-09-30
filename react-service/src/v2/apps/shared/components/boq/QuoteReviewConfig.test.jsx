import React from 'react';
import { render, screen } from '@testing-library/react';
import QuoteReviewTableRows, { Columns } from './QuoteReviewConfig';

// Mock MUI components
jest.mock('@mui/material/Grid2', () => ({ children, container, spacing, ...props }) => (
  <div data-testid="mui-grid2" container={String(container)} spacing={String(spacing)} {...props}>
    {children}
  </div>
));

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

// Mock components
jest.mock('./MuiEllipsisTooltip', () => ({ tooltipContent }) => (
  <div data-testid="ellipsis-tooltip">{tooltipContent}</div>
));

jest.mock('./HighlightTooltip', () => (row) => (
  <div data-testid="highlight-tooltip">Highlight for {row.description}</div>
));

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

// Mock lodash
jest.mock('lodash/capitalize', () => (str) => str.charAt(0).toUpperCase() + str.slice(1));

describe('QuoteReviewConfig', () => {
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
      expect(screen.getByText('Rate')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
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
      expect(cells[4]).toHaveTextContent('Rate');
      expect(cells[5]).toHaveTextContent('Total');
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
        expect(sx.opacity).toBe('0.4');
        expect(sx.border).toBe('1px solid rgba(224, 224, 224, 1)');
        expect(sx.fontWeight).toBe(600);
        expect(sx.padding).toBe('4px 12px');
      });
    });
  });

  describe('QuoteReviewTableRows', () => {
    const mockItemRow = {
      boq_item_id: 1,
      type: 'item',
      item_no: 'I001',
      description: 'Test item description',
      quantity: 5,
      unit: 'each',
      rate: 100,
      total: 500
    };

    const mockSectionRow = {
      boq_item_id: 2,
      type: 'section',
      item_no: 'S001',
      description: 'section description'
    };

    const mockHeadingRow = {
      boq_item_id: 3,
      type: 'grouped_heading',
      item_no: 'H001',
      description: 'heading description'
    };

    it('renders without crashing', () => {
      render(<QuoteReviewTableRows rows={[]} />);
    });

    it('renders item rows correctly', () => {
      render(<QuoteReviewTableRows rows={[mockItemRow]} />);

      expect(screen.getByText('I001')).toBeInTheDocument();
      expect(screen.getByText('Test item description')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('each')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('renders section rows correctly', () => {
      render(<QuoteReviewTableRows rows={[mockSectionRow]} />);

      expect(screen.getByText('S001')).toBeInTheDocument();
      expect(screen.getByText('Section description')).toBeInTheDocument(); // Should be capitalized
    });

    it('renders heading rows correctly', () => {
      render(<QuoteReviewTableRows rows={[mockHeadingRow]} />);

      expect(screen.getByText('H001')).toBeInTheDocument();
      expect(screen.getByText('Heading description')).toBeInTheDocument(); // Should be capitalized
    });

    it('applies correct background color for sections', () => {
      render(<QuoteReviewTableRows rows={[mockSectionRow]} />);

      const row = screen.getByTestId('mui-tablerow');
      const sx = JSON.parse(row.getAttribute('sx'));
      expect(sx.backgroundColor).toBe('#9c27b0 !important');
    });

    it('applies correct background color for items', () => {
      render(<QuoteReviewTableRows rows={[mockItemRow]} />);

      const row = screen.getByTestId('mui-tablerow');
      const sx = JSON.parse(row.getAttribute('sx'));
      expect(sx.backgroundColor).toBe('#ffffff !important');
    });

    it('renders highlight tooltip for all row types', () => {
      render(<QuoteReviewTableRows rows={[mockItemRow, mockSectionRow, mockHeadingRow]} />);

      expect(screen.getByText('Highlight for Test item description')).toBeInTheDocument();
      expect(screen.getByText('Highlight for section description')).toBeInTheDocument();
      expect(screen.getByText('Highlight for heading description')).toBeInTheDocument();
    });

    it('renders ellipsis tooltip for all row types', () => {
      render(<QuoteReviewTableRows rows={[mockItemRow, mockSectionRow, mockHeadingRow]} />);

      expect(screen.getByText('Test item description')).toBeInTheDocument();
      expect(screen.getByText('Section description')).toBeInTheDocument();
      expect(screen.getByText('Heading description')).toBeInTheDocument();
    });

    it('only renders quantity/unit/rate/total cells for item type', () => {
      render(<QuoteReviewTableRows rows={[mockItemRow, mockSectionRow, mockHeadingRow]} />);

      // Should only see one instance of each value (from the item row)
      expect(screen.getAllByText('5')).toHaveLength(1);
      expect(screen.getAllByText('each')).toHaveLength(1);
      expect(screen.getAllByText('100')).toHaveLength(1);
      expect(screen.getAllByText('500')).toHaveLength(1);
    });

    it('handles empty rows array', () => {
      render(<QuoteReviewTableRows rows={[]} />);
      
      // Should render without error and have no content
      const rows = screen.queryAllByTestId('mui-tablerow');
      expect(rows).toHaveLength(0);
    });

    it('applies correct column span for section rows', () => {
      render(<QuoteReviewTableRows rows={[mockSectionRow]} />);

      const cells = screen.getAllByTestId('mui-tablecell');
      const descriptionCell = cells.find(cell => cell.getAttribute('colSpan') === '6');
      expect(descriptionCell).toBeInTheDocument();
    });

    it('applies correct column span for heading rows', () => {
      render(<QuoteReviewTableRows rows={[mockHeadingRow]} />);

      const cells = screen.getAllByTestId('mui-tablecell');
      const descriptionCell = cells.find(cell => cell.getAttribute('colSpan') === '5');
      expect(descriptionCell).toBeInTheDocument();
    });

    it('applies underline decoration for heading rows', () => {
      render(<QuoteReviewTableRows rows={[mockHeadingRow]} />);

      const cells = screen.getAllByTestId('mui-tablecell');
      const descriptionCell = cells.find(cell => {
        const sx = JSON.parse(cell.getAttribute('sx') || '{}');
        return sx.textDecoration === 'underline';
      });
      expect(descriptionCell).toBeInTheDocument();
    });

    it('handles mixed row types correctly', () => {
      const mixedRows = [mockItemRow, mockSectionRow, mockHeadingRow];
      render(<QuoteReviewTableRows rows={mixedRows} />);

      // Should render all three row types
      expect(screen.getByText('I001')).toBeInTheDocument();
      expect(screen.getByText('S001')).toBeInTheDocument();
      expect(screen.getByText('H001')).toBeInTheDocument();

      // Should have 3 rows total
      const rows = screen.getAllByTestId('mui-tablerow');
      expect(rows).toHaveLength(3);
    });

    it('renders all row types with proper structure', () => {
      const mixedRows = [mockItemRow, mockSectionRow, mockHeadingRow];
      render(<QuoteReviewTableRows rows={mixedRows} />);

      // Should render all three row types
      expect(screen.getByText('I001')).toBeInTheDocument();
      expect(screen.getByText('S001')).toBeInTheDocument();
      expect(screen.getByText('H001')).toBeInTheDocument();

      // Should have 3 rows total
      const rows = screen.getAllByTestId('mui-tablerow');
      expect(rows).toHaveLength(3);
    });
  });
});