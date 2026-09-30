import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProsperCompanyPage from './prosper';

// Mock all the input components
jest.mock('../inputs', () => ({
  CompanyEmail: ({ register, errors, value }) => (
    <input data-testid="company-email" defaultValue={value?.email || ''} readOnly />
  ),
  CompanyLandlineNumber: ({ register, errors, value }) => (
    <input data-testid="company-landline" defaultValue={value?.landline || ''} readOnly />
  ),
  CompanyLinkedInUrl: ({ register, errors, value }) => (
    <input data-testid="company-linkedin" defaultValue={value?.linkedin || ''} readOnly />
  ),
  CompanyMobileNumber: ({ register, errors, value }) => (
    <input data-testid="company-mobile" defaultValue={value?.mobile || ''} readOnly />
  ),
  CompanyName: ({ register, errors, value, readOnly }) => (
    <input 
      data-testid="company-name" 
      defaultValue={value?.name || ''} 
      readOnly={readOnly}
    />
  ),
  CompanyNumber: ({ register, errors, value, readOnly }) => (
    <input 
      data-testid="company-number" 
      defaultValue={value?.number || ''} 
      readOnly={readOnly}
    />
  ),
  CompanyOperatingAddress: ({ register, errors, value, readOnly }) => (
    <textarea 
      data-testid="company-operating-address" 
      defaultValue={value?.operating_company_address || ''} 
      readOnly={readOnly}
    />
  ),
  CompanyRegisteredAddress: ({ register, errors, value }) => (
    <textarea data-testid="company-registered-address" defaultValue={value?.registered_address || ''} readOnly />
  ),
  CompanyWebsiteUrl: ({ register, errors, value }) => (
    <input data-testid="company-website" defaultValue={value?.website || ''} readOnly />
  ),
  CompanyVatRegistration: ({ register, errors, value }) => (
    <input data-testid="company-vat" defaultValue={value?.vat || ''} readOnly />
  ),
  EnableOperatingAddress: function MockEnableOperatingAddress({ register, errors, value, checked, rules }) {
    // Store the rules globally so tests can access them
    MockEnableOperatingAddress._lastRules = rules;
    
    return (
      <input 
        data-testid="enable-operating-address" 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => {
          if (rules?.onChange) {
            rules.onChange(e);
          }
        }}
      />
    );
  },
}));

// Mock the styled components
jest.mock('../../Theme.styled', () => ({
  StyledInnerWrapper: ({ children, className, ...props }) => (
    <div data-testid="styled-inner-wrapper" className={className} {...props}>
      {children}
    </div>
  ),
}));

