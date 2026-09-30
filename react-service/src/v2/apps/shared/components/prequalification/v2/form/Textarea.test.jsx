import React from 'react';
import { render, screen } from '@testing-library/react';
import Textarea from './Textarea';

jest.mock('v2/apps/shared/components/company-v2/Mui.styled', () => ({
  MuiSubtitle: ({ children, ...props }) => (
    <h3 data-testid="mui-subtitle" {...props}>
      {children}
    </h3>
  ),
}));

describe('Textarea', () => {
  const defaultProps = {
    name: 'description',
    label: 'Description',
    value: 'Initial value',
    errors: {},
    register: jest.fn(() => ({
      name: 'description',
      required: true,
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic textarea structure', () => {
    render(<Textarea {...defaultProps} />);
    
    expect(screen.getByTestId('formcontrol')).toBeInTheDocument();
    expect(screen.getByTestId('outlined-input')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Textarea {...defaultProps} label="Test Label" />);
    
    const subtitle = screen.getByTestId('mui-subtitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle).toHaveTextContent('Test Label');
  });

  it('does not render label when empty', () => {
    render(<Textarea {...defaultProps} label="" />);
    
    expect(screen.queryByTestId('mui-subtitle')).not.toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    const propsWithoutLabel = { ...defaultProps };
    delete propsWithoutLabel.label;
    
    render(<Textarea {...propsWithoutLabel} />);
    
    expect(screen.queryByTestId('mui-subtitle')).not.toBeInTheDocument();
  });

  it('passes correct props to FormControl', () => {
    const customSx = { backgroundColor: 'red' };
    render(<Textarea {...defaultProps} sx={customSx} />);
    
    const formControl = screen.getByTestId('formcontrol');
    // FormControl receives the props but our simple mock doesn't convert them to attributes
    expect(formControl).toBeInTheDocument();
    expect(formControl).toHaveAttribute('sx');
  });

  it('passes correct props to OutlinedInput', () => {
    render(<Textarea {...defaultProps} />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toHaveAttribute('label', 'Description');
    expect(input).toHaveAttribute('minrows', '4');
    expect(input).toHaveAttribute('type', 'text');
    // Note: textarea elements show content as innerHTML, not attributes
    expect(input).toHaveTextContent('Initial value');
  });

  it('calls register with correct arguments', () => {
    const mockRegister = jest.fn(() => ({ name: 'test' }));
    render(<Textarea {...defaultProps} register={mockRegister} name="testField" />);
    
    expect(mockRegister).toHaveBeenCalledWith('testField', {
      required: true,
    });
  });

  it('handles error state correctly', () => {
    const errorsWithField = { description: 'This field is required' };
    render(<Textarea {...defaultProps} errors={errorsWithField} />);
    
    const formControl = screen.getByTestId('formcontrol');
    const input = screen.getByTestId('outlined-input');
    
    // Check that FormControl and OutlinedInput are rendered (error handling works)
    expect(formControl).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    // Error message should be rendered
    expect(screen.getByTestId('form-helper-text')).toBeInTheDocument();
  });

  it('renders error message when field has error', () => {
    const errorsWithField = { description: 'This field is required' };
    render(<Textarea {...defaultProps} errors={errorsWithField} />);
    
    const errorMessage = screen.getByTestId('form-helper-text');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Required');
  });

  it('does not render error message when no errors', () => {
    render(<Textarea {...defaultProps} errors={{}} />);
    
    expect(screen.queryByTestId('form-helper-text')).not.toBeInTheDocument();
  });

  it('handles custom type prop', () => {
    render(<Textarea {...defaultProps} type="email" />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('uses default type when not provided', () => {
    const propsWithoutType = { ...defaultProps };
    delete propsWithoutType.type;
    
    render(<Textarea {...propsWithoutType} />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('passes custom sx prop to FormControl', () => {
    const customSx = { margin: '10px', backgroundColor: 'blue' };
    render(<Textarea {...defaultProps} sx={customSx} />);
    
    const formControl = screen.getByTestId('formcontrol');
    expect(formControl).toHaveAttribute('sx');
  });

  it('uses empty object as default sx when not provided', () => {
    const propsWithoutSx = { ...defaultProps };
    delete propsWithoutSx.sx;
    
    render(<Textarea {...propsWithoutSx} />);
    
    const formControl = screen.getByTestId('formcontrol');
    expect(formControl).toHaveAttribute('sx');
  });

  it('handles empty value prop', () => {
    render(<Textarea {...defaultProps} value="" />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toHaveTextContent('');
  });

  it('handles undefined value prop', () => {
    render(<Textarea {...defaultProps} value={undefined} />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toBeInTheDocument();
  });

  it('maintains multiline and minRows properties', () => {
    render(<Textarea {...defaultProps} />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toHaveAttribute('minrows', '4');
  });

  it('applies custom styling to OutlinedInput', () => {
    render(<Textarea {...defaultProps} />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toHaveAttribute('sx');
  });

  it('spreads register return value to OutlinedInput', () => {
    const mockRegister = jest.fn(() => ({
      name: 'testField',
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    }));
    
    render(<Textarea {...defaultProps} register={mockRegister} />);
    
    const input = screen.getByTestId('outlined-input');
    expect(input).toHaveAttribute('name', 'testField');
  });
});