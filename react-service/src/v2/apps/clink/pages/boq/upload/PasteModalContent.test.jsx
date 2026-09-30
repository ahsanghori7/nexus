import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PasteModalContent from './PasteModalContent';

// Mock dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => {
    const translations = {
      'boq-paste-table-data': 'Paste Table Data',
      'boq-paste-description': 'Paste your data here',
      'boq-paste-here': 'Paste here',
      'continue': 'Continue',
    };
    return translations[key] || key;
  },
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkGreen: '#00C851',
        clinkLightPurple: '#E8E2F5',
      },
    },
  },
}));

jest.mock('./modal-components.mui', () => ({
  MuiModalTable: function MockMuiModalTable({ tableContent }) {
    return (
      <div data-testid="mock-table">
        {tableContent.map((row, rowIndex) => (
          <div key={rowIndex} data-testid={`row-${rowIndex}`}>
            {row.join(', ')}
          </div>
        ))}
      </div>
    );
  },
  MuiModalTextarea: function MockMuiModalTextarea({ placeholder }) {
    return (
      <textarea data-testid="mock-textarea" placeholder={placeholder} />
    );
  },
  MuiModalButton: function MockMuiModalButton({ children, sx }) {
    return (
      <button data-testid="mock-button" style={sx}>
        {children}
      </button>
    );
  },
}));

describe('PasteModalContent Component', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PasteModalContent />);
  });

  it('displays initial title and description', () => {
    render(<PasteModalContent />);
    
    expect(screen.getByText('Paste Table Data')).toBeInTheDocument();
    expect(screen.getByText('Paste your data here')).toBeInTheDocument();
  });

  it('initially shows textarea when no data is pasted', () => {
    render(<PasteModalContent />);
    
    const textarea = screen.getByTestId('mock-textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', 'Paste here');
  });

  it('does not show table initially', () => {
    render(<PasteModalContent />);
    
    const table = screen.queryByTestId('mock-table');
    expect(table).not.toBeInTheDocument();
  });

  it('does not show continue button initially', () => {
    render(<PasteModalContent />);
    
    const button = screen.queryByTestId('mock-button');
    expect(button).not.toBeInTheDocument();
  });

  it('handles paste event and shows table', () => {
    render(<PasteModalContent />);
    
    const pasteData = 'Header1\tHeader2\nValue1\tValue2\nValue3\tValue4';
    
    // Simulate paste event
    fireEvent.paste(window, {
      clipboardData: {
        getData: jest.fn(() => pasteData),
      },
    });
    
    const table = screen.getByTestId('mock-table');
    expect(table).toBeInTheDocument();
  });

  it('processes paste data correctly into rows and columns', () => {
    render(<PasteModalContent />);
    
    const pasteData = 'Col1\tCol2\nRow1Val1\tRow1Val2\nRow2Val1\tRow2Val2';
    
    fireEvent.paste(window, {
      clipboardData: {
        getData: jest.fn(() => pasteData),
      },
    });
    
    expect(screen.getByTestId('row-0')).toHaveTextContent('Col1, Col2');
    expect(screen.getByTestId('row-1')).toHaveTextContent('Row1Val1, Row1Val2');
    expect(screen.getByTestId('row-2')).toHaveTextContent('Row2Val1, Row2Val2');
  });

  it('shows row and column count when data is pasted', () => {
    render(<PasteModalContent />);
    
    const pasteData = 'A\tB\tC\nD\tE\tF\nG\tH\tI';
    
    fireEvent.paste(window, {
      clipboardData: {
        getData: jest.fn(() => pasteData),
      },
    });
    
    expect(screen.getByText('3 rows and 3 columns with headers:')).toBeInTheDocument();
  });

  it('shows continue button when data is pasted', () => {
    render(<PasteModalContent />);
    
    const pasteData = 'Header\nValue';
    
    fireEvent.paste(window, {
      clipboardData: {
        getData: jest.fn(() => pasteData),
      },
    });
    
    const button = screen.getByTestId('mock-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Continue');
  });

  it('hides textarea when data is pasted', () => {
    render(<PasteModalContent />);
    
    const pasteData = 'Header\nValue';
    
    fireEvent.paste(window, {
      clipboardData: {
        getData: jest.fn(() => pasteData),
      },
    });
    
    const textarea = screen.queryByTestId('mock-textarea');
    expect(textarea).not.toBeInTheDocument();
  });

  it('handles empty paste data gracefully', () => {
    render(<PasteModalContent />);
    
    fireEvent.paste(window, {
      clipboardData: {
        getData: jest.fn(() => ''),
      },
    });
    
    // Even empty string creates a row with empty content when split and trimmed
    // So we should expect the table to show, but with minimal content
    const table = screen.getByTestId('mock-table');
    expect(table).toBeInTheDocument();
  });

  it('trims whitespace from paste data', () => {
    render(<PasteModalContent />);
    
    const pasteData = '  \n  Header\tValue  \n  Data\tMore  \n  ';
    
    fireEvent.paste(window, {
      clipboardData: {
        getData: jest.fn(() => pasteData),
      },
    });
    
    expect(screen.getByTestId('row-0')).toHaveTextContent('Header, Value');
    expect(screen.getByTestId('row-1')).toHaveTextContent('Data, More');
  });

  it('matches snapshot with no data', () => {
    const { container } = render(<PasteModalContent />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with pasted data', () => {
    const { container } = render(<PasteModalContent />);
    
    const pasteData = 'A\tB\nC\tD';
    
    fireEvent.paste(window, {
      clipboardData: {
        getData: jest.fn(() => pasteData),
      },
    });
    
    expect(container.firstChild).toMatchSnapshot();
  });
});