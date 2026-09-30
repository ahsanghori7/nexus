import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Content from './Content';

describe('Content component', () => {
  const mockSetShow = jest.fn();
  const mockAddTemplate = jest.fn();
  const mockSetError = jest.fn();
  const mockTemplates = [
    { name: 'Existing Template 1' },
    { name: 'Existing Template 2' },
  ];

  const defaultProps = {
    setShow: mockSetShow,
    addTemplate: mockAddTemplate,
    loading: false,
    setError: mockSetError,
    templates: mockTemplates,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with required props', () => {
    render(<Content {...defaultProps} />);

    expect(screen.getByLabelText(/Name this package/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter name of package/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Go back/i })
    ).toBeInTheDocument();
  });

  test('handles text input correctly', () => {
    render(<Content {...defaultProps} />);

    const input = screen.getByLabelText(/Name this package/i);
    fireEvent.change(input, { target: { value: 'New Template' } });

    expect(input.value).toBe('New Template');
    expect(mockSetError).toHaveBeenCalledWith(false);
  });

  test('Create button is disabled when text input is empty', () => {
    render(<Content {...defaultProps} />);

    const createButton = screen.getByRole('button', { name: /Create/i });
    expect(createButton).toBeDisabled();

    const input = screen.getByLabelText(/Name this package/i);
    fireEvent.change(input, { target: { value: 'New Template' } });

    expect(createButton).not.toBeDisabled();
  });

  test('Create button is disabled when loading is true', () => {
    render(<Content {...defaultProps} loading={true} />);

    const input = screen.getByLabelText(/Name this package/i);
    fireEvent.change(input, { target: { value: 'New Template' } });

    const createButton = screen.getByRole('button', { name: /Create/i });
    expect(createButton).toBeDisabled();
  });

  test('Go back button is disabled when loading is true', () => {
    render(<Content {...defaultProps} loading={true} />);

    const goBackButton = screen.getByRole('button', { name: /Go back/i });
    expect(goBackButton).toBeDisabled();
  });

  test('clicking Go back button calls setShow with false', () => {
    render(<Content {...defaultProps} />);

    const goBackButton = screen.getByRole('button', { name: /Go back/i });
    fireEvent.click(goBackButton);

    expect(mockSetShow).toHaveBeenCalledWith(false);
  });

  test('clicking Create button with a new template name adds the template and closes the form', () => {
    render(<Content {...defaultProps} />);

    const input = screen.getByLabelText(/Name this package/i);
    fireEvent.change(input, { target: { value: 'New Template' } });

    const createButton = screen.getByRole('button', { name: /Create/i });
    fireEvent.click(createButton);

    expect(mockAddTemplate).toHaveBeenCalledWith('New Template');
    expect(mockSetShow).toHaveBeenCalledWith(false);
  });

  test('clicking Create button with an existing template name shows error message', () => {
    render(<Content {...defaultProps} />);

    const input = screen.getByLabelText(/Name this package/i);
    fireEvent.change(input, { target: { value: 'Existing Template 1' } });

    const createButton = screen.getByRole('button', { name: /Create/i });
    fireEvent.click(createButton);

    expect(mockAddTemplate).not.toHaveBeenCalled();
    expect(mockSetShow).not.toHaveBeenCalled();
    expect(
      screen.getByText(/A tender with this name already exists/i)
    ).toBeInTheDocument();
  });
});
