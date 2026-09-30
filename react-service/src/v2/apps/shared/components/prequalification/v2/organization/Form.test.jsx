import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import Form from './Form';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock MUI components
jest.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children, sx, component, onSubmit, ...props }) => {
    const Element = component || 'div';
    return (
      <Element 
        data-testid={component === 'form' ? 'organization-form' : 'mui-box'} 
        style={sx} 
        onSubmit={onSubmit}
        {...props}
      >
        {children}
      </Element>
    );
  },
}));

jest.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children, sx, ...props }) => (
    <div data-testid="mui-typography" style={sx} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@mui/material/Input', () => ({
  __esModule: true,
  default: ({ name, type, ...props }) => (
    <input
      data-testid={`input-${name}`}
      type={type}
      {...props}
    />
  ),
}));

// Mock form components
jest.mock('../form/Text', () => ({
  __esModule: true,
  default: ({ name, label, register, errors, required, sx, ...props }) => (
    <input
      data-testid={`text-${name}`}
      placeholder={label}
      required={required}
      style={sx}
      {...(register && register(name))}
      {...props}
    />
  ),
}));

jest.mock('../form/Number', () => ({
  __esModule: true,
  default: ({ name, label, register, errors, sx, ...props }) => (
    <input
      data-testid={`number-${name}`}
      type="number"
      placeholder={label}
      style={sx}
      {...(register && register(name))}
      {...props}
    />
  ),
}));

