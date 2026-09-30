import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  MuiModalTable,
  MuiModalTextarea,
  MuiModalUploadItem,
  MuiModalButton,
  MuiModalErrorTable,
} from './modal-components.mui.jsx';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `mocked-${key}`)
}));

// Mock moment
jest.mock('moment', () => {
  const mockMoment = () => ({
    format: jest.fn(() => 'December 15th 2023')
  });
  return mockMoment;
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        black: '#000000',
        white: '#ffffff',
        prim: '#007bff'
      }
    }
  }
}));

// Mock MUI components
jest.mock('@mui/material/Grid', () => ({ children, container, item, sx, ...props }) => (
  <div 
    data-testid="mui-grid" 
    data-container={container}
    data-item={item}
    data-sx={JSON.stringify(sx)}
    {...props}
  >
    {children}
  </div>
));

jest.mock('@mui/material/Button', () => ({ children, sx, variant, onClick, ...props }) => (
  <button 
    data-testid="mui-button" 
    data-sx={JSON.stringify(sx)}
    data-variant={variant}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
));

jest.mock('@mui/material/Box', () => ({ children, sx, ...props }) => (
  <div data-testid="mui-box" data-sx={JSON.stringify(sx)} {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/Tooltip', () => ({ children, title, ...props }) => (
  <div data-testid="mui-tooltip" title={title} {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/InputBase', () => ({ sx, placeholder, multiline, ...props }) => (
  <textarea 
    data-testid="mui-input-base" 
    data-sx={JSON.stringify(sx)}
    data-multiline={multiline}
    placeholder={placeholder}
    {...props}
  />
));

jest.mock('@mui/material/Typography', () => ({ children, variant, component, sx, fontWeight, ...props }) => (
  <div 
    data-testid="mui-typography" 
    data-variant={variant}
    data-font-weight={fontWeight}
    data-sx={JSON.stringify(sx)}
    {...props}
  >
    {children}
  </div>
));

jest.mock('@mui/material/Table', () => ({ children, ...props }) => (
  <table data-testid="mui-table" {...props}>
    {children}
  </table>
));

jest.mock('@mui/material/TableHead', () => ({ children, sx, ...props }) => (
  <thead data-testid="mui-table-head" data-sx={JSON.stringify(sx)} {...props}>
    {children}
  </thead>
));

jest.mock('@mui/material/TableBody', () => ({ children, ...props }) => (
  <tbody data-testid="mui-table-body" {...props}>
    {children}
  </tbody>
));

jest.mock('@mui/material/TableCell', () => ({ children, sx, ...props }) => (
  <td data-testid="mui-table-cell" data-sx={JSON.stringify(sx)} {...props}>
    {children}
  </td>
));

jest.mock('@mui/material/TableContainer', () => ({ children, sx, component, ...props }) => (
  <div 
    data-testid="mui-table-container" 
    data-sx={JSON.stringify(sx)}
    {...props}
  >
    {children}
  </div>
));

jest.mock('@mui/material/Container', () => ({ children, ...props }) => (
  <div data-testid="mui-container" {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/TableRow', () => ({ children, sx, ...props }) => (
  <tr data-testid="mui-table-row" data-sx={JSON.stringify(sx)} {...props}>
    {children}
  </tr>
));

jest.mock('@mui/material/Paper', () => ({ children, ...props }) => (
  <div data-testid="mui-paper" {...props}>
    {children}
  </div>
));

describe('Modal Components', () => {
  describe('MuiModalTable', () => {
    const sampleTableContent = [
      {
        type: 'section',
        item_no: '1',
        description: 'Preliminary Works',
        quantity: null,
        unit: null,
        budget_rate: null,
        budget_total: null,
        tenderee_note: null
      },
      {
        type: 'grouped_heading',
        item_no: '1.1',
        description: 'Site Setup',
        quantity: null,
        unit: null,
        budget_rate: null,
        budget_total: null,
        tenderee_note: 'Important note'
      },
      {
        type: 'item',
        item_no: '1.1.1',
        description: 'Temporary fencing',
        quantity: '100',
        unit: 'm',
        budget_rate: '15.00',
        budget_total: '1500.00',
        tenderee_note: 'Include gates'
      }
    ];

    it('should render table with correct headers', () => {
      render(<MuiModalTable tableContent={sampleTableContent} />);

      expect(screen.getByTestId('mui-table-container')).toBeInTheDocument();
      expect(screen.getByTestId('mui-table')).toBeInTheDocument();
      expect(screen.getByTestId('mui-table-head')).toBeInTheDocument();

      // Check for header text
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Item No')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Unit')).toBeInTheDocument();
      expect(screen.getByText('Budget Rate')).toBeInTheDocument();
      expect(screen.getByText('Budget Total')).toBeInTheDocument();
      expect(screen.getByText('Tenderee Notes')).toBeInTheDocument();
    });

    it('should render table rows with correct data', () => {
      render(<MuiModalTable tableContent={sampleTableContent} />);

      expect(screen.getByText('section')).toBeInTheDocument();
      expect(screen.getByText('grouped_heading')).toBeInTheDocument();
      expect(screen.getByText('item')).toBeInTheDocument();
      
      expect(screen.getByText('Preliminary Works')).toBeInTheDocument();
      expect(screen.getByText('Site Setup')).toBeInTheDocument();
      expect(screen.getByText('Temporary fencing')).toBeInTheDocument();
      
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('m')).toBeInTheDocument();
      expect(screen.getByText('15.00')).toBeInTheDocument();
      expect(screen.getByText('1500.00')).toBeInTheDocument();
    });

    it('should apply correct styling for different row types', () => {
      render(<MuiModalTable tableContent={sampleTableContent} />);

      // All table rows should be rendered
      const tableRows = screen.getAllByTestId('mui-table-row');
      expect(tableRows.length).toBeGreaterThan(0);
    });

    it('should render tooltips for description and tenderee notes', () => {
      render(<MuiModalTable tableContent={sampleTableContent} />);

      const tooltips = screen.getAllByTestId('mui-tooltip');
      expect(tooltips.length).toBeGreaterThan(0);
      
      // Check specific tooltip titles
      expect(screen.getByTitle('Preliminary Works')).toBeInTheDocument();
      expect(screen.getByTitle('Important note')).toBeInTheDocument();
      expect(screen.getByTitle('Include gates')).toBeInTheDocument();
    });

    it('should use custom maxHeight', () => {
      render(<MuiModalTable tableContent={sampleTableContent} maxHeight="500px" />);

      const tableContainer = screen.getByTestId('mui-table-container');
      const containerSx = JSON.parse(tableContainer.getAttribute('data-sx'));
      expect(containerSx.maxHeight).toBe('500px');
      expect(containerSx.maxWidth).toBe('800px');
    });

    it('should handle empty table content', () => {
      render(<MuiModalTable tableContent={[]} />);

      expect(screen.getByTestId('mui-table')).toBeInTheDocument();
      expect(screen.getByTestId('mui-table-head')).toBeInTheDocument();
      expect(screen.getByTestId('mui-table-body')).toBeInTheDocument();
    });
  });

  describe('MuiModalErrorTable', () => {
    const sampleErrorContent = [
      {
        Row: 2,
        Column: 'Description',
        'Provided Value': '',
        'Error Type': 'Missing required field',
        'System Message': 'Please provide a description'
      },
      {
        Row: 3,
        Column: 'Quantity',
        'Provided Value': '-5',
        'Error Type': 'Invalid quantity',
        'System Message': 'Quantity must be positive'
      }
    ];

    const sampleFile = { name: 'test-file.xlsx' };

    it('should render error report header information', () => {
      render(<MuiModalErrorTable tableContent={sampleErrorContent} file={sampleFile} />);

      expect(screen.getByText('mocked-boq-error-report-1')).toBeInTheDocument();
      expect(screen.getByText(/mocked-boq-error-report-2/)).toBeInTheDocument();
      expect(screen.getByText('[test-file.xlsx]')).toBeInTheDocument();
      expect(screen.getByText(/December 15th 2023/)).toBeInTheDocument();
      expect(screen.getByText(/mocked-status/)).toBeInTheDocument();
      expect(screen.getByText('mocked-boq-error-report-4')).toBeInTheDocument();
    });

    it('should render error table with correct headers', () => {
      render(<MuiModalErrorTable tableContent={sampleErrorContent} file={sampleFile} />);

      expect(screen.getByText('Row')).toBeInTheDocument();
      expect(screen.getByText('Column')).toBeInTheDocument();
      expect(screen.getByText('Provided Value')).toBeInTheDocument();
      expect(screen.getByText('Error Type')).toBeInTheDocument();
      expect(screen.getByText('System Message')).toBeInTheDocument();
    });

    it('should render error data rows', () => {
      render(<MuiModalErrorTable tableContent={sampleErrorContent} file={sampleFile} />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Missing required field')).toBeInTheDocument();
      expect(screen.getByText('Please provide a description')).toBeInTheDocument();
      
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('-5')).toBeInTheDocument();
      expect(screen.getByText('Invalid quantity')).toBeInTheDocument();
      expect(screen.getByText('Quantity must be positive')).toBeInTheDocument();
    });

    it('should render recommendations section', () => {
      render(<MuiModalErrorTable tableContent={sampleErrorContent} file={sampleFile} />);

      expect(screen.getByText('mocked-boq-error-report-6:')).toBeInTheDocument();
      expect(screen.getByText('mocked-boq-error-report-7:')).toBeInTheDocument();
      expect(screen.getByText('mocked-boq-error-report-8')).toBeInTheDocument();
      expect(screen.getByText('mocked-boq-error-report-9:')).toBeInTheDocument();
      expect(screen.getByText('mocked-boq-error-report-10')).toBeInTheDocument();
      expect(screen.getByText('mocked-boq-error-report-11:')).toBeInTheDocument();
      expect(screen.getByText('mocked-boq-error-report-12')).toBeInTheDocument();
      expect(screen.getByText('mocked-boq-error-report-13')).toBeInTheDocument();
    });

    it('should use custom maxHeight and maxWidth', () => {
      render(
        <MuiModalErrorTable 
          tableContent={sampleErrorContent} 
          file={sampleFile}
          maxHeight="400px"
          maxWidth="1000px"
        />
      );

      const tableContainer = screen.getByTestId('mui-table-container');
      const containerSx = JSON.parse(tableContainer.getAttribute('data-sx'));
      expect(containerSx.maxHeight).toBe('400px');
      expect(containerSx.maxWidth).toBe('1000px');
    });

    it('should handle missing file', () => {
      render(<MuiModalErrorTable tableContent={sampleErrorContent} />);

      // Should still render without file information
      expect(screen.getByText('mocked-boq-error-report-1')).toBeInTheDocument();
    });
  });

  describe('MuiModalTextarea', () => {
    it('should render textarea with placeholder', () => {
      const placeholder = 'Enter your text here';
      render(<MuiModalTextarea placeholder={placeholder} />);

      const textarea = screen.getByTestId('mui-input-base');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', placeholder);
      expect(textarea).toHaveAttribute('data-multiline', 'true');
    });

    it('should apply correct styling', () => {
      render(<MuiModalTextarea placeholder="test" />);

      const textarea = screen.getByTestId('mui-input-base');
      const textareaSx = JSON.parse(textarea.getAttribute('data-sx'));
      
      expect(textareaSx.width).toBe('100%');
      expect(textareaSx.minHeight).toBe('180px');
      expect(textareaSx.alignItems).toBe('flex-start');
    });
  });

  describe('MuiModalUploadItem', () => {
    it('should render file information correctly', () => {
      const fileName = 'test-document.pdf';
      const size = 2048000; // 2MB in bytes
      const handleClick = jest.fn();

      render(<MuiModalUploadItem fileName={fileName} size={size} onClick={handleClick} />);

      expect(screen.getByText(fileName)).toBeInTheDocument();
      expect(screen.getByText('1.95mb')).toBeInTheDocument(); // 2048000 / 1024 / 1024 = 1.953125 → 1.95mb
      expect(screen.getByText('mocked-boq-remove')).toBeInTheDocument();
    });

    it('should display file size in KB for smaller files', () => {
      const fileName = 'small-file.txt';
      const size = 512000; // 500KB in bytes
      const handleClick = jest.fn();

      render(<MuiModalUploadItem fileName={fileName} size={size} onClick={handleClick} />);

      expect(screen.getByText('500.00kb')).toBeInTheDocument();
    });

    it('should handle remove button click', () => {
      const fileName = 'test-document.pdf';
      const size = 1024000;
      const handleClick = jest.fn();

      render(<MuiModalUploadItem fileName={fileName} size={size} onClick={handleClick} />);

      const removeButton = screen.getByText('mocked-boq-remove');
      fireEvent.click(removeButton);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle zero size', () => {
      const fileName = 'empty-file.txt';
      const size = 0;
      const handleClick = jest.fn();

      render(<MuiModalUploadItem fileName={fileName} size={size} onClick={handleClick} />);

      expect(screen.getByText('0kb')).toBeInTheDocument();
    });

    it('should handle null size', () => {
      const fileName = 'unknown-size.txt';
      const size = null;
      const handleClick = jest.fn();

      render(<MuiModalUploadItem fileName={fileName} size={size} onClick={handleClick} />);

      expect(screen.getByText('0kb')).toBeInTheDocument();
    });

    it('should break long file names', () => {
      const fileName = 'very-long-file-name-that-should-break-into-multiple-lines.pdf';
      const size = 1024;
      const handleClick = jest.fn();

      render(<MuiModalUploadItem fileName={fileName} size={size} onClick={handleClick} />);

      const fileNameElement = screen.getByText(fileName);
      expect(fileNameElement).toBeInTheDocument();
      
      const fileNameSx = JSON.parse(fileNameElement.getAttribute('data-sx'));
      expect(fileNameSx.wordBreak).toBe('break-all');
    });
  });

  describe('MuiModalButton', () => {
    it('should render button with children', () => {
      const buttonText = 'Click Me';
      const handleClick = jest.fn();

      render(<MuiModalButton onClick={handleClick}>{buttonText}</MuiModalButton>);

      const button = screen.getByText(buttonText);
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-variant', 'contained');
    });

    it('should handle click events', () => {
      const buttonText = 'Test Button';
      const handleClick = jest.fn();

      render(<MuiModalButton onClick={handleClick}>{buttonText}</MuiModalButton>);

      const button = screen.getByText(buttonText);
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should apply default styling', () => {
      render(<MuiModalButton onClick={() => {}}>Default</MuiModalButton>);

      const button = screen.getByText('Default');
      const buttonSx = JSON.parse(button.getAttribute('data-sx'));
      
      expect(buttonSx.fontSize).toBe('14px');
      expect(buttonSx.color).toBe('#ffffff');
      expect(buttonSx.borderRadius).toBe('20px');
      expect(buttonSx.boxShadow).toBe('none');
      expect(buttonSx.padding).toBe('4px 30px');
    });

    it('should merge custom styling with defaults', () => {
      const customSx = { backgroundColor: 'red', fontSize: '16px' };
      
      render(
        <MuiModalButton onClick={() => {}} sx={customSx}>
          Custom
        </MuiModalButton>
      );

      const button = screen.getByText('Custom');
      const buttonSx = JSON.parse(button.getAttribute('data-sx'));
      
      // Should include custom styles
      expect(buttonSx.backgroundColor).toBe('red');
      expect(buttonSx.fontSize).toBe('16px');
      
      // Should still include default styles
      expect(buttonSx.color).toBe('#ffffff');
      expect(buttonSx.borderRadius).toBe('20px');
    });

    it('should be wrapped in a grid container', () => {
      render(<MuiModalButton onClick={() => {}}>Grid Test</MuiModalButton>);

      const gridContainer = screen.getByTestId('mui-grid');
      expect(gridContainer).toHaveAttribute('data-container', 'true');
      
      const gridSx = JSON.parse(gridContainer.getAttribute('data-sx'));
      expect(gridSx.flexBasis).toBe('100%');
      expect(gridSx.justifyContent).toBe('flex-end');
    });
  });
});