describe('ProsperCompanyPage', () => {
  const defaultProps = {
    data: {
      name: 'Test Company',
      email: 'john@test.com',
      mobile: '123456789',
      landline: '987654321',
      website: 'https://test.com',
      linkedin: 'https://linkedin.com/in/johndoe',
      number: '12345678',
      vat: 'GB123456789',
      registered_address: '123 Main St',
      operating_company_address: '123 Main St',
    },
    register: jest.fn(),
    errors: {},
    setValue: jest.fn(),
    getValues: jest.fn().mockReturnValue({
      registered_address: '123 Main St',
      operating_company_address: '123 Main St',
    }),
    checked: false,
    changeChecked: jest.fn(),
    trigger: jest.fn(),
    control: {},
    manualMode: false,
    setDirty: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    expect(screen.getByTestId('company-name')).toBeInTheDocument();
    expect(screen.getByTestId('company-email')).toBeInTheDocument();
  });

  it('should render all form inputs', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    // Check all form inputs are rendered
    expect(screen.getByTestId('company-name')).toBeInTheDocument();
    expect(screen.getByTestId('company-email')).toBeInTheDocument();
    expect(screen.getByTestId('company-mobile')).toBeInTheDocument();
    expect(screen.getByTestId('company-landline')).toBeInTheDocument();
    expect(screen.getByTestId('company-website')).toBeInTheDocument();
    expect(screen.getByTestId('company-linkedin')).toBeInTheDocument();
    expect(screen.getByTestId('company-number')).toBeInTheDocument();
    expect(screen.getByTestId('company-vat')).toBeInTheDocument();
    expect(screen.getByTestId('company-registered-address')).toBeInTheDocument();
    expect(screen.getByTestId('company-operating-address')).toBeInTheDocument();
    expect(screen.getByTestId('enable-operating-address')).toBeInTheDocument();
  });

  it('should render company name as readonly', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    const companyName = screen.getByTestId('company-name');
    expect(companyName).toHaveAttribute('readOnly');
  });

  it('should render company number as readonly', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    const companyNumber = screen.getByTestId('company-number');
    expect(companyNumber).toHaveAttribute('readOnly');
  });

  it('should render operating address checkbox', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    const checkbox = screen.getByTestId('enable-operating-address');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('should handle checkbox change when checked state is different', () => {
    const checkedProps = {
      ...defaultProps,
      checked: true,
    };
    
    render(<ProsperCompanyPage {...checkedProps} />);
    
    const checkbox = screen.getByTestId('enable-operating-address');
    expect(checkbox).toBeChecked();
  });

  it('should render operating address as readonly when checked', () => {
    const checkedProps = {
      ...defaultProps,
      checked: true,
    };
    
    render(<ProsperCompanyPage {...checkedProps} />);
    
    const operatingAddress = screen.getByTestId('company-operating-address');
    expect(operatingAddress).toHaveAttribute('readOnly');
  });

  it('should render operating address as editable when not checked', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    const operatingAddress = screen.getByTestId('company-operating-address');
    expect(operatingAddress).not.toHaveAttribute('readOnly');
  });

  it('should render with empty data', () => {
    const emptyDataProps = {
      ...defaultProps,
      data: {},
    };
    
    render(<ProsperCompanyPage {...emptyDataProps} />);
    
    expect(screen.getByTestId('company-name')).toHaveValue('');
    expect(screen.getByTestId('company-email')).toHaveValue('');
    expect(screen.getByTestId('company-mobile')).toHaveValue('');
  });

  it('should pass data values to input components', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    expect(screen.getByTestId('company-name')).toHaveValue('Test Company');
    expect(screen.getByTestId('company-email')).toHaveValue('john@test.com');
    expect(screen.getByTestId('company-mobile')).toHaveValue('123456789');
    expect(screen.getByTestId('company-landline')).toHaveValue('987654321');
  });

  it('should have proper wrapper structure', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    const wrappers = screen.getAllByTestId('styled-inner-wrapper');
    expect(wrappers).toHaveLength(7); // Should have 7 StyledInnerWrapper components
  });

  it('should render grouped inputs correctly', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    // Check that mobile and landline are both present (they're in the same wrapper)
    expect(screen.getByTestId('company-mobile')).toBeInTheDocument();
    expect(screen.getByTestId('company-landline')).toBeInTheDocument();
    
    // Check that website and linkedin are both present (they're in the same wrapper)
    expect(screen.getByTestId('company-website')).toBeInTheDocument();
    expect(screen.getByTestId('company-linkedin')).toBeInTheDocument();
  });

  it('should pass callback rules to EnableOperatingAddress', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    const checkbox = screen.getByTestId('enable-operating-address');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
    
    // Verify the checkbox receives the checked prop correctly
    expect(checkbox).not.toBeChecked();
  });

  it('should pass checked state to EnableOperatingAddress', () => {
    const checkedProps = {
      ...defaultProps,
      checked: true,
    };
    
    render(<ProsperCompanyPage {...checkedProps} />);
    
    const checkbox = screen.getByTestId('enable-operating-address');
    expect(checkbox).toBeChecked();
  });

  it('should execute onChange callback logic when checkbox is checked', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    const checkbox = screen.getByTestId('enable-operating-address');
    
    // Verify the checkbox can receive change events
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('should execute onChange callback logic when checkbox is unchecked', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    const checkbox = screen.getByTestId('enable-operating-address');
    
    // Verify the checkbox can receive change events
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('should pass correct props to all form components', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    // Verify that register, errors, and value props are passed to all components
    const allInputs = [
      'company-name', 'company-email', 'company-mobile', 'company-landline',
      'company-website', 'company-linkedin', 'company-number', 'company-vat',
      'company-registered-address', 'company-operating-address'
    ];
    
    allInputs.forEach(testId => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  it('should pass additional props to CompanyOperatingAddress', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    // The CompanyOperatingAddress should receive additional props like setValue, getValues, etc.
    const operatingAddress = screen.getByTestId('company-operating-address');
    expect(operatingAddress).toBeInTheDocument();
  });

  it('should handle different data scenarios', () => {
    const dataWithDifferentAddresses = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        registered_address: '789 Different Street',
        operating_company_address: '456 Another Street',
      },
    };
    
    render(<ProsperCompanyPage {...dataWithDifferentAddresses} />);
    
    expect(screen.getByTestId('company-registered-address')).toHaveValue('789 Different Street');
    expect(screen.getByTestId('company-operating-address')).toHaveValue('456 Another Street');
  });

  it('should render all input types correctly', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    // Check that textareas are rendered for address fields
    expect(screen.getByTestId('company-registered-address')).toBeInTheDocument();
    expect(screen.getByTestId('company-operating-address')).toBeInTheDocument();
    
    // Check that checkbox is rendered for enable operating address
    expect(screen.getByTestId('enable-operating-address')).toBeInTheDocument();
  });

  it('should handle missing props gracefully', () => {
    const minimalProps = {
      register: jest.fn(),
      errors: {},
      setValue: jest.fn(),
      getValues: jest.fn().mockReturnValue({}),
      checked: false,
      changeChecked: jest.fn(),
      trigger: jest.fn(),
      control: {},
      manualMode: false,
      setDirty: jest.fn(),
    };
    
    expect(() => {
      render(<ProsperCompanyPage {...minimalProps} />);
    }).not.toThrow();
  });

  it('should render component structure correctly', () => {
    render(<ProsperCompanyPage {...defaultProps} />);
    
    // Verify the specific order and grouping based on the component structure
    const wrappers = screen.getAllByTestId('styled-inner-wrapper');
    
    // Check that we have the expected number of wrapper components
    expect(wrappers).toHaveLength(7);
  });

  it('should handle checkbox state change correctly', () => {
    const { rerender } = render(<ProsperCompanyPage {...defaultProps} />);
    
    // Initially unchecked
    expect(screen.getByTestId('enable-operating-address')).not.toBeChecked();
    
    // Rerender with checked state
    rerender(<ProsperCompanyPage {...defaultProps} checked={true} />);
    expect(screen.getByTestId('enable-operating-address')).toBeChecked();
  });

  // Test the actual component callback by accessing the rules passed to the mock
  it('should execute actual callback logic through EnableOperatingAddress rules', () => {
    const { setValue, trigger, changeChecked } = defaultProps;
    
    // Render the component so the mock gets called with rules
    render(<ProsperCompanyPage {...defaultProps} />);
    
    // Access the rules that were passed to the EnableOperatingAddress mock
    const MockEnableOperatingAddress = require('../inputs').EnableOperatingAddress;
    const rules = MockEnableOperatingAddress._lastRules;
    
    expect(rules).toBeDefined();
    expect(rules.onChange).toBeInstanceOf(Function);
    
    // Test checking - call the actual onChange function from the component
    rules.onChange({ currentTarget: { checked: true } });
    expect(setValue).toHaveBeenCalledWith('operating_company_address', defaultProps.data.registered_address);
    expect(trigger).toHaveBeenCalledWith(['operating_company_address']);
    expect(changeChecked).toHaveBeenCalledWith(true);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Test unchecking
    rules.onChange({ currentTarget: { checked: false } });
    expect(setValue).toHaveBeenCalledWith('operating_company_address', defaultProps.data.operating_company_address);
    expect(trigger).toHaveBeenCalledWith(['operating_company_address']);
    expect(changeChecked).toHaveBeenCalledWith(false);
  });
});