import React from 'react';
import { render } from '@testing-library/react';
import columnsGrid from './ProsperConfig';

// Mock dependencies
jest.mock('lodash/capitalize', () => (str) => str.charAt(0).toUpperCase() + str.slice(1));

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

jest.mock('./TableTooltip', () => ({ content, title }) => (
  <div data-testid="table-tooltip" title={title}>
    {content}
  </div>
));

jest.mock('./HighlightTooltip', () => (row) => (
  <div data-testid="highlight-tooltip">Highlight for {row.description}</div>
));

describe('ProsperConfig', () => {
  const mockValueOptions = ['option1', 'option2', 'option3'];

  describe('Column Configuration', () => {
    it('returns correct number of columns', () => {
      const columns = columnsGrid(mockValueOptions);
      expect(columns).toHaveLength(7);
    });

    it('returns columns with correct field names', () => {
      const columns = columnsGrid();
      const fieldNames = columns.map(col => col.field);
      
      expect(fieldNames).toEqual([
        'item_no',
        'description',
        'quantity',
        'unit_id',
        'rate',
        'price',
        'tenderee_note'
      ]);
    });

    it('returns columns with correct header names', () => {
      const columns = columnsGrid();
      const headerNames = columns.map(col => col.headerName);
      
      expect(headerNames).toEqual([
        'Item',
        'Description',
        'Quantity',
        'Unit',
        'Rate',
        'Price',
        'Note'
      ]);
    });

    it('configures column types correctly', () => {
      const columns = columnsGrid();
      
      expect(columns[2].type).toBe('number'); // quantity
      expect(columns[3].type).toBe('singleSelect'); // unit
      expect(columns[4].type).toBe('number'); // rate
      expect(columns[5].type).toBe('number'); // price
    });

    it('configures column flex values correctly', () => {
      const columns = columnsGrid();
      
      expect(columns[0].flex).toBe(50); // item_no
      expect(columns[1].flex).toBe(250); // description
      expect(columns[2].flex).toBe(50); // quantity
      expect(columns[3].flex).toBe(50); // unit
      expect(columns[4].flex).toBe(50); // rate
      expect(columns[5].flex).toBe(50); // price
      expect(columns[6].flex).toBe(250); // note
    });

    it('configures alignment correctly for all columns', () => {
      const columns = columnsGrid();
      
      columns.forEach(column => {
        expect(column.headerAlign).toBe('left');
        expect(column.align).toBe('left');
      });
    });

    it('passes valueOptions to unit column', () => {
      const columns = columnsGrid(mockValueOptions);
      const unitColumn = columns[3]; // unit column
      
      expect(unitColumn.valueOptions).toEqual(mockValueOptions);
    });

    it('marks rate column as editable', () => {
      const columns = columnsGrid();
      const rateColumn = columns[4]; // rate column
      
      expect(rateColumn.editable).toBe(true);
    });
  });

  describe('Description Column Render Cell', () => {
    let descriptionColumn;

    beforeEach(() => {
      const columns = columnsGrid();
      descriptionColumn = columns[1]; // description column
    });

    it('renders highlight tooltip when no description', () => {
      const params = {
        row: { type: 'item' }
      };
      
      const { getByTestId } = render(descriptionColumn.renderCell(params));
      expect(getByTestId('highlight-tooltip')).toBeInTheDocument();
    });

    it('renders capitalized description for section type', () => {
      const params = {
        row: { 
          description: 'test section',
          type: 'section'
        }
      };
      
      const { container } = render(descriptionColumn.renderCell(params));
      expect(container).toHaveTextContent('Test section');
    });

    it('renders capitalized description for grouped_heading type', () => {
      const params = {
        row: { 
          description: 'test heading',
          type: 'grouped_heading'
        }
      };
      
      const { container } = render(descriptionColumn.renderCell(params));
      expect(container).toHaveTextContent('Test heading');
    });

    it('renders bold content for section headings (Prelims, Measured work, Other items)', () => {
      const sectionNames = ['prelims', 'measured work', 'other items'];
      
      sectionNames.forEach(sectionName => {
        const params = {
          row: { 
            description: sectionName,
            type: 'section'
          }
        };
        
        const { container } = render(descriptionColumn.renderCell(params));
        const boldElement = container.querySelector('b');
        expect(boldElement).toBeInTheDocument();
        expect(boldElement).toHaveTextContent(sectionName.charAt(0).toUpperCase() + sectionName.slice(1));
      });
    });

    it('renders regular content for non-section descriptions', () => {
      const params = {
        row: { 
          description: 'regular item description',
          type: 'item'
        }
      };
      
      const { container } = render(descriptionColumn.renderCell(params));
      expect(container).toHaveTextContent('regular item description');
    });

    it('includes highlight tooltip for all descriptions', () => {
      const params = {
        row: { 
          description: 'test description',
          type: 'item'
        }
      };
      
      const { getByTestId } = render(descriptionColumn.renderCell(params));
      expect(getByTestId('highlight-tooltip')).toBeInTheDocument();
    });

    it('includes table tooltip for all descriptions', () => {
      const params = {
        row: { 
          description: 'test description',
          type: 'item'
        }
      };
      
      const { getByTestId } = render(descriptionColumn.renderCell(params));
      expect(getByTestId('table-tooltip')).toBeInTheDocument();
    });
  });

  describe('Rate Column Render Cell', () => {
    let rateColumn;

    beforeEach(() => {
      const columns = columnsGrid();
      rateColumn = columns[4]; // rate column
    });

    it('formats currency correctly', () => {
      const params = {
        row: { rate: 150.5 }
      };
      
      const result = rateColumn.renderCell(params);
      expect(result).toBe('$150.50');
    });

    it('handles zero rate', () => {
      const params = {
        row: { rate: 0 }
      };
      
      const result = rateColumn.renderCell(params);
      expect(result).toBe('$0.00');
    });

    it('handles decimal rates', () => {
      const params = {
        row: { rate: 99.99 }
      };
      
      const result = rateColumn.renderCell(params);
      expect(result).toBe('$99.99');
    });
  });

  describe('Price Column Render Cell', () => {
    let priceColumn;

    beforeEach(() => {
      const columns = columnsGrid();
      priceColumn = columns[5]; // price column
    });

    it('calculates and formats price correctly', () => {
      const params = {
        row: { 
          quantity: 5,
          rate: 100.50 
        }
      };
      
      const result = priceColumn.renderCell(params);
      expect(result).toBe('$502.50');
    });

    it('handles zero quantity', () => {
      const params = {
        row: { 
          quantity: 0,
          rate: 100 
        }
      };
      
      const result = priceColumn.renderCell(params);
      expect(result).toBe('$0.00');
    });

    it('handles zero rate', () => {
      const params = {
        row: { 
          quantity: 5,
          rate: 0 
        }
      };
      
      const result = priceColumn.renderCell(params);
      expect(result).toBe('$0.00');
    });

    it('handles decimal calculations with rounding', () => {
      const params = {
        row: { 
          quantity: 2.5,
          rate: 33.33 
        }
      };
      
      const result = priceColumn.renderCell(params);
      expect(result).toBe('$83.32'); // 2.5 * 33.33 = 83.325, rounds to 83.32
    });
  });

  describe('Note Column Render Cell', () => {
    let noteColumn;

    beforeEach(() => {
      const columns = columnsGrid();
      noteColumn = columns[6]; // note column
    });

    it('renders table tooltip with note content', () => {
      const params = {
        row: { 
          tenderee_note: 'This is a test note'
        }
      };
      
      const { getByTestId } = render(noteColumn.renderCell(params));
      const tooltip = getByTestId('table-tooltip');
      
      expect(tooltip).toHaveTextContent('This is a test note');
      expect(tooltip).toHaveAttribute('title', 'This is a test note');
    });

    it('handles empty note', () => {
      const params = {
        row: { 
          tenderee_note: ''
        }
      };
      
      const { getByTestId } = render(noteColumn.renderCell(params));
      const tooltip = getByTestId('table-tooltip');
      
      expect(tooltip).toHaveTextContent('');
      expect(tooltip).toHaveAttribute('title', '');
    });

    it('handles missing note property', () => {
      const params = {
        row: {}
      };
      
      const { getByTestId } = render(noteColumn.renderCell(params));
      const tooltip = getByTestId('table-tooltip');
      
      expect(tooltip).toHaveTextContent('');
      expect(tooltip).toHaveAttribute('title', '');
    });
  });
});