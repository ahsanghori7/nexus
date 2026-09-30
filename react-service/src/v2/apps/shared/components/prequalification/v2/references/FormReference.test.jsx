import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormReference from './FormReference';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    reset: jest.fn(),
    trigger: jest.fn(),
    register: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(() => ({
      completion_date: '',
      contract_value: '',
    })),
    handleSubmit: jest.fn((fn) => (e) => {
      e.preventDefault();
      fn({
        section: 'references',
        id: '',
        project_name: 'Test Project',
        client_name: 'Test Client',
        completion_date: '',
        contract_value: '',
        contact_name: 'Test Contact',
        contact_email: 'test@example.com',
        sow: 'Test scope of work',
        document: [],
      });
    }),
    formState: {
      errors: {},
      isValid: true,
    },
  })),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock MUI components
jest.mock('@mui/material/Box', () => ({ children, ...props }) => (
  <div data-testid="form-box" {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/Input', () => ({ name, type }) => (
  <input data-testid={`input-${name}`} name={name} type={type} />
));

// Mock form components
jest.mock('../form/Date', () => ({ name, label, register, trigger, errors, setValue, value }) => (
  <div data-testid={`date-${name}`}>
    <label>{label}</label>
    <input name={name} type="date" />
  </div>
));

jest.mock('../form/Money', () => ({ name, label, register, errors, value }) => (
  <div data-testid={`money-${name}`}>
    <label>{label}</label>
    <input name={name} type="number" />
  </div>
));

jest.mock('../form/Text', () => ({ name, label, register, errors, required, type }) => (
  <div data-testid={`text-${name}`}>
    <label>{label}</label>
    <input name={name} type={type || 'text'} required={required === 'true'} />
  </div>
));

jest.mock('../form/Textarea', () => ({ name, label, register, errors }) => (
  <div data-testid={`textarea-${name}`}>
    <label>{label}</label>
    <textarea name={name} />
  </div>
));

jest.mock('../Button', () => ({ children, type, variant, color, fullWidth, disabled }) => (
  <button
    data-testid="submit-button"
    type={type}
    disabled={disabled}
    data-variant={variant}
    data-color={color}
    data-fullwidth={fullWidth}
  >
    {children}
  </button>
));

describe('FormReference', () => {
  const mockHandleOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      handleOnSubmit: mockHandleOnSubmit,
      ...props,
    };
    
    return render(<FormReference {...defaultProps} />);
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('form-box')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderComponent();
    
    // Check all form fields are present
    expect(screen.getByTestId('input-id')).toBeInTheDocument();
    expect(screen.getByTestId('input-section')).toBeInTheDocument();
    expect(screen.getByTestId('text-project_name')).toBeInTheDocument();
    expect(screen.getByTestId('text-client_name')).toBeInTheDocument();
    expect(screen.getByTestId('date-completion_date')).toBeInTheDocument();
    expect(screen.getByTestId('money-contract_value')).toBeInTheDocument();
    expect(screen.getByTestId('text-contact_name')).toBeInTheDocument();
    expect(screen.getByTestId('text-contact_email')).toBeInTheDocument();
    expect(screen.getByTestId('textarea-sow')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('renders with translated labels', () => {
    renderComponent();
    
    expect(screen.getByText('text-project-name')).toBeInTheDocument();
    expect(screen.getByText('references-client_name')).toBeInTheDocument();
    expect(screen.getByText('completion')).toBeInTheDocument();
    expect(screen.getByText('references-contract_value')).toBeInTheDocument();
    expect(screen.getByText('references-contact_name')).toBeInTheDocument();
    expect(screen.getByText('references-contact_email')).toBeInTheDocument();
    expect(screen.getByText('references-sow')).toBeInTheDocument();
    expect(screen.getByText('confirm')).toBeInTheDocument();
  });

  it('renders submit button with correct props', () => {
    renderComponent();
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toHaveAttribute('type', 'submit');
    expect(submitButton).toHaveAttribute('data-variant', 'contained');
    expect(submitButton).toHaveAttribute('data-color', 'error');
    expect(submitButton).toHaveAttribute('data-fullwidth', 'true');
    expect(submitButton).not.toBeDisabled(); // isValid is true by default
  });

  it('handles form submission', async () => {
    renderComponent();
    
    const form = screen.getByTestId('form-box');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockHandleOnSubmit).toHaveBeenCalledWith({
        section: 'references',
        id: '',
        project_name: 'Test Project',
        client_name: 'Test Client',
        completion_date: '',
        contract_value: '',
        contact_name: 'Test Contact',
        contact_email: 'test@example.com',
        sow: 'Test scope of work',
        document: [],
      });
    });
  });

  it('renders with existing data', () => {
    const mockData = {
      id: '123',
      project_name: 'Existing Project',
      client_name: 'Existing Client',
      completion_date: '2023-01-01',
      contract_value: '50000',
      contact_name: 'Existing Contact',
      contact_email: 'existing@example.com',
      sow: 'Existing scope',
      original_file: 'document.pdf',
      document: 'base64string',
    };

    renderComponent({ data: mockData });
    expect(screen.getByTestId('form-box')).toBeInTheDocument();
  });

  it('sets required attribute on required fields', () => {
    renderComponent();
    
    const projectNameInput = screen.getByTestId('text-project_name').querySelector('input');
    const clientNameInput = screen.getByTestId('text-client_name').querySelector('input');
    const contactNameInput = screen.getByTestId('text-contact_name').querySelector('input');
    const contactEmailInput = screen.getByTestId('text-contact_email').querySelector('input');
    
    expect(projectNameInput).toHaveAttribute('required');
    expect(clientNameInput).toHaveAttribute('required');
    expect(contactNameInput).toHaveAttribute('required');
    expect(contactEmailInput).toHaveAttribute('required');
  });

  it('sets email type on contact email field', () => {
    renderComponent();
    
    const contactEmailInput = screen.getByTestId('text-contact_email').querySelector('input');
    expect(contactEmailInput).toHaveAttribute('type', 'email');
  });

  it('renders hidden inputs correctly', () => {
    renderComponent();
    
    const idInput = screen.getByTestId('input-id');
    const sectionInput = screen.getByTestId('input-section');
    
    expect(idInput).toHaveAttribute('type', 'hidden');
    expect(sectionInput).toHaveAttribute('type', 'hidden');
  });
});

describe('FormReference with form validation', () => {
  const mockHandleOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useForm to return invalid form state
    require('react-hook-form').useForm.mockReturnValue({
      reset: jest.fn(),
      trigger: jest.fn(),
      register: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(() => ({
        completion_date: '2023-01-01',
        contract_value: '25000',
      })),
      handleSubmit: jest.fn((fn) => (e) => {
        e.preventDefault();
        fn({});
      }),
      formState: {
        errors: {
          project_name: { message: 'Required' },
          client_name: { message: 'Required' },
        },
        isValid: false,
      },
    });
  });

  it('disables submit button when form is invalid', () => {
    render(<FormReference handleOnSubmit={mockHandleOnSubmit} />);
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeDisabled();
  });

  it('passes current values to Date and Money components', () => {
    render(<FormReference handleOnSubmit={mockHandleOnSubmit} />);
    
    // The components should receive the current values from getValues()
    expect(screen.getByTestId('date-completion_date')).toBeInTheDocument();
    expect(screen.getByTestId('money-contract_value')).toBeInTheDocument();
  });
});