import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProsperCompanyPage from './ProsperCompanyPage';

// Mock dependencies
jest.mock('react-hook-form', () => ({
  Controller: ({ render, name, defaultValue }) => {
    const field = {
      onChange: jest.fn(),
      value: defaultValue,
    };
    return (
      <div data-testid={`controller-${name}`}>
        {render({ field })}
      </div>
    );
  },
}));

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

jest.mock('./inputs', () => ({
  CompanyLandlineNumber: ({ register, errors, value }) => (
    <div data-testid="company-landline-number">
      LandlineNumber - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
  CompanyLinkedInUrl: ({ register, errors, value }) => (
    <div data-testid="company-linkedin-url">
      LinkedInUrl - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
  CompanyMobileNumber: ({ register, errors, value }) => (
    <div data-testid="company-mobile-number">
      MobileNumber - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
  CompanyEmail: ({ register, errors, value }) => (
    <div data-testid="company-email">
      Email - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
  CompanyOperatingAddress: ({ 
    register, 
    errors, 
    value, 
    readOnly, 
    setValue, 
    getValues, 
    manualMode, 
    control, 
    trigger, 
    isUK 
  }) => (
    <div data-testid="company-operating-address">
      <div>OperatingAddress - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}</div>
      <div>ReadOnly: {String(readOnly)}, ManualMode: {String(manualMode)}, IsUK: {String(isUK)}</div>
    </div>
  ),
  CompanyRegisteredAddress: ({ register, errors, value }) => (
    <div data-testid="company-registered-address">
      RegisteredAddress - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
  CompanyWebsiteUrl: ({ register, errors, value }) => (
    <div data-testid="company-website-url">
      WebsiteUrl - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
  CompanyVatRegistration: ({ register, errors, value }) => (
    <div data-testid="company-vat-registration">
      VatRegistration - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
  EnableOperatingAddress: ({ register, errors, value, checked, rules }) => (
    <div data-testid="enable-operating-address">
      <div>EnableOperatingAddress - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}</div>
      <div>Checked: {String(checked)}</div>
      <input 
        data-testid="checkbox-input"
        type="checkbox"
        checked={checked}
        onChange={(e) => rules?.onChange && rules.onChange(e)}
      />
    </div>
  ),
  CompanyStrapline: ({ register, errors, value }) => (
    <div data-testid="company-strapline">
      Strapline - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
}));

jest.mock('v2/apps/shared/components/editor', () => {
  const mockReact = require('react');
  return mockReact.forwardRef(function MockEditor({ defaultValue, onTextChange, readOnly }, ref) {
    mockReact.useImperativeHandle(ref, () => ({
      root: {
        innerHTML: '<p>Test editor content</p>',
      },
    }));

    return mockReact.createElement('div', {
      'data-testid': 'mock-editor',
      children: [
        mockReact.createElement('div', { key: 'default' }, `Default: ${defaultValue || ''}`),
        mockReact.createElement('div', { key: 'readonly' }, `ReadOnly: ${readOnly ? 'true' : 'false'}`),
        mockReact.createElement('button', {
          key: 'change',
          'data-testid': 'editor-change-button',
          onClick: () => onTextChange && onTextChange('<p>Changed content</p>'),
        }, 'Trigger Change'),
      ],
    });
  });
});

jest.mock('./styled', () => ({
  EditorWrapper: ({ label, children }) => (
    <div data-testid="editor-wrapper">
      <label>{label}</label>
      {children}
    </div>
  ),
  TwoFieldsWrapper: ({ children }) => (
    <div data-testid="two-fields-wrapper">
      {children}
    </div>
  ),
}));

describe('ProsperCompanyPage', () => {
  const defaultProps = {
    data: {
      email: 'test@company.com',
      registered_address: '123 Test Street, Test City',
      operating_company_address: '456 Business Ave, Business City',
      landline: '+1234567890',
      mobile: '+0987654321',
      website: 'https://testcompany.com',
      linkedin: 'https://linkedin.com/company/test',
      vat_number: 'VAT123456789',
      strapline: 'Test Company Strapline',
      description: '<p>Test company description</p>',
    },
    register: jest.fn(),
    errors: { email: 'Email error' },
    setValue: jest.fn(),
    getValues: jest.fn(),
    checked: false,
    changeChecked: jest.fn(),
    trigger: jest.fn(),
    control: { name: 'test-control' },
    manualMode: true,
    isUK: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<ProsperCompanyPage {...defaultProps} {...props} />);
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('company-email')).toBeInTheDocument();
  });

  it('renders all company input components with correct props', () => {
    renderComponent();

    // Check that all input components are rendered
    expect(screen.getByTestId('company-email')).toBeInTheDocument();
    expect(screen.getByTestId('company-registered-address')).toBeInTheDocument();
    expect(screen.getByTestId('company-operating-address')).toBeInTheDocument();
    expect(screen.getByTestId('company-landline-number')).toBeInTheDocument();
    expect(screen.getByTestId('company-mobile-number')).toBeInTheDocument();
    expect(screen.getByTestId('company-website-url')).toBeInTheDocument();
    expect(screen.getByTestId('company-linkedin-url')).toBeInTheDocument();
    expect(screen.getByTestId('company-vat-registration')).toBeInTheDocument();
    expect(screen.getByTestId('company-strapline')).toBeInTheDocument();

    // Check that props are passed correctly
    expect(screen.getByText(/Email - register: true, errors: true, value: true/)).toBeInTheDocument();
    expect(screen.getByText(/RegisteredAddress - register: true, errors: true, value: true/)).toBeInTheDocument();
  });

  it('renders operating address with correct readonly state when checked', () => {
    renderComponent({ checked: true });

    const operatingAddress = screen.getByTestId('company-operating-address');
    expect(operatingAddress).toHaveTextContent('ReadOnly: true');
    expect(operatingAddress).toHaveTextContent('ManualMode: true');
    expect(operatingAddress).toHaveTextContent('IsUK: false');
  });

  it('renders operating address as editable when not checked', () => {
    renderComponent({ checked: false });

    const operatingAddress = screen.getByTestId('company-operating-address');
    expect(operatingAddress).toHaveTextContent('ReadOnly: false');
  });

  it('handles UK flag correctly', () => {
    renderComponent({ isUK: true });

    const operatingAddress = screen.getByTestId('company-operating-address');
    expect(operatingAddress).toHaveTextContent('IsUK: true');
  });

  it('renders TwoFieldsWrapper with operating address and checkbox', () => {
    renderComponent();

    const twoFieldsWrapper = screen.getByTestId('two-fields-wrapper');
    expect(twoFieldsWrapper).toBeInTheDocument();
    
    // Check that both components are inside the wrapper
    const operatingAddress = screen.getByTestId('company-operating-address');
    const enableOperatingAddress = screen.getByTestId('enable-operating-address');
    
    expect(twoFieldsWrapper).toContainElement(operatingAddress);
    expect(twoFieldsWrapper).toContainElement(enableOperatingAddress);
  });

  it('renders EnableOperatingAddress with correct checked state', () => {
    renderComponent({ checked: true });

    const enableOperatingAddress = screen.getByTestId('enable-operating-address');
    expect(enableOperatingAddress).toHaveTextContent('Checked: true');
    
    const checkbox = screen.getByTestId('checkbox-input');
    expect(checkbox).toBeChecked();
  });

  it('handles checkbox change correctly', () => {
    const mockChangeChecked = jest.fn();
    const mockSetValue = jest.fn();
    const mockTrigger = jest.fn();
    
    renderComponent({
      checked: false,
      changeChecked: mockChangeChecked,
      setValue: mockSetValue,
      trigger: mockTrigger,
    });

    const checkbox = screen.getByTestId('checkbox-input');
    fireEvent.click(checkbox);

    // The onChange logic should trigger the appropriate functions
    expect(mockSetValue).toHaveBeenCalled();
    expect(mockTrigger).toHaveBeenCalledWith(['operating_company_address']);
    expect(mockChangeChecked).toHaveBeenCalled();
  });

  it('renders editor wrapper with correct label', () => {
    renderComponent();

    const editorWrapper = screen.getByTestId('editor-wrapper');
    expect(editorWrapper).toBeInTheDocument();
    expect(editorWrapper).toHaveTextContent('profile-company-description');
  });

  it('renders editor with correct props', () => {
    renderComponent();

    const editor = screen.getByTestId('mock-editor');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveTextContent('Default: <p>Test company description</p>');
    expect(editor).toHaveTextContent('ReadOnly: false');
  });

  it('renders editor with empty default value when description is not provided', () => {
    const propsWithoutDescription = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        description: undefined,
      },
    };

    renderComponent(propsWithoutDescription);

    const editor = screen.getByTestId('mock-editor');
    expect(editor).toHaveTextContent('Default: ');
  });

  it('handles editor content change', () => {
    const mockSetValue = jest.fn();
    const mockTrigger = jest.fn();
    
    renderComponent({
      setValue: mockSetValue,
      trigger: mockTrigger,
    });

    const editorChangeButton = screen.getByTestId('editor-change-button');
    fireEvent.click(editorChangeButton);

    // The onTextChange should trigger setValue and trigger
    expect(mockSetValue).toHaveBeenCalled();
    expect(mockTrigger).toHaveBeenCalledWith('description');
  });

  it('renders Controller with correct name and defaultValue', () => {
    renderComponent();

    const controller = screen.getByTestId('controller-description');
    expect(controller).toBeInTheDocument();
  });

  describe('Props Handling', () => {
    it('handles missing data prop', () => {
      renderComponent({ data: null });

      const companyEmail = screen.getByTestId('company-email');
      expect(companyEmail).toHaveTextContent('value: false');
    });

    it('handles missing register prop', () => {
      renderComponent({ register: null });

      const companyEmail = screen.getByTestId('company-email');
      expect(companyEmail).toHaveTextContent('register: false');
    });

    it('handles missing errors prop', () => {
      renderComponent({ errors: null });

      const companyEmail = screen.getByTestId('company-email');
      expect(companyEmail).toHaveTextContent('errors: false');
    });

    it('handles empty data object', () => {
      renderComponent({ data: {} });

      const editor = screen.getByTestId('mock-editor');
      expect(editor).toHaveTextContent('Default: ');
    });
  });

  describe('Address Synchronization Logic', () => {
    it('sets operating address to registered address when checkbox is checked', () => {
      const mockSetValue = jest.fn();
      const mockTrigger = jest.fn();
      const mockChangeChecked = jest.fn();
      
      renderComponent({
        checked: false,
        setValue: mockSetValue,
        trigger: mockTrigger,
        changeChecked: mockChangeChecked,
        data: {
          ...defaultProps.data,
          registered_address: '123 Main St',
        },
      });

      const checkbox = screen.getByTestId('checkbox-input');
      
      // Simulate checking the checkbox
      fireEvent.click(checkbox);

      expect(mockSetValue).toHaveBeenCalledWith('operating_company_address', '123 Main St');
      expect(mockTrigger).toHaveBeenCalledWith(['operating_company_address']);
      expect(mockChangeChecked).toHaveBeenCalledWith(true);
    });

    it('restores original operating address when checkbox is unchecked', () => {
      const mockSetValue = jest.fn();
      const mockTrigger = jest.fn();
      const mockChangeChecked = jest.fn();
      
      renderComponent({
        checked: true,
        setValue: mockSetValue,
        trigger: mockTrigger,
        changeChecked: mockChangeChecked,
        data: {
          ...defaultProps.data,
          operating_company_address: '456 Business Ave',
        },
      });

      const checkbox = screen.getByTestId('checkbox-input');
      
      // Simulate unchecking the checkbox
      fireEvent.click(checkbox);

      expect(mockSetValue).toHaveBeenCalledWith('operating_company_address', '456 Business Ave');
      expect(mockTrigger).toHaveBeenCalledWith(['operating_company_address']);
      expect(mockChangeChecked).toHaveBeenCalledWith(false);
    });
  });

  describe('Editor Integration', () => {
    it('handles editor ref correctly', () => {
      renderComponent();

      // The editor should be rendered and ref should work
      const editor = screen.getByTestId('mock-editor');
      expect(editor).toBeInTheDocument();

      // Simulate text change to test ref usage
      const editorChangeButton = screen.getByTestId('editor-change-button');
      fireEvent.click(editorChangeButton);
    });
  });
});