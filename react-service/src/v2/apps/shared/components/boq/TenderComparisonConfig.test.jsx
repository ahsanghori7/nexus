import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TenderAnalysisConfig, { Columns } from './TenderComparisonConfig';

// Mock MUI components
jest.mock('@mui/material/TableCell', () => ({ children, sx, colSpan, ...props }) => (
  <td data-testid="mui-tablecell" sx={JSON.stringify(sx)} colSpan={colSpan} {...props}>
    {children}
  </td>
));

jest.mock('@mui/material/TableRow', () => ({ children, sx, ...props }) => (
  <tr data-testid="mui-tablerow" sx={JSON.stringify(sx)} {...props}>
    {children}
  </tr>
));

jest.mock('@mui/material/Typography', () => ({ children, sx, ...props }) => (
  <span data-testid="mui-typography" sx={JSON.stringify(sx)} {...props}>
    {children}
  </span>
));

jest.mock('@mui/material/Grid', () => ({ children, container, sx, ...props }) => (
  <div data-testid="mui-grid" container={String(container)} sx={JSON.stringify(sx)} {...props}>
    {children}
  </div>
));

// Mock dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'best-price': 'Best Price',
      'price-matched': 'Price Matched',
    };
    return translations[key] || key;
  }),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkBackgroundPurple: '#f5f3ff',
        white: '#ffffff',
        clinkGreen: '#10b981',
        clinkPurple: '#8b5cf6',
      },
    },
  },
}));

jest.mock('lodash/capitalize', () => (str) => str.charAt(0).toUpperCase() + str.slice(1));

