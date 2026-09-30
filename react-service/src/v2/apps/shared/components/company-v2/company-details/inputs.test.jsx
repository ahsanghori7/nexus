import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  CompanyFirstName,
  CompanyLastName,
  CompanyEmail,
  UserEmail,
  CompanyJobDescription,
  CompanyRegisteredAddress,
  CompanyOperatingAddress,
  EnableOperatingAddress,
  CompanyStatus,
  CompanyLandlineNumber,
  CompanyMobileNumber,
  CompanyWebsiteUrl,
  CompanyLinkedInUrl,
  CompanyVatRegistration,
  CompanyStrapline,
  CompanyDescriptionInput,
} from './inputs';

// Mock clink-components
jest.mock('clink-components', () => ({
  InputForm: ({ label, name, defaultValue, type, placeholder, autoComplete, register, rules, errors, ...restProps }) => (
    <div data-testid={`input-form-${name}`}>
      <label>{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        data-testid={`input-${name}`}
      />
    </div>
  ),
  InputFormControlled: ({ label, name, value, type, placeholder, autoComplete, register, control, setValue, trigger, ...restProps }) => (
    <div data-testid={`input-form-controlled-${name}`}>
      <label>{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        data-testid={`input-controlled-${name}`}
        readOnly
      />
    </div>
  ),
}));

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

// Mock styled components
jest.mock('./styled', () => ({
  StyledCheckboxWrapper: ({ children, className }) => (
    <div className={className} data-testid="styled-checkbox-wrapper">
      {children}
    </div>
  ),
}));

// Mock MuiRequired component
jest.mock('../Mui.styled', () => ({
  MuiRequired: ({ children }) => (
    <span data-testid="mui-required">{children}</span>
  ),
}));

describe('Company Input Components', () => {
  // Mock props that are commonly used
  const mockRegister = jest.fn();
  const mockErrors = {};
  const mockDefaultRules = { required: 'Required' };
  const mockValue = {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    job_description: 'Developer',
    registered_address: '123 Main St',
    mobile: '1234567890',
    landline: '0987654321',
    website: 'www.example.com',
    linkedin: 'linkedin.com/company/example',
    vat_number: 'VAT123456',
    strapline: 'Best company ever',
    status: 'Active',
  };

  beforeEach(() => {
    mockRegister.mockClear();
  });

  describe('CompanyFirstName', () => {
    it('renders with default props', () => {
      render(
        <CompanyFirstName 
          register={mockRegister}
          errors={mockErrors}
          value={{ firstname: 'John' }}
        />
      );

      expect(screen.getByTestId('input-form-firstname')).toBeInTheDocument();
      expect(screen.getByTestId('input-firstname')).toBeInTheDocument();
      expect(screen.getByTestId('input-firstname')).toHaveAttribute('name', 'firstname');
      expect(screen.getByTestId('input-firstname')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-firstname')).toHaveAttribute('autocomplete', 'firstname');
      expect(screen.getByTestId('input-firstname')).toHaveValue('John');
    });

    it('renders with empty value', () => {
      render(
        <CompanyFirstName 
          register={mockRegister}
          errors={mockErrors}
          value={{}}
        />
      );

      expect(screen.getByTestId('input-firstname')).toHaveValue('');
    });

    it('renders with custom rules', () => {
      const customRules = { required: 'Custom required message' };
      render(
        <CompanyFirstName 
          register={mockRegister}
          rules={customRules}
          errors={mockErrors}
          value={{ firstname: 'Jane' }}
        />
      );

      expect(screen.getByTestId('input-firstname')).toBeInTheDocument();
    });

    it('displays required label', () => {
      render(
        <CompanyFirstName 
          register={mockRegister}
          errors={mockErrors}
          value={{ firstname: 'John' }}
        />
      );

      expect(screen.getByTestId('mui-required')).toBeInTheDocument();
      expect(screen.getByText('profile-firstname')).toBeInTheDocument();
    });
  });

  describe('CompanyLastName', () => {
    it('renders with default props', () => {
      render(
        <CompanyLastName 
          register={mockRegister}
          errors={mockErrors}
          value={{ lastname: 'Doe' }}
        />
      );

      expect(screen.getByTestId('input-form-lastname')).toBeInTheDocument();
      expect(screen.getByTestId('input-lastname')).toBeInTheDocument();
      expect(screen.getByTestId('input-lastname')).toHaveAttribute('name', 'lastname');
      expect(screen.getByTestId('input-lastname')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-lastname')).toHaveAttribute('autocomplete', 'lastname');
      expect(screen.getByTestId('input-lastname')).toHaveValue('Doe');
    });

    it('renders with empty value', () => {
      render(
        <CompanyLastName 
          register={mockRegister}
          errors={mockErrors}
          value={{}}
        />
      );

      expect(screen.getByTestId('input-lastname')).toHaveValue('');
    });

    it('displays required label', () => {
      render(
        <CompanyLastName 
          register={mockRegister}
          errors={mockErrors}
          value={{ lastname: 'Doe' }}
        />
      );

      expect(screen.getByTestId('mui-required')).toBeInTheDocument();
      expect(screen.getByText('profile-lastname')).toBeInTheDocument();
    });
  });

  describe('CompanyEmail', () => {
    it('renders with default props', () => {
      render(
        <CompanyEmail 
          register={mockRegister}
          errors={mockErrors}
          value={{ email: 'company@example.com' }}
        />
      );

      expect(screen.getByTestId('input-form-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-email')).toHaveAttribute('name', 'email');
      expect(screen.getByTestId('input-email')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-email')).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByTestId('input-email')).toHaveValue('company@example.com');
      expect(screen.getByTestId('input-email')).toHaveAttribute('placeholder', 'email-example');
    });

    it('renders with empty value', () => {
      render(
        <CompanyEmail 
          register={mockRegister}
          errors={mockErrors}
          value={{}}
        />
      );

      expect(screen.getByTestId('input-email')).toHaveValue( '');
    });

    it('displays required label', () => {
      render(
        <CompanyEmail 
          register={mockRegister}
          errors={mockErrors}
          value={{ email: 'test@example.com' }}
        />
      );

      expect(screen.getByTestId('mui-required')).toBeInTheDocument();
      expect(screen.getByText('profile-company-email')).toBeInTheDocument();
    });
  });

  describe('UserEmail', () => {
    it('renders with default props', () => {
      render(
        <UserEmail 
          register={mockRegister}
          errors={mockErrors}
          value={{ email: 'user@example.com' }}
        />
      );

      expect(screen.getByTestId('input-form-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-email')).toHaveAttribute('name', 'email');
      expect(screen.getByTestId('input-email')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-email')).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByTestId('input-email')).toHaveValue( 'user@example.com');
      expect(screen.getByTestId('input-email')).toHaveAttribute('placeholder', 'email-example');
    });

    it('displays required label', () => {
      render(
        <UserEmail 
          register={mockRegister}
          errors={mockErrors}
          value={{ email: 'user@example.com' }}
        />
      );

      expect(screen.getByTestId('mui-required')).toBeInTheDocument();
      expect(screen.getByText('profile-user-email')).toBeInTheDocument();
    });
  });

  describe('CompanyJobDescription', () => {
    it('renders with default props', () => {
      render(
        <CompanyJobDescription 
          register={mockRegister}
          errors={mockErrors}
          value={{ job_description: 'Software Developer' }}
        />
      );

      expect(screen.getByTestId('input-form-job_description')).toBeInTheDocument();
      expect(screen.getByTestId('input-job_description')).toBeInTheDocument();
      expect(screen.getByTestId('input-job_description')).toHaveAttribute('name', 'job_description');
      expect(screen.getByTestId('input-job_description')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-job_description')).toHaveAttribute('autocomplete', 'job_description');
      expect(screen.getByTestId('input-job_description')).toHaveValue( 'Software Developer');
    });

    it('renders with empty value', () => {
      render(
        <CompanyJobDescription 
          register={mockRegister}
          errors={mockErrors}
          value={{}}
        />
      );

      expect(screen.getByTestId('input-job_description')).toHaveValue( '');
    });

    it('displays label without required indicator', () => {
      render(
        <CompanyJobDescription 
          register={mockRegister}
          errors={mockErrors}
          value={{ job_description: 'Developer' }}
        />
      );

      expect(screen.getByText('profile-job-title')).toBeInTheDocument();
      expect(screen.queryByTestId('mui-required')).not.toBeInTheDocument();
    });
  });

  describe('CompanyRegisteredAddress', () => {
    it('renders with default props', () => {
      render(
        <CompanyRegisteredAddress 
          register={mockRegister}
          errors={mockErrors}
          value={{ registered_address: '123 Main St' }}
        />
      );

      expect(screen.getByTestId('input-form-registered_address')).toBeInTheDocument();
      expect(screen.getByTestId('input-registered_address')).toBeInTheDocument();
      expect(screen.getByTestId('input-registered_address')).toHaveAttribute('name', 'registered_address');
      expect(screen.getByTestId('input-registered_address')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-registered_address')).toHaveAttribute('autocomplete', 'registered_address');
      expect(screen.getByTestId('input-registered_address')).toHaveValue( '123 Main St');
      expect(screen.getByTestId('input-registered_address')).toHaveAttribute('placeholder', 'registered-company-address');
    });

    it('renders with custom type', () => {
      render(
        <CompanyRegisteredAddress 
          register={mockRegister}
          errors={mockErrors}
          value={{ registered_address: '456 Oak Ave' }}
          type="address"
        />
      );

      expect(screen.getByTestId('input-registered_address')).toHaveAttribute('type', 'address');
    });

    it('displays required label', () => {
      render(
        <CompanyRegisteredAddress 
          register={mockRegister}
          errors={mockErrors}
          value={{ registered_address: '123 Main St' }}
        />
      );

      expect(screen.getByTestId('mui-required')).toBeInTheDocument();
      expect(screen.getByText('profile-registered-company-address')).toBeInTheDocument();
    });
  });

  describe('CompanyOperatingAddress', () => {
    const mockGetValues = jest.fn(() => ({ operating_company_address: '789 Pine St' }));
    const mockSetValue = jest.fn();
    const mockTrigger = jest.fn();
    const mockControl = {};

    it('renders with default props', () => {
      render(
        <CompanyOperatingAddress 
          register={mockRegister}
          errors={mockErrors}
          getValues={mockGetValues}
          setValue={mockSetValue}
          trigger={mockTrigger}
          control={mockControl}
        />
      );

      expect(screen.getByTestId('input-form-controlled-operating_company_address')).toBeInTheDocument();
      expect(screen.getByTestId('input-controlled-operating_company_address')).toBeInTheDocument();
      expect(screen.getByTestId('input-controlled-operating_company_address')).toHaveAttribute('name', 'operating_company_address');
      expect(screen.getByTestId('input-controlled-operating_company_address')).toHaveAttribute('type', 'address');
      expect(screen.getByTestId('input-controlled-operating_company_address')).toHaveAttribute('autocomplete', 'operating_company_address');
      expect(screen.getByTestId('input-controlled-operating_company_address')).toHaveAttribute('value', '789 Pine St');
      expect(screen.getByTestId('input-controlled-operating_company_address')).toHaveAttribute('placeholder', 'enter-postcode');
    });

    it('renders with readOnly mode', () => {
      render(
        <CompanyOperatingAddress 
          register={mockRegister}
          errors={mockErrors}
          getValues={mockGetValues}
          setValue={mockSetValue}
          trigger={mockTrigger}
          control={mockControl}
          readOnly={true}
        />
      );

      expect(screen.getByTestId('input-controlled-operating_company_address')).toHaveAttribute('readOnly');
    });

    it('displays required label', () => {
      render(
        <CompanyOperatingAddress 
          register={mockRegister}
          errors={mockErrors}
          getValues={mockGetValues}
          setValue={mockSetValue}
          trigger={mockTrigger}
          control={mockControl}
        />
      );

      expect(screen.getByTestId('mui-required')).toBeInTheDocument();
      expect(screen.getByText('profile-operating-company-address')).toBeInTheDocument();
    });
  });

  describe('EnableOperatingAddress', () => {
    it('renders with default props', () => {
      render(
        <EnableOperatingAddress 
          register={mockRegister}
          errors={mockErrors}
        />
      );

      expect(screen.getByTestId('styled-checkbox-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('input-form-checked')).toBeInTheDocument();
      expect(screen.getByTestId('input-checked')).toBeInTheDocument();
      expect(screen.getByTestId('input-checked')).toHaveAttribute('name', 'checked');
      expect(screen.getByTestId('input-checked')).toHaveAttribute('type', 'checkbox');
      expect(screen.getByTestId('input-checked')).toHaveAttribute('autocomplete', 'checked');
    });

    it('renders with manual mode', () => {
      render(
        <EnableOperatingAddress 
          register={mockRegister}
          errors={mockErrors}
          manualMode={true}
        />
      );

      expect(screen.getByTestId('styled-checkbox-wrapper')).toHaveClass('checkbox-wrapper-manual-mode');
    });

    it('renders without manual mode', () => {
      render(
        <EnableOperatingAddress 
          register={mockRegister}
          errors={mockErrors}
          manualMode={false}
        />
      );

      expect(screen.getByTestId('styled-checkbox-wrapper')).toHaveClass('checkbox-wrapper');
    });

    it('displays label in uppercase', () => {
      render(
        <EnableOperatingAddress 
          register={mockRegister}
          errors={mockErrors}
        />
      );

      expect(screen.getByText('PROFILE-SAME-REGISTERED-ADDRESS')).toBeInTheDocument();
    });
  });

  describe('CompanyStatus', () => {
    it('renders with default props', () => {
      render(
        <CompanyStatus 
          register={mockRegister}
          errors={mockErrors}
          value={{ status: 'Active' }}
        />
      );

      expect(screen.getByTestId('input-form-status')).toBeInTheDocument();
      expect(screen.getByTestId('input-status')).toBeInTheDocument();
      expect(screen.getByTestId('input-status')).toHaveAttribute('name', 'status');
      expect(screen.getByTestId('input-status')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-status')).toHaveAttribute('autocomplete', 'status');
      expect(screen.getByTestId('input-status')).toHaveValue( 'Active');
    });

    it('renders with readOnly mode', () => {
      render(
        <CompanyStatus 
          register={mockRegister}
          errors={mockErrors}
          value={{ status: 'Inactive' }}
          readOnly={true}
        />
      );

      expect(screen.getByTestId('input-status')).toBeInTheDocument();
      expect(screen.getByTestId('input-status')).toHaveValue('Inactive');
    });

    it('displays label', () => {
      render(
        <CompanyStatus 
          register={mockRegister}
          errors={mockErrors}
          value={{ status: 'Active' }}
        />
      );

      expect(screen.getByText('profile-company-status')).toBeInTheDocument();
    });
  });

  describe('CompanyLandlineNumber', () => {
    it('renders with default props', () => {
      render(
        <CompanyLandlineNumber 
          register={mockRegister}
          errors={mockErrors}
          value={{ landline: '0123456789' }}
        />
      );

      expect(screen.getByTestId('input-form-landline')).toBeInTheDocument();
      expect(screen.getByTestId('input-landline')).toBeInTheDocument();
      expect(screen.getByTestId('input-landline')).toHaveAttribute('name', 'landline');
      expect(screen.getByTestId('input-landline')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-landline')).toHaveAttribute('autocomplete', 'landline');
      expect(screen.getByTestId('input-landline')).toHaveValue( '0123456789');
      expect(screen.getByTestId('input-landline')).toHaveAttribute('placeholder', 'landline-example');
    });

    it('renders with empty value', () => {
      render(
        <CompanyLandlineNumber 
          register={mockRegister}
          errors={mockErrors}
          value={{}}
        />
      );

      expect(screen.getByTestId('input-landline')).toHaveValue( '');
    });

    it('displays label', () => {
      render(
        <CompanyLandlineNumber 
          register={mockRegister}
          errors={mockErrors}
          value={{ landline: '0123456789' }}
        />
      );

      expect(screen.getByText('profile-landline-number')).toBeInTheDocument();
    });
  });

  describe('CompanyMobileNumber', () => {
    it('renders with default props', () => {
      render(
        <CompanyMobileNumber 
          register={mockRegister}
          errors={mockErrors}
          value={{ mobile: '0987654321' }}
        />
      );

      expect(screen.getByTestId('input-form-mobile')).toBeInTheDocument();
      expect(screen.getByTestId('input-mobile')).toBeInTheDocument();
      expect(screen.getByTestId('input-mobile')).toHaveAttribute('name', 'mobile');
      expect(screen.getByTestId('input-mobile')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-mobile')).toHaveAttribute('autocomplete', 'mobile');
      expect(screen.getByTestId('input-mobile')).toHaveValue( '0987654321');
      expect(screen.getByTestId('input-mobile')).toHaveAttribute('placeholder', 'mobile-number-example');
    });

    it('renders with empty value', () => {
      render(
        <CompanyMobileNumber 
          register={mockRegister}
          errors={mockErrors}
          value={{}}
        />
      );

      expect(screen.getByTestId('input-mobile')).toHaveValue( '');
    });

    it('displays required label', () => {
      render(
        <CompanyMobileNumber 
          register={mockRegister}
          errors={mockErrors}
          value={{ mobile: '0987654321' }}
        />
      );

      expect(screen.getByTestId('mui-required')).toBeInTheDocument();
      expect(screen.getByText('profile-mobile-number')).toBeInTheDocument();
    });
  });

  describe('CompanyWebsiteUrl', () => {
    it('renders with default props', () => {
      render(
        <CompanyWebsiteUrl 
          register={mockRegister}
          errors={mockErrors}
          value={{ website: 'www.example.com' }}
        />
      );

      expect(screen.getByTestId('input-form-website')).toBeInTheDocument();
      expect(screen.getByTestId('input-website')).toBeInTheDocument();
      expect(screen.getByTestId('input-website')).toHaveAttribute('name', 'website');
      expect(screen.getByTestId('input-website')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-website')).toHaveAttribute('autocomplete', 'website');
      expect(screen.getByTestId('input-website')).toHaveValue( 'www.example.com');
      expect(screen.getByTestId('input-website')).toHaveAttribute('placeholder', 'website-example');
    });

    it('renders with empty value', () => {
      render(
        <CompanyWebsiteUrl 
          register={mockRegister}
          errors={mockErrors}
          value={{}}
        />
      );

      expect(screen.getByTestId('input-website')).toHaveValue( '');
    });

    it('displays label', () => {
      render(
        <CompanyWebsiteUrl 
          register={mockRegister}
          errors={mockErrors}
          value={{ website: 'www.example.com' }}
        />
      );

      expect(screen.getByText('profile-website-url')).toBeInTheDocument();
    });
  });

  describe('CompanyLinkedInUrl', () => {
    it('renders with default props', () => {
      render(
        <CompanyLinkedInUrl 
          register={mockRegister}
          errors={mockErrors}
          value={{ linkedin: 'linkedin.com/company/example' }}
        />
      );

      expect(screen.getByTestId('input-form-linkedin')).toBeInTheDocument();
      expect(screen.getByTestId('input-linkedin')).toBeInTheDocument();
      expect(screen.getByTestId('input-linkedin')).toHaveAttribute('name', 'linkedin');
      expect(screen.getByTestId('input-linkedin')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-linkedin')).toHaveAttribute('autocomplete', 'linkedin');
      expect(screen.getByTestId('input-linkedin')).toHaveValue( 'linkedin.com/company/example');
      expect(screen.getByTestId('input-linkedin')).toHaveAttribute('placeholder', 'company-name-example');
    });

    it('renders with empty value', () => {
      render(
        <CompanyLinkedInUrl 
          register={mockRegister}
          errors={mockErrors}
          value={{}}
        />
      );

      expect(screen.getByTestId('input-linkedin')).toHaveValue( '');
    });

    it('displays label', () => {
      render(
        <CompanyLinkedInUrl 
          register={mockRegister}
          errors={mockErrors}
          value={{ linkedin: 'linkedin.com/company/example' }}
        />
      );

      expect(screen.getByText('profile-linkedIn-url')).toBeInTheDocument();
    });
  });

  describe('CompanyVatRegistration', () => {
    it('renders with default props', () => {
      render(
        <CompanyVatRegistration 
          register={mockRegister}
          errors={mockErrors}
          value={{ vat_number: 'VAT123456' }}
        />
      );

      expect(screen.getByTestId('input-form-vat_number')).toBeInTheDocument();
      expect(screen.getByTestId('input-vat_number')).toBeInTheDocument();
      expect(screen.getByTestId('input-vat_number')).toHaveAttribute('name', 'vat_number');
      expect(screen.getByTestId('input-vat_number')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-vat_number')).toHaveAttribute('autocomplete', 'vat_number');
      expect(screen.getByTestId('input-vat_number')).toHaveValue( 'VAT123456');
    });

    it('renders with empty value', () => {
      render(
        <CompanyVatRegistration 
          register={mockRegister}
          errors={mockErrors}
          value={{}}
        />
      );

      expect(screen.getByTestId('input-vat_number')).toHaveValue( '');
    });

    it('displays label', () => {
      render(
        <CompanyVatRegistration 
          register={mockRegister}
          errors={mockErrors}
          value={{ vat_number: 'VAT123456' }}
        />
      );

      expect(screen.getByText('profile-vat-registration')).toBeInTheDocument();
    });
  });

  describe('CompanyStrapline', () => {
    it('renders with default props', () => {
      render(
        <CompanyStrapline 
          register={mockRegister}
          errors={mockErrors}
          value={{ strapline: 'Best company ever' }}
        />
      );

      expect(screen.getByTestId('input-form-strapline')).toBeInTheDocument();
      expect(screen.getByTestId('input-strapline')).toBeInTheDocument();
      expect(screen.getByTestId('input-strapline')).toHaveAttribute('name', 'strapline');
      expect(screen.getByTestId('input-strapline')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('input-strapline')).toHaveAttribute('autocomplete', 'strapline');
      expect(screen.getByTestId('input-strapline')).toHaveValue( 'Best company ever');
      expect(screen.getByTestId('input-strapline')).toHaveAttribute('placeholder', 'company-strapline');
    });

    it('renders with empty value', () => {
      render(
        <CompanyStrapline 
          register={mockRegister}
          errors={mockErrors}
          value={{}}
        />
      );

      expect(screen.getByTestId('input-strapline')).toHaveValue( '');
    });

    it('displays label', () => {
      render(
        <CompanyStrapline 
          register={mockRegister}
          errors={mockErrors}
          value={{ strapline: 'Best company ever' }}
        />
      );

      expect(screen.getByText('profile-company-strapline')).toBeInTheDocument();
    });
  });

  describe('CompanyDescriptionInput', () => {
    const mockSetValue = jest.fn();
    const mockTrigger = jest.fn();
    const mockControl = {};

    it('renders with default props', () => {
      render(
        <CompanyDescriptionInput 
          register={mockRegister}
          errors={mockErrors}
          control={mockControl}
          setValue={mockSetValue}
          trigger={mockTrigger}
        />
      );

      expect(screen.getByTestId('input-form-controlled-description')).toBeInTheDocument();
      expect(screen.getByTestId('input-controlled-description')).toBeInTheDocument();
      expect(screen.getByTestId('input-controlled-description')).toHaveAttribute('name', 'description');
      expect(screen.getByTestId('input-controlled-description')).toHaveAttribute('type', 'editor');
      expect(screen.getByTestId('input-controlled-description')).toHaveAttribute('autocomplete', 'description');
    });

    it('displays label', () => {
      render(
        <CompanyDescriptionInput 
          register={mockRegister}
          errors={mockErrors}
          control={mockControl}
          setValue={mockSetValue}
          trigger={mockTrigger}
        />
      );

      expect(screen.getByText('profile-company-description')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('renders all components without crashing', () => {
      const mockGetValues = jest.fn(() => ({ operating_company_address: '789 Pine St' }));
      const mockSetValue = jest.fn();
      const mockTrigger = jest.fn();
      const mockControl = {};

      render(
        <div>
          <CompanyFirstName register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyLastName register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyEmail register={mockRegister} errors={mockErrors} value={mockValue} />
          <UserEmail register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyJobDescription register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyRegisteredAddress register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyOperatingAddress 
            register={mockRegister} 
            errors={mockErrors} 
            getValues={mockGetValues}
            setValue={mockSetValue}
            trigger={mockTrigger}
            control={mockControl}
          />
          <EnableOperatingAddress register={mockRegister} errors={mockErrors} />
          <CompanyStatus register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyLandlineNumber register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyMobileNumber register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyWebsiteUrl register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyLinkedInUrl register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyVatRegistration register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyStrapline register={mockRegister} errors={mockErrors} value={mockValue} />
          <CompanyDescriptionInput 
            register={mockRegister} 
            errors={mockErrors} 
            control={mockControl}
            setValue={mockSetValue}
            trigger={mockTrigger}
          />
        </div>
      );

      // Verify at least some components are rendered
      expect(screen.getByTestId('input-firstname')).toBeInTheDocument();
      expect(screen.getByTestId('input-lastname')).toBeInTheDocument();
      expect(screen.getByTestId('input-controlled-description')).toBeInTheDocument();
    });
  });
});