import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  CompanyFirstName,
  CompanyLastName,
  CompanyName,
  CompanyEmail,
  UserEmail,
  CompanyJobDescription,
  CompanyRegisteredAddress,
  EnableOperatingAddress,
  CompanyNumber,
  CompanyStatus,
  CompanyLandlineNumber,
  CompanyMobileNumber,
  CompanyWebsiteUrl,
  CompanyLinkedInUrl,
  CompanyVatRegistration,
} from './inputs';

// Mock clink-components
jest.mock('clink-components', () => ({
  InputForm: ({ label, name, register, rules, errors, ...props }) => {
    // Filter out props that shouldn't be passed to input element
    const { defaultValue, type, autoComplete, placeholder, readOnly } = props;
    const inputProps = { defaultValue, type, autoComplete, placeholder, readOnly };
    
    return (
      <div data-testid={`input-form-${name}`}>
        <label htmlFor={name}>{label}</label>
        <input id={name} name={name} {...inputProps} />
      </div>
    );
  },
  InputFormControlled: ({ label, name, control, rules, errors, ...props }) => {
    // Filter out props that shouldn't be passed to input element
    const { value, type, autoComplete, placeholder } = props;
    const inputProps = { value, type, autoComplete, placeholder };
    
    return (
      <div data-testid={`input-form-controlled-${name}`}>
        <label htmlFor={name}>{label}</label>
        <input id={name} name={name} {...inputProps} />
      </div>
    );
  },
}));

// Mock i18n
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key, // Return key as translation
}));

// Mock styled components
jest.mock('./styled', () => ({
  StyledCheckboxWrapper: ({ children }) => <div data-testid="checkbox-wrapper">{children}</div>,
}));

describe('Company Details Input Components', () => {
  const mockRegister = jest.fn(() => ({}));
  const mockErrors = {};
  const defaultProps = {
    register: mockRegister,
    errors: mockErrors,
    value: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Component Rendering', () => {
    it('renders CompanyFirstName without crashing', () => {
      const value = { firstname: 'John' };
      render(<CompanyFirstName {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-firstname')).toBeInTheDocument();
    });

    it('renders CompanyLastName without crashing', () => {
      const value = { lastname: 'Doe' };
      render(<CompanyLastName {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-lastname')).toBeInTheDocument();
    });

    it('renders CompanyName without crashing', () => {
      const value = { name: 'Test Company' };
      render(<CompanyName {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-name')).toBeInTheDocument();
    });

    it('renders CompanyEmail without crashing', () => {
      const value = { email: 'test@company.com' };
      render(<CompanyEmail {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-email')).toBeInTheDocument();
    });

    it('renders UserEmail without crashing', () => {
      const value = { email: 'user@test.com' };
      render(<UserEmail {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-email')).toBeInTheDocument();
    });

    it('renders CompanyJobDescription without crashing', () => {
      const value = { description: 'Test description' };
      render(<CompanyJobDescription {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-job_description')).toBeInTheDocument();
    });

    it('renders CompanyRegisteredAddress without crashing', () => {
      const value = { registered_address: '123 Test Street' };
      render(<CompanyRegisteredAddress {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-registered_address')).toBeInTheDocument();
    });

    it('renders EnableOperatingAddress without crashing', () => {
      render(<EnableOperatingAddress {...defaultProps} />);
      expect(screen.getByTestId('checkbox-wrapper')).toBeInTheDocument();
    });

    it('renders CompanyNumber without crashing', () => {
      const value = { company_number: '12345678' };
      render(<CompanyNumber {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-reg_number')).toBeInTheDocument();
    });

    it('renders CompanyStatus without crashing', () => {
      const value = { status: 'Active' };
      render(<CompanyStatus {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-status')).toBeInTheDocument();
    });

    it('renders CompanyLandlineNumber without crashing', () => {
      const value = { landline: '+44123456789' };
      render(<CompanyLandlineNumber {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-landline')).toBeInTheDocument();
    });

    it('renders CompanyMobileNumber without crashing', () => {
      const value = { mobile: '+44987654321' };
      render(<CompanyMobileNumber {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-mobile')).toBeInTheDocument();
    });

    it('renders CompanyWebsiteUrl without crashing', () => {
      const value = { website_url: 'https://example.com' };
      render(<CompanyWebsiteUrl {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-website')).toBeInTheDocument();
    });

    it('renders CompanyLinkedInUrl without crashing', () => {
      const value = { linkedin_url: 'https://linkedin.com/company/test' };
      render(<CompanyLinkedInUrl {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-linkedin')).toBeInTheDocument();
    });

    it('renders CompanyVatRegistration without crashing', () => {
      const value = { vat_registration: 'GB123456789' };
      render(<CompanyVatRegistration {...defaultProps} value={value} />);
      expect(screen.getByTestId('input-form-vat_number')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles empty values gracefully', () => {
      render(<CompanyFirstName {...defaultProps} value={{}} />);
      expect(screen.getByTestId('input-form-firstname')).toBeInTheDocument();
    });

    it('handles custom rules', () => {
      const customRules = { required: 'This field is required' };
      render(<CompanyFirstName {...defaultProps} rules={customRules} value={{}} />);
      expect(screen.getByTestId('input-form-firstname')).toBeInTheDocument();
    });

    it('handles readOnly prop for CompanyName', () => {
      render(<CompanyName {...defaultProps} value={{}} readOnly={true} />);
      expect(screen.getByTestId('input-form-name')).toBeInTheDocument();
    });

    it('passes errors to components', () => {
      const errors = { firstname: { message: 'Error message' } };
      render(<CompanyFirstName {...defaultProps} errors={errors} value={{}} />);
      expect(screen.getByTestId('input-form-firstname')).toBeInTheDocument();
    });
  });
});