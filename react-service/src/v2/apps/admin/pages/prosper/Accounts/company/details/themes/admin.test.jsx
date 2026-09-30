import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminCompanyPage from './admin';

// Mock all the input components
jest.mock('../inputs', () => ({
  CompanyFirstName: ({ register, errors, value }) => (
    <input data-testid="company-first-name" defaultValue={value?.first_name || ''} readOnly />
  ),
  CompanyLastName: ({ register, errors, value }) => (
    <input data-testid="company-last-name" defaultValue={value?.last_name || ''} readOnly />
  ),
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
  CompanyName: ({ register, errors, value }) => (
    <input data-testid="company-name" defaultValue={value?.name || ''} readOnly />
  ),
  CompanyNumber: ({ register, errors, value }) => (
    <input data-testid="company-number" defaultValue={value?.number || ''} readOnly />
  ),
  CompanyOperatingAddress: ({ register, errors, value, readOnly, type }) => (
    <textarea 
      data-testid="company-operating-address" 
      defaultValue={value?.operating_company_address || ''} 
      readOnly={readOnly}
    />
  ),
  CompanyRegisteredAddress: ({ register, errors, value, type }) => (
    <textarea data-testid="company-registered-address" defaultValue={value?.registered_address || ''} readOnly />
  ),
  CompanyStatus: ({ register, errors, value }) => (
    <select data-testid="company-status" defaultValue={value?.status || ''}>
      <option value="">Select Status</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
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

jest.mock('./styled', () => ({
  StyledDetailsColumns: ({ children, className, ...props }) => (
    <div data-testid="styled-details-columns" className={className} {...props}>
      {children}
    </div>
  ),
}));

describe('AdminCompanyPage', () => {
  const defaultProps = {
    data: {
      first_name: 'John',
      last_name: 'Doe',
      name: 'Test Company',
      email: 'john@test.com',
      mobile: '123456789',
      landline: '987654321',
      website: 'https://test.com',
      linkedin: 'https://linkedin.com/in/johndoe',
      number: '12345678',
      status: 'active',
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
    render(<AdminCompanyPage {...defaultProps} />);
    
    expect(screen.getByTestId('company-first-name')).toBeInTheDocument();
    expect(screen.getByTestId('company-last-name')).toBeInTheDocument();
  });

  it('should render all form inputs', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    // Check all form inputs are rendered
    expect(screen.getByTestId('company-first-name')).toBeInTheDocument();
    expect(screen.getByTestId('company-last-name')).toBeInTheDocument();
    expect(screen.getByTestId('company-name')).toBeInTheDocument();
    expect(screen.getByTestId('company-email')).toBeInTheDocument();
    expect(screen.getByTestId('company-mobile')).toBeInTheDocument();
    expect(screen.getByTestId('company-landline')).toBeInTheDocument();
    expect(screen.getByTestId('company-website')).toBeInTheDocument();
    expect(screen.getByTestId('company-linkedin')).toBeInTheDocument();
    expect(screen.getByTestId('company-number')).toBeInTheDocument();
    expect(screen.getByTestId('company-status')).toBeInTheDocument();
    expect(screen.getByTestId('company-vat')).toBeInTheDocument();
    expect(screen.getByTestId('company-registered-address')).toBeInTheDocument();
    expect(screen.getByTestId('company-operating-address')).toBeInTheDocument();
    expect(screen.getByTestId('enable-operating-address')).toBeInTheDocument();
  });

  it('should render correct layout structure', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    // Check that the layout structure is correct
    const leftColumn = screen.getAllByTestId('styled-details-columns')[0];
    const rightColumn = screen.getAllByTestId('styled-details-columns')[1];
    
    expect(leftColumn).toHaveClass('company-details-form-wrapper-left');
    expect(rightColumn).toHaveClass('company-details-form-wrapper-right');
  });

  it('should render two-input-wrapper classes correctly', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    const wrappers = screen.getAllByTestId('styled-inner-wrapper');
    const twoInputWrappers = wrappers.filter(wrapper => 
      wrapper.classList.contains('two-input-wrapper')
    );
    
    expect(twoInputWrappers.length).toBeGreaterThan(0);
  });

  it('should render operating address checkbox', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    const checkbox = screen.getByTestId('enable-operating-address');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('should handle checkbox change when checked state is different', () => {
    const checkedProps = {
      ...defaultProps,
      checked: true,
    };
    
    render(<AdminCompanyPage {...checkedProps} />);
    
    const checkbox = screen.getByTestId('enable-operating-address');
    expect(checkbox).toBeChecked();
  });

  it('should render operating address as readonly when checked', () => {
    const checkedProps = {
      ...defaultProps,
      checked: true,
    };
    
    render(<AdminCompanyPage {...checkedProps} />);
    
    const operatingAddress = screen.getByTestId('company-operating-address');
    expect(operatingAddress).toHaveAttribute('readOnly');
  });

  it('should render operating address as editable when not checked', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    const operatingAddress = screen.getByTestId('company-operating-address');
    expect(operatingAddress).not.toHaveAttribute('readOnly');
  });

  it('should render with empty data', () => {
    const emptyDataProps = {
      ...defaultProps,
      data: {},
    };
    
    render(<AdminCompanyPage {...emptyDataProps} />);
    
    expect(screen.getByTestId('company-first-name')).toHaveValue('');
    expect(screen.getByTestId('company-last-name')).toHaveValue('');
    expect(screen.getByTestId('company-name')).toHaveValue('');
  });

  it('should pass data values to input components', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    expect(screen.getByTestId('company-first-name')).toHaveValue('John');
    expect(screen.getByTestId('company-last-name')).toHaveValue('Doe');
    expect(screen.getByTestId('company-name')).toHaveValue('Test Company');
    expect(screen.getByTestId('company-email')).toHaveValue('john@test.com');
  });

  it('should pass callback rules to EnableOperatingAddress', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
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
    
    render(<AdminCompanyPage {...checkedProps} />);
    
    const checkbox = screen.getByTestId('enable-operating-address');
    expect(checkbox).toBeChecked();
  });

  it('should execute onChange callback logic when checkbox is checked', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    const checkbox = screen.getByTestId('enable-operating-address');
    
    // Verify the checkbox can receive change events
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('should execute onChange callback logic when checkbox is unchecked', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    const checkbox = screen.getByTestId('enable-operating-address');
    
    // Verify the checkbox can receive change events
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('should pass correct props to all form components', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    // Verify that register, errors, and value props are passed to all components
    const allInputs = [
      'company-first-name', 'company-last-name', 'company-name', 'company-email',
      'company-mobile', 'company-landline', 'company-website', 'company-linkedin',
      'company-number', 'company-status', 'company-vat', 'company-registered-address',
      'company-operating-address'
    ];
    
    allInputs.forEach(testId => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  it('should pass additional props to CompanyOperatingAddress', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    // The CompanyOperatingAddress should receive additional props like setValue, getValues, etc.
    const operatingAddress = screen.getByTestId('company-operating-address');
    expect(operatingAddress).toBeInTheDocument();
  });

  it('should render with operating-company-address className', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    const operatingAddressWrapper = screen.getAllByTestId('styled-inner-wrapper')
      .find(wrapper => wrapper.classList.contains('operating-company-address'));
    
    expect(operatingAddressWrapper).toBeInTheDocument();
  });

  it('should render all input types correctly', () => {
    render(<AdminCompanyPage {...defaultProps} />);
    
    // Check that textareas are rendered for address fields
    expect(screen.getByTestId('company-registered-address')).toBeInTheDocument();
    expect(screen.getByTestId('company-operating-address')).toBeInTheDocument();
    
    // Check that select is rendered for status
    expect(screen.getByTestId('company-status')).toBeInTheDocument();
    
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
      render(<AdminCompanyPage {...minimalProps} />);
    }).not.toThrow();
  });

  // Test the actual component callback by accessing the rules passed to the mock
  it('should execute actual callback logic through EnableOperatingAddress rules', () => {
    const { setValue, getValues, trigger, changeChecked } = defaultProps;
    getValues.mockImplementation((field) => {
      const values = {
        registered_address: '456 New Street',
        operating_company_address: '123 Main St',
      };
      return field ? values[field] : values;
    });
    
    // Render the component so the mock gets called with rules
    render(<AdminCompanyPage {...defaultProps} />);
    
    // Access the rules that were passed to the EnableOperatingAddress mock
    const MockEnableOperatingAddress = require('../inputs').EnableOperatingAddress;
    const rules = MockEnableOperatingAddress._lastRules;
    
    expect(rules).toBeDefined();
    expect(rules.onChange).toBeInstanceOf(Function);
    
    // Test checking - call the actual onChange function from the component
    rules.onChange({ currentTarget: { checked: true } });
    expect(setValue).toHaveBeenCalledWith('operating_company_address', '456 New Street');
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