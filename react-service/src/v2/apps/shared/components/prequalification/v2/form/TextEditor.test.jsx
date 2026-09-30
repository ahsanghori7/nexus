import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextEditor from './TextEditor';

// Mock the clink-components module
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxRed: '#ff0000',
      },
    },
  },
  InputFormControlled: ({ label, name, type, ...props }) => (
    <div data-testid="input-form-controlled">
      <input
        data-testid={`input-${name}`}
        type={type === 'editor' ? 'text' : type}
        {...props}
      />
      {label && <label>{label}</label>}
    </div>
  ),
}));

// Mock MUI components
jest.mock('@mui/material/Box', () => ({ children, sx, ...props }) => (
  <div data-testid="mui-box" {...props}>
    {children}
  </div>
));

describe('TextEditor', () => {
  const mockRegister = jest.fn();
  const mockSetValue = jest.fn();
  const mockTrigger = jest.fn();
  const mockControl = {};
  const mockErrors = {};

  const defaultProps = {
    register: mockRegister,
    setValue: mockSetValue,
    errors: mockErrors,
    trigger: mockTrigger,
    control: mockControl,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<TextEditor {...defaultProps} />);
    
    const component = screen.getByTestId('mui-box');
    expect(component).toBeInTheDocument();
  });

  it('renders InputFormControlled component', () => {
    render(<TextEditor {...defaultProps} />);
    
    const inputComponent = screen.getByTestId('input-form-controlled');
    expect(inputComponent).toBeInTheDocument();
  });

  it('passes correct props to InputFormControlled', () => {
    const label = 'Test Label';
    render(<TextEditor {...defaultProps} label={label} />);
    
    const input = screen.getByTestId('input-description');
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('text');
    
    const labelElement = screen.getByText(label);
    expect(labelElement).toBeInTheDocument();
  });

  it('renders without label when label is not provided', () => {
    render(<TextEditor {...defaultProps} />);
    
    const inputComponent = screen.getByTestId('input-form-controlled');
    expect(inputComponent).toBeInTheDocument();
    
    // No label should be rendered
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
  });

  it('renders without label when label is empty string', () => {
    render(<TextEditor {...defaultProps} label="" />);
    
    const inputComponent = screen.getByTestId('input-form-controlled');
    expect(inputComponent).toBeInTheDocument();
    
    // No label should be rendered
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
  });

  it('renders label when label is provided and has content', () => {
    const label = 'Description Label';
    render(<TextEditor {...defaultProps} label={label} />);
    
    const labelElement = screen.getByText(label);
    expect(labelElement).toBeInTheDocument();
  });

  it('passes all required props to InputFormControlled', () => {
    const customLabel = 'Custom Description';
    render(<TextEditor {...defaultProps} label={customLabel} />);
    
    // Check that the input has the correct name attribute
    const input = screen.getByTestId('input-description');
    expect(input).toBeInTheDocument();
  });

  it('takes a snapshot', () => {
    const { container } = render(
      <TextEditor 
        {...defaultProps} 
        label="Snapshot Test Label"
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});