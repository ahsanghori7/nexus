import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Table from './Table';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

// Mock MUI components
jest.mock('@mui/material/Table', () => ({ children }) => (
  <table data-testid="mui-table">{children}</table>
));

jest.mock('@mui/material/TableBody', () => ({ children }) => (
  <tbody data-testid="mui-tablebody">{children}</tbody>
));

jest.mock('@mui/material/TableCell', () => ({ children, ...props }) => (
  <td data-testid="mui-tablecell" {...props}>{children}</td>
));

jest.mock('@mui/material/TableContainer', () => ({ children, style }) => (
  <div data-testid="mui-tablecontainer" style={style}>{children}</div>
));

jest.mock('@mui/material/TableHead', () => ({ children }) => (
  <thead data-testid="mui-tablehead">{children}</thead>
));

jest.mock('@mui/material/TableRow', () => ({ children }) => (
  <tr data-testid="mui-tablerow">{children}</tr>
));

jest.mock('@mui/material/MenuItem', () => ({ children, onClick }) => (
  <li data-testid="mui-menuitem" onClick={onClick}>{children}</li>
));

jest.mock('@mui/material/Menu', () => ({ children, anchorEl, open, onClose }) => (
  open ? <div data-testid="mui-menu" onClick={onClose}>{children}</div> : null
));

