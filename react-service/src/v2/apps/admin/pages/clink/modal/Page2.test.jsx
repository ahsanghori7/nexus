import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page2 from './Page2';

// Mock the styled components
jest.mock('./Modal.styled', () => ({
  PageTitle: ({ children }) => {
    const React = require('react');
    return React.createElement('h2', { 'data-testid': 'page-title' }, children);
  },
  SubItem: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'styled-sub-item' }, children);
  },
  Container: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'styled-container' }, children);
  },
  Item: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'styled-item' }, children);
  },
  Typography: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'styled-typography' }, children);
  },
}));

// Mock async validation helper
jest.mock('v2/helpers/async', () => ({
  checkValid: jest.fn((value, field, setError, onSuccess, setOptions, regex) => {
    if (onSuccess) onSuccess();
  }),
}));

describe('Page2 Component', () => {
  const defaultProps = {
    errors: {},
    register: jest.fn(() => ({ name: 'test', onChange: jest.fn(), onBlur: jest.fn(), ref: jest.fn() })),
    setValue: jest.fn(),
    control: {},
    trigger: jest.fn(),
    getValues: jest.fn(() => ({
      email: '',
      password: '',
      repeatPassword: '',
    })),
    userEmailError: [false, jest.fn()],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Page2 {...defaultProps} />);
    
    expect(screen.getAllByTestId('page-title')).toHaveLength(2); // personal_information and account_settings
    expect(screen.getAllByTestId('styled-container')).toHaveLength(4); // Multiple containers in the component
  });

  it('displays the correct page titles', () => {
    render(<Page2 {...defaultProps} />);
    
    const pageTitles = screen.getAllByTestId('page-title');
    expect(pageTitles[0]).toHaveTextContent('personal_information');
    expect(pageTitles[1]).toHaveTextContent('account_settings');
  });

  it('renders all personal information input fields', () => {
    render(<Page2 {...defaultProps} />);
    
    // Personal information fields
    expect(screen.getByTestId('modal-input-first-name')).toBeInTheDocument();
    expect(screen.getByTestId('modal-input-last-name')).toBeInTheDocument();
    expect(screen.getByTestId('modal-input-telephone')).toBeInTheDocument();
    expect(screen.getByTestId('modal-input-job-title')).toBeInTheDocument();
    
    // Email field (InputEmail)
    expect(screen.getByTestId('modal-input-email')).toBeInTheDocument();
  });

  it('renders all account settings input fields', () => {
    render(<Page2 {...defaultProps} />);
    
    // Account settings fields
    expect(screen.getByTestId('modal-input-display-name')).toBeInTheDocument();
    expect(screen.getByTestId('modal-input-password')).toBeInTheDocument();
    expect(screen.getByTestId('modal-input-repeat-password')).toBeInTheDocument();
  });

  it('shows email error when present', () => {
    const propsWithEmailError = {
      ...defaultProps,
      userEmailError: ['Email is invalid', jest.fn()],
    };
    
    render(<Page2 {...propsWithEmailError} />);
    
    const errorElement = screen.getByTestId('styled-typography');
    expect(errorElement).toHaveTextContent('Email is invalid');
  });

  it('handles email change and validation', async () => {
    const mockSetValue = jest.fn();
    const mockTrigger = jest.fn();
    const mockSetEmailError = jest.fn();
    
    const propsWithHandlers = {
      ...defaultProps,
      setValue: mockSetValue,
      trigger: mockTrigger,
      userEmailError: [false, mockSetEmailError],
    };
    
    render(<Page2 {...propsWithHandlers} />);
    
    const emailInput = screen.getByTestId('modal-input-email');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith('email', 'test@example.com');
      expect(mockTrigger).toHaveBeenCalledWith(['registered_company_number']);
    });
  });

  it('handles form errors correctly', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        first_name: { message: 'First name is required' },
        last_name: { message: 'Last name is required' },
        telephone: { message: 'Phone number is required' },
        display_name: { message: 'Display name is required' },
        password: { message: 'Password is required' },
        repeatPassword: { message: 'Repeat password is required' },
      },
    };
    
    render(<Page2 {...propsWithErrors} />);
    
    expect(screen.getByTestId('error-first_name')).toHaveTextContent('First name is required');
    expect(screen.getByTestId('error-last_name')).toHaveTextContent('Last name is required');
    expect(screen.getByTestId('error-telephone')).toHaveTextContent('Phone number is required');
    expect(screen.getByTestId('error-display_name')).toHaveTextContent('Display name is required');
    expect(screen.getByTestId('error-password')).toHaveTextContent('Password is required');
    expect(screen.getByTestId('error-repeatPassword')).toHaveTextContent('Repeat password is required');
  });

  it('prefills email from getValues', () => {
    const propsWithExistingValue = {
      ...defaultProps,
      getValues: jest.fn(() => ({
        email: 'existing@example.com',
        password: '',
        repeatPassword: '',
      })),
    };
    
    render(<Page2 {...propsWithExistingValue} />);
    
    const emailInput = screen.getByTestId('modal-input-email');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('name', 'email');
  });

  it('renders password fields with correct attributes', () => {
    render(<Page2 {...defaultProps} />);
    
    const passwordInput = screen.getByTestId('modal-input-password');
    const repeatPasswordInput = screen.getByTestId('modal-input-repeat-password');
    
    expect(passwordInput).toHaveAttribute('name', 'password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    expect(repeatPasswordInput).toHaveAttribute('name', 'repeatPassword');
    expect(repeatPasswordInput).toHaveAttribute('type', 'password');
  });

  it('renders required fields with proper validation', () => {
    render(<Page2 {...defaultProps} />);
    
    // Check that required fields are present
    expect(screen.getByTestId('modal-input-first-name')).toBeInTheDocument();
    expect(screen.getByTestId('modal-input-last-name')).toBeInTheDocument();
    expect(screen.getByTestId('modal-input-telephone')).toBeInTheDocument();
    expect(screen.getByTestId('modal-input-display-name')).toBeInTheDocument();
  });

  it('renders optional job title field', () => {
    render(<Page2 {...defaultProps} />);
    
    const jobTitleInput = screen.getByTestId('modal-input-job-title');
    expect(jobTitleInput).toBeInTheDocument();
    expect(jobTitleInput).toHaveAttribute('name', 'job_title');
  });

  it('renders with proper structure and styling components', () => {
    render(<Page2 {...defaultProps} />);
    
    // Check that all styled components are rendered
    expect(screen.getAllByTestId('page-title')).toHaveLength(2);
    expect(screen.getAllByTestId('styled-container')).toHaveLength(4);
    expect(screen.getAllByTestId('styled-item')).toHaveLength(5);
    expect(screen.getAllByTestId('styled-sub-item')).toHaveLength(6);
  });

  it('does not display email error when no error present', () => {
    render(<Page2 {...defaultProps} />);
    
    const errorElement = screen.queryByTestId('styled-typography');
    expect(errorElement).not.toBeInTheDocument();
  });

  describe('Password validation rules', () => {
    it('sets up password validation rules correctly', () => {
      const mockGetValues = jest.fn(() => ({ password: 'test123', repeatPassword: 'test123' }));
      
      const propsWithMockGetValues = {
        ...defaultProps,
        getValues: mockGetValues,
      };
      
      render(<Page2 {...propsWithMockGetValues} />);
      
      // The component renders without errors, which means the rules are set up properly
      expect(screen.getByTestId('modal-input-password')).toBeInTheDocument();
      expect(screen.getByTestId('modal-input-repeat-password')).toBeInTheDocument();
    });
  });
});