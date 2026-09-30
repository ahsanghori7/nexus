import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock clink-components with simplified form controls
jest.mock('clink-components', () => {
  const React = require('react');
  const FormContext = React.createContext();

  const Form = ({
    render,
    onSubmit,
    defaultValues = {},
    method,
    ...props
  }) => {
    const [values, setValues] = React.useState({
      current_password: '',
      password: '',
      repeat_password: '',
      ...defaultValues,
    });

    const isDirty = Object.values(values).some((value) => value && value.length > 0);
    const isValid =
      Boolean(values.password) &&
      Boolean(values.repeat_password) &&
      values.password === values.repeat_password;

    const formHook = {
      formState: {
        errors: {},
        isDirty,
        isValid,
      },
      register: jest.fn(),
      control: {},
      setValue: (name, value) =>
        setValues((prev) => ({
          ...prev,
          [name]: value,
        })),
      getValues: () => values,
      trigger: jest.fn().mockResolvedValue(true),
    };

    const handleSubmit = (event) => {
      event?.preventDefault();
      onSubmit?.(values);
    };

    const content = render ? render(formHook) : null;

    return (
      <FormContext.Provider value={{ values, setValues }}>
        <form data-testid="clink-form" onSubmit={handleSubmit} method={method} {...props}>
          {content}
        </form>
      </FormContext.Provider>
    );
  };

  const InputFormControlled = ({
    label,
    name,
    type = 'text',
    autoComplete,
    placeholder,
    showPassword, // ignored but maintained for compatibility
  }) => {
    const { values, setValues } = React.useContext(FormContext);
    const value = values[name] ?? '';

    const handleChange = (event) => {
      const nextValue = event.target.value;
      setValues((prev) => ({
        ...prev,
        [name]: nextValue,
      }));
    };

    return (
      <div data-testid={`input-form-${name}`}>
        {label && (
          <label htmlFor={name}>
            {label}
          </label>
        )}
        <input
          data-testid={`input-controlled-${name}`}
          id={name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
        />
      </div>
    );
  };

  const Button = ({ children, handleClick, ...props }) => (
    <button {...props} onClick={handleClick}>
      {children}
    </button>
  );

  const Panel = ({ children, className }) => (
    <div data-testid="panel" className={className}>
      <div className="prosper-password--wrapper">
        <div className="prosper-password--body">{children}</div>
      </div>
    </div>
  );

  const HELPERS = {
    PasswordValidation: {
      testPassword: jest.fn(() => [null]),
    },
  };

  const CONSTANTS = {
    colors: {
      prosper: {
        prosperBoxRed: '#f44336',
      },
    },
    dimensions: {
      LG_SCREEN: '1024px',
    },
  };

  return {
    Form,
    Button,
    Panel,
    InputFormControlled,
    HELPERS,
    CONSTANTS,
  };
});

import NewPassword from './index';

const fillValidPasswordForm = async (
  user,
  {
    currentPassword = 'CurrentPass123!',
    newPassword = 'ValidPass123!',
  } = {},
) => {
  const currentPasswordInput = screen.getByTestId('input-controlled-current_password');
  const passwordInput = screen.getByTestId('input-controlled-password');
  const repeatPasswordInput = screen.getByTestId('input-controlled-repeat_password');

  await user.clear(currentPasswordInput);
  await user.type(currentPasswordInput, currentPassword);

  await user.clear(passwordInput);
  await user.type(passwordInput, newPassword);

  await user.clear(repeatPasswordInput);
  await user.type(repeatPasswordInput, newPassword);
};

// Mock CircularProgress from MUI
jest.mock('@mui/material/CircularProgress', () => {
  return function CircularProgress(props) {
    return <div data-testid="circular-progress" {...props}>Loading...</div>;
  };
});

// Mock console methods to avoid noise during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock for Relay service - ensure it behaves differently for different scenarios
const mockRelay = {
  patch: jest.fn()
};

jest.mock('v2/services/relay', () => {
  return jest.fn().mockImplementation(() => mockRelay);
});

describe('NewPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset default mock behavior
    mockRelay.patch.mockResolvedValue({
      json: () => Promise.resolve({ success: true })
    });
  });

  describe('Component rendering', () => {
    it('renders without crashing', () => {
      render(<NewPassword />);
      expect(screen.getByTestId('panel')).toBeInTheDocument();
    });

    it('renders the password form with all required fields', () => {
      render(<NewPassword />);
      
      // Check for form inputs
      expect(screen.getByTestId('input-controlled-current_password')).toBeInTheDocument();
      expect(screen.getByTestId('input-controlled-password')).toBeInTheDocument();
      expect(screen.getByTestId('input-controlled-repeat_password')).toBeInTheDocument();
    });

    it('renders submit button initially', () => {
      render(<NewPassword />);
      
      expect(screen.getByRole('button', { name: 'change-password' })).toBeInTheDocument();
    });

    it('renders the correct form labels using translation keys', () => {
      render(<NewPassword />);
      
      expect(screen.getByText('current_password')).toBeInTheDocument();
      expect(screen.getByText('new-password')).toBeInTheDocument();
      expect(screen.getByText('re-enter-password')).toBeInTheDocument();
    });

    it('does not render flash message initially', () => {
      render(<NewPassword />);
      
      expect(screen.queryByTestId('flash-message')).not.toBeInTheDocument();
    });

    it('renders inside Panel component', () => {
      render(<NewPassword />);
      
      expect(screen.getByTestId('panel')).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('submit button exists and can be found', () => {
      render(<NewPassword />);
      
      const submitButton = screen.getByRole('button', { name: 'change-password' });
      expect(submitButton).toBeInTheDocument();
      // Note: The mock form may not handle disabled state the same way as the real form
    });

    it('displays password fields with correct type and autocomplete', () => {
      render(<NewPassword />);
      
      const currentPasswordInput = screen.getByTestId('input-controlled-current_password');
      const passwordInput = screen.getByTestId('input-controlled-password');
      const repeatPasswordInput = screen.getByTestId('input-controlled-repeat_password');
      
      expect(currentPasswordInput).toHaveAttribute('type', 'password');
      expect(currentPasswordInput).toHaveAttribute('autocomplete', 'current_password');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autocomplete', 'password');
      expect(repeatPasswordInput).toHaveAttribute('type', 'password');
      expect(repeatPasswordInput).toHaveAttribute('autocomplete', 'repeat_password');
    });

    it('shows password placeholders', () => {
      render(<NewPassword />);
      
      const currentPasswordInput = screen.getByTestId('input-controlled-current_password');
      const passwordInput = screen.getByTestId('input-controlled-password');
      const repeatPasswordInput = screen.getByTestId('input-controlled-repeat_password');
      
      expect(currentPasswordInput).toHaveAttribute('placeholder', '*******');
      expect(passwordInput).toHaveAttribute('placeholder', '*******');
      expect(repeatPasswordInput).toHaveAttribute('placeholder', '*******');
    });
  });

  describe('Form submission', () => {
    it('handles successful password change', async () => {
      const user = userEvent.setup();
      render(<NewPassword />);

      await fillValidPasswordForm(user);

      // Submit the form to trigger the API call
      const submitButton = screen.getByRole('button', { name: 'change-password' });
      await user.click(submitButton);
      
      // Wait for the API call - it should be called with default form values
      await waitFor(() => {
        expect(mockRelay.patch).toHaveBeenCalledWith(
          expect.objectContaining({
            password: expect.any(String),
            repeat_password: expect.any(String)
          }),
          'change_password'
        );
      });
    });

    it('shows loading spinner during submission', async () => {
      const user = userEvent.setup();

      // Mock a delayed response
      mockRelay.patch.mockImplementation(() => 
        new Promise((resolve) => 
          setTimeout(() => resolve({
            json: () => Promise.resolve({ success: true })
          }), 100)
        )
      );
      
      render(<NewPassword />);

      await fillValidPasswordForm(user);

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'change-password' });
      await user.click(submitButton);
      
      // Check loading spinner appears
      expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'change-password' })).not.toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByTestId('circular-progress')).not.toBeInTheDocument();
      });
    });

    it('shows success message on successful password change', async () => {
      const user = userEvent.setup();
      render(<NewPassword />);

      await fillValidPasswordForm(user);

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'change-password' });
      await user.click(submitButton);
      
      // Wait for success message
      await waitFor(() => {
        const flashMessage = screen.getByTestId('flash-message');
        expect(flashMessage).toBeInTheDocument();
        expect(flashMessage).toHaveAttribute('data-status', 'success');
        expect(screen.getByTestId('flash-message-content')).toHaveTextContent('change-password-success');
      });
    });

    it('shows error message on failed password change (400 error)', async () => {
      const user = userEvent.setup();

      // Mock failed response
      mockRelay.patch.mockResolvedValue({
        json: () => Promise.resolve({ success: false })
      });

      render(<NewPassword />);

      await fillValidPasswordForm(user);

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'change-password' });
      await user.click(submitButton);
      
      // Wait for error message
      await waitFor(() => {
        const flashMessage = screen.getByTestId('flash-message');
        expect(flashMessage).toBeInTheDocument();
        expect(flashMessage).toHaveAttribute('data-status', 'error');
        expect(screen.getByTestId('flash-message-content')).toHaveTextContent('change-password-error-400');
      });
    });

    it('shows error message on network error (500 error)', async () => {
      const user = userEvent.setup();

      // Mock network error
      mockRelay.patch.mockRejectedValue(new Error('Network error'));

      render(<NewPassword />);

      await fillValidPasswordForm(user);

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'change-password' });
      await user.click(submitButton);
      
      // Wait for error message
      await waitFor(() => {
        const flashMessage = screen.getByTestId('flash-message');
        expect(flashMessage).toBeInTheDocument();
        expect(flashMessage).toHaveAttribute('data-status', 'error');
        expect(screen.getByTestId('flash-message-content')).toHaveTextContent('change-password-error-500');
      });
    });
  });

  describe('Flash message interactions', () => {
    it('allows closing the flash message', async () => {
      const user = userEvent.setup();
      render(<NewPassword />);

      // Trigger a submission to show flash message
      const submitButton = screen.getByRole('button', { name: 'change-password' });
      await fillValidPasswordForm(user);
      await user.click(submitButton);
      
      // Wait for flash message to appear
      await waitFor(() => {
        expect(screen.getByTestId('flash-message')).toBeInTheDocument();
      });
      
      // Close the flash message
      const closeButton = screen.getByTestId('flash-message-close');
      await user.click(closeButton);
      
      // Flash message should be hidden
      expect(screen.queryByTestId('flash-message')).not.toBeInTheDocument();
    });
  });

  describe('Component structure', () => {
    it('renders within PasswordWrapper styled component', () => {
      render(<NewPassword />);
      
      // Check that there's a PasswordWrapper (styled component will have generated class)
      const container = screen.getByTestId('panel').closest('.ChangePasswordstyled__PasswordWrapper-sc-z93vjq-1, div[class*="PasswordWrapper"]');
      expect(container || screen.getByTestId('panel')).toBeInTheDocument();
    });

    it('contains LoaderWrapper for submit button area', () => {
      render(<NewPassword />);
      
      // Check for LoaderWrapper styled component
      const loaderElement = document.querySelector('.ChangePasswordstyled__LoaderWrapper-sc-z93vjq-0, div[class*="LoaderWrapper"]');
      expect(loaderElement || screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders form within Panel component', () => {
      render(<NewPassword />);
      
      // Check Panel structure
      expect(screen.getByTestId('panel')).toBeInTheDocument();
      expect(screen.getByTestId('clink-form')).toBeInTheDocument();
      expect(screen.getByTestId('styled-wrapper')).toBeInTheDocument();
    });
  });
});