describe('Table', () => {
  const mockItems = [
    {
      id: 'item-1',
      item_no: 'Item-001',
      description: 'Test item',
      quantity: 10,
      unit_id: 1,
      rate: 100,
      price: 1000,
      notes: [],
    },
    {
      id: 'item-2',
      item_no: 'Item-002',
      description: 'Another item',
      quantity: 5,
      unit_id: 2,
      rate: 200,
      price: 1000,
      notes: [],
    },
  ];

  const mockUnits = ['kg', 'm', 'pieces'];

  const MockColumns = () => (
    <>
      <td data-testid="mock-column">Item No</td>
      <td data-testid="mock-column">Description</td>
      <td data-testid="mock-column">Quantity</td>
    </>
  );

  const MockBody = ({ rows, units, handleChange, handleMenuOpen }) => (
    <>
      {rows.map((row) => (
        <tr key={row.id} data-testid="mock-body-row">
          <td>{row.item_no}</td>
          <td>{row.description}</td>
          <td>{row.quantity}</td>
          <td>
            <button 
              data-testid={`menu-button-${row.id}`}
              onClick={(e) => handleMenuOpen(e, row.id)}
            >
              Menu
            </button>
          </td>
        </tr>
      ))}
    </>
  );

  const defaultProps = {
    items: mockItems,
    units: mockUnits,
    Body: MockBody,
    Columns: MockColumns,
    actions: true,
    sx: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render table structure correctly', () => {
      render(<Table {...defaultProps} />);

      expect(screen.getByTestId('mui-tablecontainer')).toBeInTheDocument();
      expect(screen.getByTestId('mui-table')).toBeInTheDocument();
      expect(screen.getByTestId('mui-tablehead')).toBeInTheDocument();
      expect(screen.getByTestId('mui-tablebody')).toBeInTheDocument();
    });

    it('should render columns correctly', () => {
      render(<Table {...defaultProps} />);

      const columns = screen.getAllByTestId('mock-column');
      expect(columns).toHaveLength(3);
      expect(columns[0]).toHaveTextContent('Item No');
      expect(columns[1]).toHaveTextContent('Description');
      expect(columns[2]).toHaveTextContent('Quantity');
    });

    it('should render body rows correctly', () => {
      render(<Table {...defaultProps} />);

      const bodyRows = screen.getAllByTestId('mock-body-row');
      expect(bodyRows).toHaveLength(2);
    });

    it('should render actions column when actions is true', () => {
      render(<Table {...defaultProps} />);

      const tableCells = screen.getAllByTestId('mui-tablecell');
      expect(tableCells).toHaveLength(1); // Actions column
    });

    it('should not render actions column when actions is false', () => {
      render(<Table {...defaultProps} actions={false} />);

      const tableCells = screen.queryAllByTestId('mui-tablecell');
      expect(tableCells).toHaveLength(0);
    });

    it('should not render menu when actions is false', () => {
      render(<Table {...defaultProps} actions={false} />);

      expect(screen.queryByTestId('mui-menu')).not.toBeInTheDocument();
    });

    it('should apply custom styles', () => {
      const customSx = { maxHeight: 400, backgroundColor: 'red' };
      render(<Table {...defaultProps} sx={customSx} />);

      const container = screen.getByTestId('mui-tablecontainer');
      expect(container).toHaveStyle({
        border: '0',
        maxHeight: '400px',
        backgroundColor: 'red',
      });
    });

    it('should handle empty items array', () => {
      render(<Table {...defaultProps} items={[]} />);

      const bodyRows = screen.queryAllByTestId('mock-body-row');
      expect(bodyRows).toHaveLength(0);
    });
  });

  describe('Menu Interactions', () => {
    it('should open menu when menu button is clicked', async () => {
      render(<Table {...defaultProps} />);

      const menuButton = screen.getByTestId('menu-button-item-1');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByTestId('mui-menu')).toBeInTheDocument();
      });
    });

    it('should close menu when clicking outside', async () => {
      render(<Table {...defaultProps} />);

      const menuButton = screen.getByTestId('menu-button-item-1');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByTestId('mui-menu')).toBeInTheDocument();
      });

      const menu = screen.getByTestId('mui-menu');
      fireEvent.click(menu);

      await waitFor(() => {
        expect(screen.queryByTestId('mui-menu')).not.toBeInTheDocument();
      });
    });

    it('should render all menu items', async () => {
      render(<Table {...defaultProps} />);

      const menuButton = screen.getByTestId('menu-button-item-1');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Move Up')).toBeInTheDocument();
        expect(screen.getByText('Move Down')).toBeInTheDocument();
        expect(screen.getByText('Add 1 Row on Top')).toBeInTheDocument();
        expect(screen.getByText('Add 1 Row on Bottom')).toBeInTheDocument();
        expect(screen.getByText('Clear Row')).toBeInTheDocument();
        expect(screen.getByText('Remove Row')).toBeInTheDocument();
      });
    });
  });

  describe('Row Actions', () => {
    it('should add row on top when Add 1 Row on Top is clicked', async () => {
      render(<Table {...defaultProps} />);

      const menuButton = screen.getByTestId('menu-button-item-1');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const addTopButton = screen.getByText('Add 1 Row on Top');
        fireEvent.click(addTopButton);
      });

      // Should have 3 rows now (2 original + 1 new)
      const bodyRows = screen.getAllByTestId('mock-body-row');
      expect(bodyRows).toHaveLength(3);
    });

    it('should add row on bottom when Add 1 Row on Bottom is clicked', async () => {
      render(<Table {...defaultProps} />);

      const menuButton = screen.getByTestId('menu-button-item-1');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const addBottomButton = screen.getByText('Add 1 Row on Bottom');
        fireEvent.click(addBottomButton);
      });

      // Should have 3 rows now (2 original + 1 new)
      const bodyRows = screen.getAllByTestId('mock-body-row');
      expect(bodyRows).toHaveLength(3);
    });

    it('should remove row when Remove Row is clicked', async () => {
      render(<Table {...defaultProps} />);

      const menuButton = screen.getByTestId('menu-button-item-1');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const removeButton = screen.getByText('Remove Row');
        fireEvent.click(removeButton);
      });

      // Should have 1 row now (2 original - 1 removed)
      const bodyRows = screen.getAllByTestId('mock-body-row');
      expect(bodyRows).toHaveLength(1);
    });

    it('should clear row data when Clear Row is clicked', async () => {
      const MockBodyWithData = ({ rows, handleMenuOpen }) => (
        <>
          {rows.map((row) => (
            <tr key={row.id} data-testid="mock-body-row">
              <td data-testid={`item-no-${row.id}`}>{row.item_no}</td>
              <td data-testid={`description-${row.id}`}>{row.description}</td>
              <td data-testid={`quantity-${row.id}`}>{row.quantity}</td>
              <td>
                <button 
                  data-testid={`menu-button-${row.id}`}
                  onClick={(e) => handleMenuOpen(e, row.id)}
                >
                  Menu
                </button>
              </td>
            </tr>
          ))}
        </>
      );

      render(<Table {...defaultProps} Body={MockBodyWithData} />);

      // Verify initial data
      expect(screen.getByTestId('item-no-item-1')).toHaveTextContent('Item-001');
      expect(screen.getByTestId('description-item-1')).toHaveTextContent('Test item');
      expect(screen.getByTestId('quantity-item-1')).toHaveTextContent('10');

      const menuButton = screen.getByTestId('menu-button-item-1');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const clearButton = screen.getByText('Clear Row');
        fireEvent.click(clearButton);
      });

      // Verify data is cleared
      expect(screen.getByTestId('item-no-item-1')).toHaveTextContent('');
      expect(screen.getByTestId('description-item-1')).toHaveTextContent('');
      expect(screen.getByTestId('quantity-item-1')).toHaveTextContent('0');
    });

    it('should move row up when Move Up is clicked', async () => {
      const items = [
        { id: 'item-1', item_no: 'Item-001', description: 'First', quantity: 1 },
        { id: 'item-2', item_no: 'Item-002', description: 'Second', quantity: 2 },
      ];

      const MockBodyOrdered = ({ rows, handleMenuOpen }) => (
        <>
          {rows.map((row, index) => (
            <tr key={row.id} data-testid={`ordered-row-${index}`}>
              <td>{row.description}</td>
              <td>
                <button 
                  data-testid={`menu-button-${row.id}`}
                  onClick={(e) => handleMenuOpen(e, row.id)}
                >
                  Menu
                </button>
              </td>
            </tr>
          ))}
        </>
      );

      render(<Table {...defaultProps} items={items} Body={MockBodyOrdered} />);

      // Click menu for second row
      const menuButton = screen.getByTestId('menu-button-item-2');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const moveUpButton = screen.getByText('Move Up');
        fireEvent.click(moveUpButton);
      });

      // Second item should now be first
      expect(screen.getByTestId('ordered-row-0')).toHaveTextContent('Second');
      expect(screen.getByTestId('ordered-row-1')).toHaveTextContent('First');
    });

    it('should move row down when Move Down is clicked', async () => {
      const items = [
        { id: 'item-1', item_no: 'Item-001', description: 'First', quantity: 1 },
        { id: 'item-2', item_no: 'Item-002', description: 'Second', quantity: 2 },
      ];

      const MockBodyOrdered = ({ rows, handleMenuOpen }) => (
        <>
          {rows.map((row, index) => (
            <tr key={row.id} data-testid={`ordered-row-${index}`}>
              <td>{row.description}</td>
              <td>
                <button 
                  data-testid={`menu-button-${row.id}`}
                  onClick={(e) => handleMenuOpen(e, row.id)}
                >
                  Menu
                </button>
              </td>
            </tr>
          ))}
        </>
      );

      render(<Table {...defaultProps} items={items} Body={MockBodyOrdered} />);

      // Click menu for first row
      const menuButton = screen.getByTestId('menu-button-item-1');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const moveDownButton = screen.getByText('Move Down');
        fireEvent.click(moveDownButton);
      });

      // First item should now be second
      expect(screen.getByTestId('ordered-row-0')).toHaveTextContent('Second');
      expect(screen.getByTestId('ordered-row-1')).toHaveTextContent('First');
    });

    it('should not move row up if already at top', async () => {
      render(<Table {...defaultProps} />);

      const menuButton = screen.getByTestId('menu-button-item-1');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const moveUpButton = screen.getByText('Move Up');
        fireEvent.click(moveUpButton);
      });

      // Should still have same number of rows
      const bodyRows = screen.getAllByTestId('mock-body-row');
      expect(bodyRows).toHaveLength(2);
    });

    it('should not move row down if already at bottom', async () => {
      render(<Table {...defaultProps} />);

      const menuButton = screen.getByTestId('menu-button-item-2');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const moveDownButton = screen.getByText('Move Down');
        fireEvent.click(moveDownButton);
      });

      // Should still have same number of rows
      const bodyRows = screen.getAllByTestId('mock-body-row');
      expect(bodyRows).toHaveLength(2);
    });
  });

  describe('Props Handling', () => {
    it('should work with default props', () => {
      render(<Table />);

      expect(screen.getByTestId('mui-tablecontainer')).toBeInTheDocument();
      expect(screen.getByTestId('mui-table')).toBeInTheDocument();
    });

    it('should pass units to Body component', () => {
      const MockBodyWithUnits = ({ units }) => (
        <tr>
          <td data-testid="units-count">{units.length}</td>
        </tr>
      );

      render(<Table {...defaultProps} Body={MockBodyWithUnits} />);

      expect(screen.getByTestId('units-count')).toHaveTextContent('3');
    });

    it('should pass handleChange to Body component', () => {
      const MockBodyWithChange = ({ handleChange }) => (
        <tr>
          <td>
            <button 
              data-testid="change-button"
              onClick={() => handleChange('item-1', 'description', 'New Description')}
            >
              Change
            </button>
          </td>
        </tr>
      );

      render(<Table {...defaultProps} Body={MockBodyWithChange} />);

      const changeButton = screen.getByTestId('change-button');
      fireEvent.click(changeButton);

      // Component should not crash - handleChange is working
      expect(changeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle menu operations with empty rows', () => {
      render(<Table {...defaultProps} items={[]} />);

      // Should render without crashing
      expect(screen.getByTestId('mui-table')).toBeInTheDocument();
    });

    it('should generate new row with correct structure', async () => {
      const MockBodyWithNewRow = ({ rows, handleMenuOpen }) => (
        <>
          {rows.map((row) => (
            <tr key={row.id} data-testid="mock-body-row">
              <td data-testid={`id-${row.id}`}>{row.id}</td>
              <td data-testid={`item-no-${row.id}`}>{row.item_no}</td>
              <td data-testid={`quantity-${row.id}`}>{row.quantity}</td>
              <td>
                <button 
                  data-testid={`menu-button-${row.id}`}
                  onClick={(e) => handleMenuOpen(e, row.id)}
                >
                  Menu
                </button>
              </td>
            </tr>
          ))}
        </>
      );

      render(<Table {...defaultProps} items={[]} Body={MockBodyWithNewRow} />);

      // Add a row using the component itself
      // Since there are no initial rows, we need to find another way to trigger the menu
      // Let's render with one item first
      const { rerender } = render(<Table {...defaultProps} items={mockItems.slice(0, 1)} Body={MockBodyWithNewRow} />);

      const menuButton = screen.getByTestId('menu-button-item-1');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const addBottomButton = screen.getByText('Add 1 Row on Bottom');
        fireEvent.click(addBottomButton);
      });

      // Check if new row has correct structure
      expect(screen.getByTestId('id-mock-uuid-123')).toBeInTheDocument();
      expect(screen.getByTestId('item-no-mock-uuid-123')).toHaveTextContent('');
      expect(screen.getByTestId('quantity-mock-uuid-123')).toHaveTextContent('0');
    });
  });
});