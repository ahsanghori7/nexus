import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SimpleInput } from './index';

// Mock the BASE_DIRS
jest.mock('v2/helpers/url', () => ({
  BASE_DIRS: {
    V2: {
      PROSPER: 'prosper',
      CLINK: 'clink'
    }
  }
}));

// Mock the CONSTANTS import
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxGreen: '#4CAF50'
      },
      general: {
        white: '#FFFFFF',
        black: '#000000',
        lightPeriwinkle: '#C5C9E3'
      }
    },
    fonts: {
      proxima_nova1: 'Proxima Nova',
      proxima_nova2: 'proxima-nova',
      avantGardeGothicPRO: 'Avant Garde Gothic'
    }
  }
}));

// Mock MUI components
jest.mock('@mui/material/FormControl', () => {
  return function MockFormControl({ children, sx, variant }) {
    return (
      <div data-testid="form-control" data-variant={variant}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Tooltip', () => {
  return function MockTooltip({ children, title, arrow, sx }) {
    return (
      <div data-testid="tooltip" data-title={title?.props?.children || title}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Typography', () => {
  return function MockTypography({ children, sx }) {
    return <span data-testid="typography">{children}</span>;
  };
});

jest.mock('@mui/material/OutlinedInput', () => {
  return function MockOutlinedInput({ disabled, defaultValue, sx }) {
    return (
      <input 
        data-testid="outlined-input"
        disabled={disabled}
        value={defaultValue || ''}
        readOnly
      />
    );
  };
});

describe('SimpleInput', () => {
  it('renders without crashing', () => {
    render(<SimpleInput value="Test Value" />);
    
    expect(screen.getByTestId('form-control')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('outlined-input')).toBeInTheDocument();
  });

  it('displays the provided value', () => {
    const testValue = 'Test Input Value';
    render(<SimpleInput value={testValue} />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toHaveValue(testValue);
  });

  it('displays value in tooltip', () => {
    const testValue = 'Tooltip Test Value';
    render(<SimpleInput value={testValue} />);
    
    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-title', testValue);
  });

  it('renders as disabled input', () => {
    render(<SimpleInput value="Disabled Test" />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toBeDisabled();
  });

  it('renders with clink context by default', () => {
    render(<SimpleInput value="Default Context Test" />);
    
    // Component should render successfully with default context
    expect(screen.getByTestId('form-control')).toBeInTheDocument();
  });

  it('renders with prosper context', () => {
    render(<SimpleInput value="Prosper Context Test" context="prosper" />);
    
    // Component should render successfully with prosper context
    expect(screen.getByTestId('form-control')).toBeInTheDocument();
  });

  it('handles empty value', () => {
    render(<SimpleInput value="" />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toHaveValue('');
  });

  it('handles undefined value', () => {
    render(<SimpleInput />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toHaveValue('');
  });

  it('renders with outlined variant form control', () => {
    render(<SimpleInput value="Variant Test" />);
    
    const formControl = screen.getByTestId('form-control');
    expect(formControl).toHaveAttribute('data-variant', 'outlined');
  });

  it('handles long text values', () => {
    const longValue = 'This is a very long text value that might be truncated in the input field';
    render(<SimpleInput value={longValue} />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toHaveValue(longValue);
    
    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-title', longValue);
  });
});