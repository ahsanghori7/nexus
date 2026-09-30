import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusLight, { getStatusColor } from './StatusLight';

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Return the RGB format
  return `rgb(${r}, ${g}, ${b})`;
}

// Mock the CONSTANTS import
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        amber: '#FFA500', // Using orange as amber for the test
        darkerRed: '#8B0000' // Using dark red
      }
    }
  }
}));

// Mock MUI components
jest.mock('@mui/material/Box', () => {
  return function MockBox(props) {
    const { children, display, flexDirection, alignItems, justifyContent, p, width, height, borderRadius, bgcolor } = props;
    
    const style = {
      display,
      flexDirection,
      alignItems,
      justifyContent,
      padding: p ? `${p * 8}px` : undefined,
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: typeof borderRadius === 'string' ? borderRadius : undefined,
      backgroundColor: bgcolor,
    };

    return (
      <div data-testid={props['data-testid']} style={style}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Tooltip', () => {
  return function MockTooltip({ children, title }) {
    return <div data-tooltip={title}>{children}</div>;
  };
});

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        amber: '#FFA500', // Using orange as amber for the test
        darkerRed: '#8B0000' // Using dark red
      }
    }
  }
}));

describe('StatusLight', () => {
  it('renders with default amber status when no statusesRow provided', () => {
    render(<StatusLight />);

    const innerBox = screen.getByTestId('mui-box-inner');
    const tooltipContainer = screen.getByText((content, element) => {
      return element.getAttribute('data-tooltip') === 'PQQ Partially completed';
    });

    expect(innerBox).toBeInTheDocument();
    expect(innerBox.style.backgroundColor).toBe(hexToRgb('#FFA500')); // Amber color
    expect(tooltipContainer).toBeInTheDocument();
  });

  it('renders darkerRed status for all not started', () => {
    const statusesRow = [{ status: '0' }, { status: '0' }, { status: '0' }];

    render(<StatusLight statusesRow={statusesRow} />);

    const innerBox = screen.getByTestId('mui-box-inner');
    const tooltipContainer = screen.getByText((content, element) => {
      return element.getAttribute('data-tooltip') === 'PQQ Not started';
    });

    expect(innerBox).toBeInTheDocument();
    expect(innerBox.style.backgroundColor).toBe(hexToRgb('#8B0000')); // DarkerRed color
    expect(tooltipContainer).toBeInTheDocument();
  });

  it('renders green status for all finished', () => {
    const statusesRow = [{ status: '1' }, { status: '1' }, { status: '1' }];

    render(<StatusLight statusesRow={statusesRow} />);

    const innerBox = screen.getByTestId('mui-box-inner');
    const tooltipContainer = screen.getByText((content, element) => {
      return element.getAttribute('data-tooltip') === 'PQQ Completed';
    });

    expect(innerBox).toBeInTheDocument();
    // Green is already a named color, so we can use it directly
    expect(innerBox.style.backgroundColor).toBe('green');
    expect(tooltipContainer).toBeInTheDocument();
  });

  it('renders amber status for partially completed', () => {
    const statusesRow = [{ status: '1' }, { status: '0' }, { status: '1' }];

    render(<StatusLight statusesRow={statusesRow} />);

    const innerBox = screen.getByTestId('mui-box-inner');
    const tooltipContainer = screen.getByText((content, element) => {
      return element.getAttribute('data-tooltip') === 'PQQ Partially completed';
    });

    expect(innerBox).toBeInTheDocument();
    expect(innerBox.style.backgroundColor).toBe(hexToRgb('#FFA500')); // Amber color
    expect(tooltipContainer).toBeInTheDocument();
  });

  it('renders with correct styling', () => {
    render(<StatusLight />);

    const outerBox = screen.getByTestId('mui-box-outer');
    const innerBox = screen.getByTestId('mui-box-inner');

    expect(outerBox.style).toMatchObject({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '17.6px', // 2.2 * 8px
    });

    expect(innerBox.style).toMatchObject({
      width: '12px',
      height: '12px',
      borderRadius: '50%',
    });
  });
});

describe('getStatusColor', () => {
  it('returns green color and completed text for FINISHED status', () => {
    const result = getStatusColor('FINISHED');
    
    expect(result).toEqual({
      color: 'green',
      text: 'PQQ Completed'
    });
  });

  it('returns darkerRed color and not started text for NOT_STARTED status', () => {
    const result = getStatusColor('NOT_STARTED');
    
    expect(result).toEqual({
      color: '#8B0000', // darkerRed from mock
      text: 'PQQ Not started'
    });
  });

  it('returns amber color and partially completed text for default/unknown status', () => {
    const result = getStatusColor('UNKNOWN_STATUS');
    
    expect(result).toEqual({
      color: '#FFA500', // amber from mock
      text: 'PQQ Partially completed'
    });
  });

  it('returns amber color and partially completed text for undefined status', () => {
    const result = getStatusColor();
    
    expect(result).toEqual({
      color: '#FFA500', // amber from mock
      text: 'PQQ Partially completed'
    });
  });

  it('returns amber color and partially completed text for empty string status', () => {
    const result = getStatusColor('');
    
    expect(result).toEqual({
      color: '#FFA500', // amber from mock
      text: 'PQQ Partially completed'
    });
  });

  it('returns amber color and partially completed text for STARTED status', () => {
    const result = getStatusColor('STARTED');
    
    expect(result).toEqual({
      color: '#FFA500', // amber from mock
      text: 'PQQ Partially completed'
    });
  });
});