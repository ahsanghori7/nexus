import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Checkbox from './Checkbox';

describe('Checkbox Component', () => {
  it('renders without crashing', () => {
    render(<Checkbox label="Test Checkbox" name="test" />);
    expect(screen.getByText('Test Checkbox')).toBeInTheDocument();
  });

  it('renders with correct label', () => {
    render(<Checkbox label="Accept Terms" name="terms" />);
    expect(screen.getByText('Accept Terms')).toBeInTheDocument();
  });

  it('calls handleChange when clicked', () => {
    const mockHandleChange = jest.fn();
    render(
      <Checkbox 
        label="Test Change" 
        name="test-change" 
        handleChange={mockHandleChange}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('calls handleClick when clicked', () => {
    const mockHandleClick = jest.fn();
    render(
      <Checkbox 
        label="Test Click" 
        name="test-click" 
        handleClick={mockHandleClick}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockHandleClick).toHaveBeenCalled();
  });

  it('renders with value prop', () => {
    render(
      <Checkbox 
        label="Value Test" 
        name="value-test" 
        value="test-value"
      />
    );
    expect(screen.getByText('Value Test')).toBeInTheDocument();
  });

  it('has default handleClick function', () => {
    render(<Checkbox label="Default Click" name="default" />);
    const checkbox = screen.getByRole('checkbox');
    
    // Should not throw error when clicked without handleClick prop
    expect(() => fireEvent.click(checkbox)).not.toThrow();
  });

  it('takes a snapshot', () => {
    const { container } = render(
      <Checkbox 
        label="Snapshot Checkbox" 
        name="snapshot" 
        value="snapshot-value"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});