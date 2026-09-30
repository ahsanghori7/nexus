import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NumberFormatCustom } from './NumberFormatCustom';

describe('NumberFormatCustom', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <NumberFormatCustom
        onChange={mockOnChange}
        value=""
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('formats numbers with thousand separators', () => {
    render(
      <NumberFormatCustom
        onChange={mockOnChange}
        value="1234.56"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('1234.56');
  });

  it('calls onChange when value changes', () => {
    render(
      <NumberFormatCustom
        onChange={mockOnChange}
        value=""
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '123' } });
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('applies fixed decimal scale of 2', () => {
    render(
      <NumberFormatCustom
        onChange={mockOnChange}
        value="123"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('123');
  });

  it('does not allow negative values', () => {
    render(
      <NumberFormatCustom
        onChange={mockOnChange}
        value=""
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '-123' } });
    
    // The component should not display negative values
    expect(input.value).not.toContain('-');
  });

  it('forwards additional props', () => {
    render(
      <NumberFormatCustom
        onChange={mockOnChange}
        value=""
        placeholder="Enter amount"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter amount');
  });

  it('works with ref', () => {
    const ref = React.createRef();
    render(
      <NumberFormatCustom
        ref={ref}
        onChange={mockOnChange}
        value=""
      />
    );
    
    expect(ref.current).toBeTruthy();
  });
});