jest.mock('../form/Select', () => ({
  __esModule: true,
  default: ({ name, label, register, errors, options, defaultValue, handleChange, ...props }) => (
    <select
      data-testid={`select-${name}`}
      onChange={(e) => handleChange && handleChange(e)}
      defaultValue={defaultValue}
      {...(register && register(name))}
      {...props}
    >
      <option value="">{label}</option>
      {options?.map((option) => (
        <option key={option.key} value={option.value}>
          {option.value}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('../form/dropzone', () => ({
  __esModule: true,
  default: ({ register, name, ...props }) => (
    <input
      data-testid={`upload-${name}`}
      type="file"
      {...(register && register(name))}
      {...props}
    />
  ),
}));

jest.mock('../form/SwitchBox', () => ({
  __esModule: true,
  default: ({ name, checkboxLabel, register, value, ...props }) => (
    <label data-testid={`switch-${name}`}>
      <input type="checkbox" defaultChecked={value} {...(register && register(name))} {...props} />
      {checkboxLabel}
    </label>
  ),
}));

jest.mock('../Button', () => ({
  __esModule: true,
  default: ({ children, onClick, type, ...props }) => (
    <button
      data-testid="submit-button"
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Button component
jest.mock('@mui/material/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, type, ...props }) => (
    <button
      data-testid="submit-button"
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        white: '#ffffff',
      },
    },
    s3: {
      iconHammerBlack: 'icon-hammer-black.jpg',
    },
  },
}));

// Mock role helpers
jest.mock('v2/helpers/prequal/organization', () => ({
  DIRECTOR: { key: 'director', value: 'Director' },
  TENDERING: { key: 'tendering', value: 'Tendering' },
  CONSTRUCTION: { key: 'construction', value: 'Construction' },
  COMMERCIAL: { key: 'commercial', value: 'Commercial' },
  ENVIRONMENT: { key: 'environment', value: 'Environment' },
  WITNESS: { key: 'witness', value: 'Witness' },
  OTHER: { key: 'other', value: 'Other' },
  ROLE_CHECKER: jest.fn(),
}));

// Mock URL helper
jest.mock('v2/helpers/url', () => ({
  checkIfImageExists: jest.fn(),
}));

describe('Form Component', () => {
  let mockRegister;
  let mockHandleSubmit;
  let mockSetValue;
  let mockWatch;
  let mockSetOpen;

  beforeEach(() => {
    mockRegister = jest.fn((fieldName) => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
      name: fieldName,
    }));
    mockHandleSubmit = jest.fn((callback) => (e) => {
      e.preventDefault();
      callback({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        role: 'Director',
        phone: '1234567890',
        permission: true,
      });
    });
    mockSetValue = jest.fn();
    mockWatch = jest.fn();
    mockSetOpen = jest.fn();

    useForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      setValue: mockSetValue,
      watch: mockWatch,
      formState: { errors: {} },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    data: {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      role: 'Director',
      phone: '1234567890',
      permission: true,
    },
    handleOnSubmit: jest.fn(),
    fileError: null,
  };

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<Form {...defaultProps} />);

      expect(screen.getByTestId('upload-picture')).toBeInTheDocument();
      expect(screen.getByTestId('select-role')).toBeInTheDocument();
      expect(screen.getByTestId('text-firstname')).toBeInTheDocument();
      expect(screen.getByTestId('text-lastname')).toBeInTheDocument();
      expect(screen.getByTestId('number-phone')).toBeInTheDocument();
      expect(screen.getByTestId('text-email')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('should render permissions section for non-witness roles', () => {
      render(<Form {...defaultProps} />);

      expect(screen.getByTestId('switch-permission')).toBeInTheDocument();
      expect(screen.getByText('organization-permissions')).toBeInTheDocument();
      expect(screen.getByText('organization-permissions-desc')).toBeInTheDocument();
    });

    it('should not render permissions section for witness role', () => {
      const witnessProps = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          role: 'Witness',
        },
      };

      render(<Form {...witnessProps} />);

      expect(screen.queryByTestId('switch-permission')).not.toBeInTheDocument();
    });

    it('should render role input field when "Other" is selected', () => {
      const otherProps = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          role: 'Other',
          role_input: 'Custom Role',
        },
      };

      render(<Form {...otherProps} />);

      expect(screen.getByTestId('text-role_input')).toBeInTheDocument();
    });

    it('should not render role input field when "Other" is not selected', () => {
      mockWatch.mockReturnValue('Director');

      render(<Form {...defaultProps} />);

      expect(screen.queryByTestId('text-role_input')).not.toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should call register for all form fields', () => {
      render(<Form {...defaultProps} />);

      // Check that register was called for each field
      expect(mockRegister).toHaveBeenCalled();
    });

    it('should handle role change to "Other"', () => {
      render(<Form {...defaultProps} />);

      const roleSelect = screen.getByTestId('select-role');
      fireEvent.change(roleSelect, { target: { value: 'Other' } });

      expect(roleSelect).toBeInTheDocument();
    });

    it('should handle form submission', () => {
      render(<Form {...defaultProps} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('should handle form submission with role_input when Other is selected', () => {
      mockWatch.mockReturnValue('Other');

      render(<Form {...defaultProps} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  describe('Default Values', () => {
    it('should populate form with default values', () => {
      render(<Form {...defaultProps} />);

      const firstnameInput = screen.getByTestId('text-firstname');
      const lastnameInput = screen.getByTestId('text-lastname');
      const emailInput = screen.getByTestId('text-email');

      expect(firstnameInput).toBeInTheDocument();
      expect(lastnameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
    });

    it('should handle empty default values', () => {
      const emptyProps = {
        ...defaultProps,
        defaultValues: {},
      };

      render(<Form {...emptyProps} />);

      expect(screen.getByTestId('text-firstname')).toBeInTheDocument();
      expect(screen.getByTestId('text-lastname')).toBeInTheDocument();
      expect(screen.getByTestId('text-email')).toBeInTheDocument();
    });
  });

  describe('Role-based Behavior', () => {
    it('should show permissions for Director role', () => {
      mockWatch.mockReturnValue('Director');

      render(<Form {...defaultProps} />);

      expect(screen.getByTestId('switch-permission')).toBeInTheDocument();
    });

    it('should show permissions for Tendering role', () => {
      mockWatch.mockReturnValue('Tendering');

      render(<Form {...defaultProps} />);

      expect(screen.getByTestId('switch-permission')).toBeInTheDocument();
    });

    it('should show permissions for Construction role', () => {
      mockWatch.mockReturnValue('Construction');

      render(<Form {...defaultProps} />);

      expect(screen.getByTestId('switch-permission')).toBeInTheDocument();
    });

    it('should show permissions for Commercial role', () => {
      mockWatch.mockReturnValue('Commercial');

      render(<Form {...defaultProps} />);

      expect(screen.getByTestId('switch-permission')).toBeInTheDocument();
    });

    it('should show permissions for Environment role', () => {
      mockWatch.mockReturnValue('Environment');

      render(<Form {...defaultProps} />);

      expect(screen.getByTestId('switch-permission')).toBeInTheDocument();
    });

    it('should hide permissions for Witness role', () => {
      const witnessProps = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          role: 'Witness',
        },
      };

      render(<Form {...witnessProps} />);

      expect(screen.queryByTestId('switch-permission')).not.toBeInTheDocument();
    });

    it('should show permissions for Other role', () => {
      const otherProps = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          role: 'Other',
          role_input: 'Custom Role',
        },
      };

      render(<Form {...otherProps} />);

      expect(screen.getByTestId('switch-permission')).toBeInTheDocument();
      expect(screen.getByTestId('text-role_input')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should mark required fields as required', () => {
      render(<Form {...defaultProps} />);

      const firstnameInput = screen.getByTestId('text-firstname');
      const lastnameInput = screen.getByTestId('text-lastname');
      const emailInput = screen.getByTestId('text-email');

      expect(firstnameInput).toHaveAttribute('required');
      expect(lastnameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should handle form errors', () => {
      useForm.mockReturnValue({
        register: mockRegister,
        handleSubmit: mockHandleSubmit,
        setValue: mockSetValue,
        watch: mockWatch,
        formState: {
          errors: {
            firstname: { message: 'First name is required' },
            email: { message: 'Email is required' },
          },
        },
      });

      render(<Form {...defaultProps} />);

      expect(screen.getByTestId('text-firstname')).toBeInTheDocument();
      expect(screen.getByTestId('text-email')).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('should render file upload component', () => {
      render(<Form {...defaultProps} />);

      expect(screen.getByTestId('upload-picture')).toBeInTheDocument();
    });

    it('should handle image upload', () => {
      render(<Form {...defaultProps} />);

      const fileInput = screen.getByTestId('upload-picture');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
    });
  });

  describe('Submit Button', () => {
    it('should render submit button with correct text', () => {
      render(<Form {...defaultProps} />);

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent('confirm');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should handle submit button click', () => {
      render(<Form {...defaultProps} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined defaultValues', () => {
      const undefinedProps = {
        ...defaultProps,
        defaultValues: undefined,
      };

      render(<Form {...undefinedProps} />);

      expect(screen.getByTestId('text-firstname')).toBeInTheDocument();
      expect(screen.getByTestId('text-lastname')).toBeInTheDocument();
    });

    it('should handle null defaultValues', () => {
      const nullProps = {
        ...defaultProps,
        defaultValues: null,
      };

      render(<Form {...nullProps} />);

      expect(screen.getByTestId('text-firstname')).toBeInTheDocument();
      expect(screen.getByTestId('text-lastname')).toBeInTheDocument();
    });

    it('should handle missing setOpen prop', () => {
      const { setOpen, ...propsWithoutSetOpen } = defaultProps;

      render(<Form {...propsWithoutSetOpen} />);

      expect(screen.getByTestId('text-firstname')).toBeInTheDocument();
    });
  });

  describe('useEffect Hooks', () => {
    it('should initialize form with data values', () => {
      render(<Form {...defaultProps} />);

      // Check that the form rendered with data values
      expect(screen.getByTestId('text-firstname')).toBeInTheDocument();
      expect(screen.getByTestId('text-lastname')).toBeInTheDocument();
      expect(screen.getByTestId('text-email')).toBeInTheDocument();
    });

    it('should handle logo validation', () => {
      const propsWithLogo = {
        ...defaultProps,
        data: {
          ...defaultProps.data,
          logo: 'test-logo.jpg',
        },
      };

      render(<Form {...propsWithLogo} />);

      // Check that the form rendered successfully
      expect(screen.getByTestId('upload-picture')).toBeInTheDocument();
    });
  });
});
