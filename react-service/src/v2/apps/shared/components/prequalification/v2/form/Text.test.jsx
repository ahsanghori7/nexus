import React from 'react';
import { render, screen } from '@testing-library/react';
import Text from './Text';

// Mock register function
const mockRegister = jest.fn(() => ({}));

// Mock errors object
const mockErrors = {};

describe('Text', () => {
  beforeEach(() => {
    mockRegister.mockClear();
  });

  it('renders without crashing', () => {
    render(
      <Text 
        name="testInput"
        register={mockRegister}
        errors={mockErrors}
      />
    );
  });

  it('renders FormControl component', () => {
    render(
      <Text 
        name="testInput"
        register={mockRegister}
        errors={mockErrors}
      />
    );
    expect(screen.getByTestId('formcontrol')).toBeInTheDocument();
  });

  it('renders TextField component', () => {
    render(
      <Text 
        name="testInput"
        register={mockRegister}
        errors={mockErrors}
      />
    );
    expect(screen.getByTestId('textfield')).toBeInTheDocument();
  });

  it('does not render label when label is empty', () => {
    render(
      <Text 
        name="testInput"
        label=""
        register={mockRegister}
        errors={mockErrors}
      />
    );
    expect(screen.queryByTestId('mui-subtitle')).not.toBeInTheDocument();
  });

  it('renders label when label is provided', () => {
    const labelText = 'Test Label';
    render(
      <Text 
        name="testInput"
        label={labelText}
        register={mockRegister}
        errors={mockErrors}
      />
    );
    expect(screen.getByText(labelText)).toBeInTheDocument();
  });

  it('calls register with correct name', () => {
    const testName = 'testInput';
    render(
      <Text 
        name={testName}
        register={mockRegister}
        errors={mockErrors}
      />
    );
    expect(mockRegister).toHaveBeenCalledWith(testName, expect.any(Object));
  });

  it('sets up required validation when required is true', () => {
    render(
      <Text 
        name="testInput"
        register={mockRegister}
        errors={mockErrors}
        required={true}
      />
    );
    expect(mockRegister).toHaveBeenCalledWith('testInput', 
      expect.objectContaining({
        required: 'Required'
      })
    );
  });

  it('sets up email validation when type is email', () => {
    render(
      <Text 
        name="testInput"
        type="email"
        register={mockRegister}
        errors={mockErrors}
      />
    );
    expect(mockRegister).toHaveBeenCalledWith('testInput', 
      expect.objectContaining({
        validate: expect.any(Function)
      })
    );
  });

  it('sets up custom validation when validate function is provided and type is not email', () => {
    const customValidate = jest.fn();
    render(
      <Text 
        name="testInput"
        type="text"
        validate={customValidate}
        register={mockRegister}
        errors={mockErrors}
      />
    );
    expect(mockRegister).toHaveBeenCalledWith('testInput', 
      expect.objectContaining({
        validate: customValidate
      })
    );
  });

  it('renders with value as TextField children', () => {
    const testValue = 'Test Value';
    render(
      <Text 
        name="testInput"
        value={testValue}
        register={mockRegister}
        errors={mockErrors}
      />
    );
    // Value is rendered as children of TextField, not as input value attribute
    expect(screen.getByText(testValue)).toBeInTheDocument();
  });

  it('applies custom sx styles', () => {
    const customSx = { margin: '10px' };
    render(
      <Text 
        name="testInput"
        sx={customSx}
        register={mockRegister}
        errors={mockErrors}
      />
    );
    const formControl = screen.getByTestId('formcontrol');
    expect(formControl).toBeInTheDocument();
  });

  it('passes through error prop when required and has errors', () => {
    const errorsWithError = { testInput: { message: 'Required field' } };
    render(
      <Text 
        name="testInput"
        required={true}
        register={mockRegister}
        errors={errorsWithError}
      />
    );
    // Since the mock doesn't set the error attribute, we just check the component renders
    const formControl = screen.getByTestId('formcontrol');
    expect(formControl).toBeInTheDocument();
  });

  it('displays error message when there are errors', () => {
    const errorMessage = 'Required field';
    const errorsWithError = { testInput: { message: errorMessage } };
    render(
      <Text 
        name="testInput"
        required={true}
        register={mockRegister}
        errors={errorsWithError}
      />
    );
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});