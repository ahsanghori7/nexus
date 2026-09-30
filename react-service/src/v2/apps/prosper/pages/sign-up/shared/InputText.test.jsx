import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InputText from './InputText';

// Mock Adornment component
const MockAdornment = ({ showPassword, setShowPassword }) => (
  <button 
    data-testid="mock-adornment"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? 'Hide' : 'Show'}
  </button>
);

describe('InputText Component', () => {
  it('renders without crashing', () => {
    render(<InputText name="test" label="Test Input" />);
    expect(screen.getByText('Test Input')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(
      <InputText 
        name="test" 
        label="Test Input" 
        placeholder="Enter text here"
      />
    );
    expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
  });

  it('handles text input type correctly', () => {
    render(
      <InputText 
        name="text-input" 
        label="Text Input" 
        type="text"
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('handles password input type correctly', () => {
    render(
      <InputText 
        name="password-input" 
        label="Password Input" 
        type="password"
      />
    );
    // Password inputs don't have textbox role, so we'll find it by name
    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders with adornment component', () => {
    render(
      <InputText 
        name="password-with-adornment" 
        label="Password" 
        type="password"
        Adornment={MockAdornment}
      />
    );
    expect(screen.getByTestId('mock-adornment')).toBeInTheDocument();
  });

  it('toggles password visibility with adornment', () => {
    render(
      <InputText 
        name="password-toggle" 
        label="Password" 
        type="password"
        Adornment={MockAdornment}
      />
    );
    
    const input = screen.getByDisplayValue('');
    const toggleButton = screen.getByTestId('mock-adornment');
    
    // Initially should be password type
    expect(input).toHaveAttribute('type', 'password');
    
    // Click to show password
    fireEvent.click(toggleButton);
    
    // Should change to text type
    expect(input).toHaveAttribute('type', 'text');
  });

  it('handles value prop', () => {
    render(
      <InputText 
        name="value-input" 
        label="Value Input" 
        value="test value"
      />
    );
    const input = screen.getByDisplayValue('test value');
    expect(input).toHaveValue('test value');
  });

  it('handles disabled state', () => {
    render(
      <InputText 
        name="disabled-input" 
        label="Disabled Input" 
        disabled={true}
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('handles readonly state', () => {
    render(
      <InputText 
        name="readonly-input" 
        label="Readonly Input" 
        readOnly={true}
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readOnly');
  });

  it('does not mark the input readonly by default', () => {
    render(
      <InputText 
        name="editable-input" 
        label="Editable Input" 
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('readOnly');
  });

  it('calls handleChange when input changes', () => {
    const mockHandleChange = jest.fn();
    render(
      <InputText 
        name="change-input" 
        label="Change Input" 
        handleChange={mockHandleChange}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('displays password validation box when errors exist', () => {
    const passwordErrors = ['Password too short', 'Password needs numbers'];
    render(
      <InputText 
        name="password-validation" 
        label="Password" 
        type="password"
        passwordErrors={passwordErrors}
      />
    );
    
    expect(screen.getByTestId('password-validation-box')).toBeInTheDocument();
    expect(screen.getByTestId('password-error-0')).toHaveTextContent('Password too short');
    expect(screen.getByTestId('password-error-1')).toHaveTextContent('Password needs numbers');
  });

  it('does not display password validation box when no errors', () => {
    render(
      <InputText 
        name="no-validation" 
        label="Password" 
        type="password"
        passwordErrors={[]}
      />
    );
    
    expect(screen.queryByTestId('password-validation-box')).not.toBeInTheDocument();
  });

  it('renders with custom styles', () => {
    const customStyles = { inputMb: 2 };
    render(
      <InputText 
        name="styled-input" 
        label="Styled Input" 
        styles={customStyles}
      />
    );
    expect(screen.getByText('Styled Input')).toBeInTheDocument();
  });

  it('renders label with correct text', () => {
    render(
      <InputText 
        name="label-test" 
        label="Custom Label Text" 
      />
    );
    expect(screen.getByText('Custom Label Text')).toBeInTheDocument();
  });

  it('takes a snapshot', () => {
    const { container } = render(
      <InputText 
        name="snapshot" 
        label="Snapshot Input" 
        placeholder="Test placeholder"
        type="text"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});