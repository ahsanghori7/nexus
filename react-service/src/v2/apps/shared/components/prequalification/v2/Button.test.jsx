import React from 'react';
import { render, screen } from '@testing-library/react';
import Button from './Button';

// Mock MUI Button component
jest.mock('@mui/material', () => ({
  Button: ({ children, sx, ...props }) => (
    <button 
      data-testid="mui-button" 
      data-sx={JSON.stringify(sx)}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button />);
  });

  it('renders with default label "Save" when no children provided', () => {
    render(<Button />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders children when provided instead of label', () => {
    render(<Button>Custom Text</Button>);
    expect(screen.getByText('Custom Text')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<Button label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('children take precedence over label prop', () => {
    render(<Button label="Label Prop">Children Text</Button>);
    expect(screen.getByText('Children Text')).toBeInTheDocument();
    expect(screen.queryByText('Label Prop')).not.toBeInTheDocument();
  });

  it('applies default styles and allows style overrides', () => {
    const customSx = { color: 'red', marginTop: '10px' };
    render(<Button sx={customSx} />);
    
    const button = screen.getByTestId('mui-button');
    const appliedStyles = JSON.parse(button.getAttribute('data-sx'));
    
    expect(appliedStyles).toEqual({
      height: '50px',
      paddingTop: '10px',
      color: 'red',
      marginTop: '10px',
    });
  });

  it('passes through additional props to MUI Button', () => {
    render(<Button disabled variant="outlined" />);
    
    const button = screen.getByTestId('mui-button');
    expect(button).toHaveAttribute('disabled');
    expect(button).toHaveAttribute('variant', 'outlined');
  });

  it('handles empty children gracefully', () => {
    render(<Button>{''}</Button>);
    expect(screen.getByTestId('mui-button')).toBeInTheDocument();
  });
});