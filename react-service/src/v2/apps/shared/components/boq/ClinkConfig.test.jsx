import React from 'react';
import { render } from '@testing-library/react';
import columnsGrid from './ClinkConfig';

// Mock dependencies
jest.mock('lodash/capitalize', () => (str) => str.charAt(0).toUpperCase() + str.slice(1));

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'currency': 'USD',
      'boq-budget-rate-description': 'Budget rate description',
      'boq-budget-total-description': 'Budget total description',
    };
    return translations[key] || key;
  }),
}));

jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: jest.fn((value, config) => `$${value}`),
  currencyConfig: {
    USD: { symbol: '$', decimals: 2 },
  },
}));

jest.mock('v1/global/components/LazyImage', () => ({ src, alt }) => (
  <img data-testid="lazy-image" src={src} alt={alt} />
));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkGray: '#959595',
      },
    },
    s3: {
      iconRecommendedOrange: 'https://example.com/icon.png',
    },
  },
}));

jest.mock('@mui/icons-material/InfoOutlined', () => () => (
  <span data-testid="info-outlined-icon" />
));

jest.mock('@mui/material/Box', () => ({ children, className, ...props }) => (
  <div data-testid="mui-box" className={className} {...props}>
    {children}
  </div>
));

jest.mock('./TableTooltip', () => ({ content, title }) => (
  <div data-testid="table-tooltip" title={title}>
    {content}
  </div>
));