describe('TenderComparisonConfig', () => {
  describe('Columns component', () => {
    it('should render all column headers', () => {
      render(
        <table>
          <thead>
            <tr>
              <Columns />
            </tr>
          </thead>
        </table>
      );

      expect(screen.getByText('Rate')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
    });

    it('should render columns in correct order', () => {
      const { container } = render(
        <table>
          <thead>
            <tr>
              <Columns />
            </tr>
          </thead>
        </table>
      );

      const cells = container.querySelectorAll('[data-testid="mui-tablecell"]');
      expect(cells[0]).toHaveTextContent('Rate');
      expect(cells[1]).toHaveTextContent('Total');
      expect(cells[2]).toHaveTextContent('Company');
    });

    it('should apply correct styling to column headers', () => {
      const { container } = render(
        <table>
          <thead>
            <tr>
              <Columns />
            </tr>
          </thead>
        </table>
      );

      const cells = container.querySelectorAll('[data-testid="mui-tablecell"]');
      cells.forEach(cell => {
        const sx = JSON.parse(cell.getAttribute('sx'));
        expect(sx.fontWeight).toBe(600);
        expect(sx.opacity).toBe('0.4');
        expect(sx.borderWidth).toBe(0);
      });
    });
  });

  describe('TenderAnalysisConfig component', () => {
    const mockItemRow = {
      boq_item_id: 'item-1',
      type: 'item',
      description: 'Test item description',
      rate: '$100.00',
      total: '$1000.00',
      best: false,
      priceMatch: false,
    };

    const mockSectionRow = {
      boq_item_id: 'section-1',
      type: 'section',
      description: 'test section',
      rate: null,
      total: null,
      best: false,
      priceMatch: false,
    };

    const mockGroupedHeaderRow = {
      boq_item_id: 'header-1',
      type: 'grouped_heading',
      description: 'test header',
      rate: null,
      total: null,
      best: false,
      priceMatch: false,
    };

    it('should render rows correctly', () => {
      const rows = [mockItemRow];
      
      render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      expect(screen.getByTestId('mui-tablerow')).toBeInTheDocument();
    });

    it('should render item row with rate and total', () => {
      const rows = [mockItemRow];
      
      render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('$1000.00')).toBeInTheDocument();
    });

    it('should render section row with capitalized description', () => {
      const rows = [mockSectionRow];
      
      render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      expect(screen.getByText('Test section')).toBeInTheDocument();
    });

    it('should render grouped header row with capitalized description', () => {
      const rows = [mockGroupedHeaderRow];
      
      render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      expect(screen.getByText('Test header')).toBeInTheDocument();
    });

    it('should apply correct background color for section rows', () => {
      const rows = [mockSectionRow];
      
      const { container } = render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      const tableRow = container.querySelector('[data-testid="mui-tablerow"]');
      const sx = JSON.parse(tableRow.getAttribute('sx'));
      expect(sx.backgroundColor).toBe('#f5f3ff !important');
    });

    it('should apply white background color for item rows', () => {
      const rows = [mockItemRow];
      
      const { container } = render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      const tableRow = container.querySelector('[data-testid="mui-tablerow"]');
      const sx = JSON.parse(tableRow.getAttribute('sx'));
      expect(sx.backgroundColor).toBe('#ffffff !important');
    });

    it('should apply underline styling for grouped header rows', () => {
      const rows = [mockGroupedHeaderRow];
      
      const { container } = render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      const cells = container.querySelectorAll('[data-testid="mui-tablecell"]');
      const firstCellSx = JSON.parse(cells[0].getAttribute('sx'));
      expect(firstCellSx.textDecoration).toBe('underline');
    });

    it('should set correct colSpan for non-item rows', () => {
      const rows = [mockSectionRow];
      
      const { container } = render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      const firstCell = container.querySelector('[data-testid="mui-tablecell"]');
      expect(firstCell.getAttribute('colSpan')).toBe('2');
    });

    it('should set correct colSpan for item rows', () => {
      const rows = [mockItemRow];
      
      const { container } = render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      const cells = container.querySelectorAll('[data-testid="mui-tablecell"]');
      expect(cells[0].getAttribute('colSpan')).toBe('1');
    });

    it('should show best price indicator when best is true and priceMatch is false', () => {
      const rows = [{
        ...mockItemRow,
        best: true,
        priceMatch: false,
      }];
      
      render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      expect(screen.getByText('Best Price')).toBeInTheDocument();
      expect(screen.getByTestId('mui-icon-CheckCircle')).toBeInTheDocument();
    });

    it('should show price matched indicator when both best and priceMatch are true', () => {
      const rows = [{
        ...mockItemRow,
        best: true,
        priceMatch: true,
      }];
      
      render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      expect(screen.getByText('Price Matched')).toBeInTheDocument();
      expect(screen.getByTestId('mui-icon-CheckCircle')).toBeInTheDocument();
    });

    it('should not show any indicator when best is false', () => {
      const rows = [{
        ...mockItemRow,
        best: false,
        priceMatch: false,
      }];
      
      render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      expect(screen.queryByTestId('mui-icon-CheckCircle')).not.toBeInTheDocument();
      expect(screen.queryByText('Best Price')).not.toBeInTheDocument();
      expect(screen.queryByText('Price Matched')).not.toBeInTheDocument();
    });

    it('should render multiple rows correctly', () => {
      const rows = [mockSectionRow, mockItemRow, mockGroupedHeaderRow];
      
      render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      const tableRows = screen.getAllByTestId('mui-tablerow');
      expect(tableRows).toHaveLength(3);
    });

    it('should use correct key for each row', () => {
      const rows = [
        { ...mockItemRow, boq_item_id: 'item-1' },
        { ...mockSectionRow, boq_item_id: 'section-1' },
      ];
      
      const { container } = render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      const tableRows = container.querySelectorAll('[data-testid="mui-tablerow"]');
      expect(tableRows).toHaveLength(2);
    });

    it('should apply correct styling to description cells', () => {
      const rows = [mockItemRow];
      
      const { container } = render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      const cells = container.querySelectorAll('[data-testid="mui-tablecell"]');
      const firstCellSx = JSON.parse(cells[0].getAttribute('sx'));
      
      expect(firstCellSx.border).toBe('1px solid rgba(224, 224, 224, 1)');
      expect(firstCellSx.whiteSpace).toBe('nowrap');
      expect(firstCellSx.overflow).toBe('hidden');
      expect(firstCellSx.textOverflow).toBe('ellipsis');
      expect(firstCellSx.fontWeight).toBe(600);
    });

    it('should handle empty rows array', () => {
      const rows = [];
      
      const { container } = render(
        <table>
          <tbody>
            <TenderAnalysisConfig rows={rows} />
          </tbody>
        </table>
      );

      const tableRows = container.querySelectorAll('[data-testid="mui-tablerow"]');
      expect(tableRows).toHaveLength(0);
    });
  });
});