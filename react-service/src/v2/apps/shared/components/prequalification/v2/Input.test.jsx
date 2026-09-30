import React from 'react';
import { render, screen } from '@testing-library/react';
import Input from './Input';

describe('Input', () => {
  it('renders without crashing', () => {
    render(<Input />);
  });

  it('renders TextField component', () => {
    render(<Input />);
    expect(screen.getByTestId('textfield')).toBeInTheDocument();
  });

  it('passes params to TextField', () => {
    const params = { 
      placeholder: 'Test placeholder',
      value: 'Test value'
    };
    render(<Input params={params} />);
    
    const textField = screen.getByTestId('textfield');
    expect(textField.querySelector('input')).toHaveAttribute('placeholder', 'Test placeholder');
    expect(textField.querySelector('input')).toHaveAttribute('value', 'Test value');
  });

  it('renders with standard variant', () => {
    render(<Input />);
    const textField = screen.getByTestId('textfield');
    expect(textField.querySelector('input')).toHaveAttribute('variant', 'standard');
  });

  it('handles missing params gracefully', () => {
    render(<Input />);
    expect(screen.getByTestId('textfield')).toBeInTheDocument();
  });

  it('passes through params when provided', () => {
    const params = {
      disabled: true,
      'data-custom': 'test-value'
    };
    render(<Input params={params} />);
    
    const textField = screen.getByTestId('textfield');
    const inputElement = textField.querySelector('input');
    expect(inputElement).toHaveAttribute('disabled');
    expect(inputElement).toHaveAttribute('data-custom', 'test-value');
  });
});