describe('ClinkConfig', () => {
  const mockValueOptions = ['m', 'km', 'kg'];

  describe('columnsGrid function', () => {
    let columns;

    beforeEach(() => {
      columns = columnsGrid(mockValueOptions);
    });

    it('should return an array of column configurations', () => {
      expect(columns).toBeInstanceOf(Array);
      expect(columns).toHaveLength(7);
    });

    it('should configure item_no column correctly', () => {
      const itemNoColumn = columns.find(col => col.field === 'item_no');
      
      expect(itemNoColumn).toEqual({
        field: 'item_no',
        headerName: 'Item No',
        headerAlign: 'left',
        align: 'left',
        flex: 100,
        editable: true,
        renderCell: expect.any(Function),
      });
    });

    it('should configure description column correctly', () => {
      const descColumn = columns.find(col => col.field === 'description');
      
      expect(descColumn).toEqual({
        field: 'description',
        headerName: 'Description',
        headerAlign: 'left',
        align: 'left',
        flex: 280,
        editable: true,
        renderCell: expect.any(Function),
      });
    });

    it('should configure quantity column correctly', () => {
      const qtyColumn = columns.find(col => col.field === 'quantity');
      
      expect(qtyColumn).toEqual({
        field: 'quantity',
        headerName: 'Quantity',
        headerAlign: 'right',
        align: 'right',
        type: 'number',
        flex: 123,
        editable: true,
        valueFormatter: expect.any(Function),
      });
    });

    it('should configure unit column correctly', () => {
      const unitColumn = columns.find(col => col.field === 'unit_id');
      
      expect(unitColumn).toEqual({
        field: 'unit_id',
        headerName: 'Unit',
        headerAlign: 'left',
        align: 'left',
        type: 'singleSelect',
        flex: 65,
        editable: true,
        valueOptions: mockValueOptions,
        renderCell: expect.any(Function),
      });
    });

    it('should configure budget rate column correctly', () => {
      const rateColumn = columns.find(col => col.field === 'budget_rate');
      
      expect(rateColumn).toEqual({
        field: 'budget_rate',
        headerName: 'Budget Rate',
        description: 'Budget rate description',
        headerAlign: 'right',
        align: 'right',
        type: 'number',
        flex: 95,
        editable: true,
        renderCell: expect.any(Function),
        renderHeader: expect.any(Function),
      });
    });

    it('should configure budget total column correctly', () => {
      const totalColumn = columns.find(col => col.field === 'budget_total');
      
      expect(totalColumn).toEqual({
        field: 'budget_total',
        headerName: 'Budget Total',
        description: 'Budget total description',
        headerAlign: 'right',
        align: 'right',
        type: 'number',
        flex: 95,
        editable: true,
        renderCell: expect.any(Function),
        renderHeader: expect.any(Function),
      });
    });

    it('should configure notes column correctly', () => {
      const noteColumn = columns.find(col => col.field === 'tenderee_note');
      
      expect(noteColumn).toEqual({
        field: 'tenderee_note',
        headerName: 'Notes',
        headerAlign: 'left',
        align: 'left',
        flex: 124,
        editable: true,
        renderCell: expect.any(Function),
      });
    });
  });

  describe('renderCell functions', () => {
    let columns;

    beforeEach(() => {
      columns = columnsGrid(mockValueOptions);
    });

    describe('item_no renderCell', () => {
      it('should render value when provided', () => {
        const itemNoColumn = columns.find(col => col.field === 'item_no');
        const { container } = render(
          itemNoColumn.renderCell({ value: 'Item-001' })
        );

        expect(container.querySelector('[data-testid="table-tooltip"]')).toBeInTheDocument();
      });

      it('should render dash when value is empty', () => {
        const itemNoColumn = columns.find(col => col.field === 'item_no');
        const result = itemNoColumn.renderCell({ value: '' });
        
        expect(result).toBe('-');
      });

      it('should render dash when value is null', () => {
        const itemNoColumn = columns.find(col => col.field === 'item_no');
        const result = itemNoColumn.renderCell({ value: null });
        
        expect(result).toBe('-');
      });
    });

    describe('description renderCell', () => {
      it('should render regular text for item type', () => {
        const descColumn = columns.find(col => col.field === 'description');
        const { container } = render(
          descColumn.renderCell({ 
            value: 'test description', 
            row: { type: 'item' } 
          })
        );
        
        expect(container.querySelector('[data-testid="table-tooltip"]')).toBeInTheDocument();
      });

      it('should capitalize text for section type', () => {
        const descColumn = columns.find(col => col.field === 'description');
        const { container } = render(
          descColumn.renderCell({ 
            value: 'test description', 
            row: { type: 'section' } 
          })
        );
        
        expect(container.querySelector('[data-testid="table-tooltip"]')).toBeInTheDocument();
      });

      it('should capitalize text for grouped_heading type', () => {
        const descColumn = columns.find(col => col.field === 'description');
        const { container } = render(
          descColumn.renderCell({ 
            value: 'test description', 
            row: { type: 'grouped_heading' } 
          })
        );
        
        expect(container.querySelector('[data-testid="table-tooltip"]')).toBeInTheDocument();
      });

      it('should render dash when value is empty', () => {
        const descColumn = columns.find(col => col.field === 'description');
        const { container } = render(
          descColumn.renderCell({ 
            value: '', 
            row: { type: 'item' } 
          })
        );
        
        expect(container).toHaveTextContent('-');
      });
    });

    describe('unit renderCell', () => {
      it('should render formatted value when provided', () => {
        const unitColumn = columns.find(col => col.field === 'unit_id');
        const result = unitColumn.renderCell({ formattedValue: 'meters' });
        
        expect(result).toBe('meters');
      });

      it('should render dash when formatted value is null', () => {
        const unitColumn = columns.find(col => col.field === 'unit_id');
        const result = unitColumn.renderCell({ formattedValue: null });
        
        expect(result).toBe('-');
      });
    });

    describe('budget rate renderCell', () => {
      it('should render formatted currency', () => {
        const rateColumn = columns.find(col => col.field === 'budget_rate');
        const result = rateColumn.renderCell({ value: 100 });
        
        expect(result).toBe('$100');
      });

      it('should handle null value', () => {
        const rateColumn = columns.find(col => col.field === 'budget_rate');
        const result = rateColumn.renderCell({ value: null });
        
        expect(result).toBeFalsy();
      });
    });

    describe('budget total renderCell', () => {
      it('should render formatted currency', () => {
        const totalColumn = columns.find(col => col.field === 'budget_total');
        const result = totalColumn.renderCell({ value: 1000 });
        
        expect(result).toBe('$1000');
      });

      it('should handle null value', () => {
        const totalColumn = columns.find(col => col.field === 'budget_total');
        const result = totalColumn.renderCell({ value: null });
        
        expect(result).toBeFalsy();
      });
    });

    describe('notes renderCell', () => {
      it('should render TableTooltip with note content', () => {
        const noteColumn = columns.find(col => col.field === 'tenderee_note');
        const { container } = render(
          noteColumn.renderCell({ value: 'Test note' })
        );
        
        expect(container.querySelector('[data-testid="table-tooltip"]')).toBeInTheDocument();
      });

      it('should render dash when note is empty', () => {
        const noteColumn = columns.find(col => col.field === 'tenderee_note');
        const { container } = render(noteColumn.renderCell({ value: '' }));
        expect(container.textContent).toContain('-');
      });
    });
  });

  describe('renderHeader functions', () => {
    let columns;

    beforeEach(() => {
      columns = columnsGrid(mockValueOptions);
    });

    it('should render custom header for budget rate column', () => {
      const rateColumn = columns.find(col => col.field === 'budget_rate');
      const { container } = render(
        rateColumn.renderHeader({
          colDef: {
            headerName: 'Budget Rate',
            description: 'Rate description'
          }
        })
      );
      
      expect(container.querySelector('[data-testid="mui-box"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="table-tooltip"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="info-outlined-icon"]')).toBeInTheDocument();
    });

    it('should render custom header for budget total column', () => {
      const totalColumn = columns.find(col => col.field === 'budget_total');
      const { container } = render(
        totalColumn.renderHeader({
          colDef: {
            headerName: 'Budget Total',
            description: 'Total description'
          }
        })
      );
      
      expect(container.querySelector('[data-testid="mui-box"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="table-tooltip"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="info-outlined-icon"]')).toBeInTheDocument();
    });
  });
});