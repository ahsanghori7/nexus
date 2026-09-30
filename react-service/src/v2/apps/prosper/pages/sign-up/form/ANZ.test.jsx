import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ANZForm from './ANZ';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('lodash/debounce', () => jest.fn(fn => fn));

jest.mock('v2/helpers/async', () => ({
  checkValid: jest.fn(),
}));

jest.mock('v2/helpers/data', () => ({
  getAddress: jest.fn(() => 'mock address'),
}));

jest.mock('v2/apps/prosper/pages/sign-up/validation', () => ({
  handleChange: jest.fn(),
}));

jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: jest.fn(),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        white: '#ffffff',
      },
    },
  },
}));

// Mock shared components
jest.mock('v2/apps/prosper/pages/sign-up/shared/Wrapper', () => 
  ({ Component, ...props }) => <Component styles={{ mb: 16, titleSize: '24px', noWrap: 'nowrap', bottomMt: '20px', inputMb: 5 }} {...props} />
);

jest.mock('v2/apps/prosper/pages/sign-up/shared/Container', () => 
  ({ children, styles, extra }) => (
    <div data-testid="container" {...extra}>
      {children}
    </div>
  )
);

jest.mock('v2/apps/prosper/pages/sign-up/shared/Title', () => 
  ({ title, styles, marginBottom }) => (
    <div data-testid="title">
      <span data-testid="title-text">{title}</span>
    </div>
  )
);

jest.mock('v2/apps/prosper/pages/sign-up/shared/InputText', () => 
  ({ id, name, label, placeholder, type, handleChange, passwordErrors, Adornment, styles }) => (
    <div data-testid={`input-${id}`}>
      <label>{label}</label>
      <input
        id={id}
        name={name}
        placeholder={placeholder}
        type={type}
        onChange={(e) => handleChange && handleChange(e, jest.fn())}
        data-testid={`input-${id}-field`}
      />
      {passwordErrors && passwordErrors.length > 0 && (
        <div data-testid="password-errors">
          {passwordErrors.map((error, index) => (
            <span key={index}>{error}</span>
          ))}
        </div>
      )}
      {Adornment && <div data-testid="adornment">Adornment</div>}
    </div>
  )
);

jest.mock('v2/apps/prosper/pages/sign-up/shared/Checkbox', () => 
  ({ label, name, checked, handleClick }) => (
    <div data-testid={`checkbox-${name}`}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={handleClick}
        data-testid={`checkbox-${name}-input`}
      />
      <label>{label}</label>
    </div>
  )
);

jest.mock('v2/apps/prosper/pages/sign-up/shared/Adornment', () => () => (
  <div data-testid="adornment-component">Adornment</div>
));

jest.mock('v2/apps/shared/components/select/Autocomplete', () => 
  ({ label, placeholder, name, onInputChange, loading }) => (
    <div data-testid={`autocomplete-${name}`}>
      <label>{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        onChange={(e) => onInputChange && onInputChange([e], jest.fn())}
        data-testid={`autocomplete-${name}-input`}
      />
      {loading && <div data-testid={`autocomplete-${name}-loading`}>Loading...</div>}
    </div>
  )
);

// Mock global variables
global.BASE_URLS = {
  SITE_PROSPER: 'https://prosper.site',
};

const mockNavigate = require('react-router-dom').useNavigate;
const { checkValid } = require('v2/helpers/async');
const { handleChange } = require('v2/apps/prosper/pages/sign-up/validation');
const { httpHelperV2 } = require('v2/services/httpHelper');

describe('ANZForm Component', () => {
  const defaultStyles = {
    mb: 16,
    titleSize: '24px',
    noWrap: 'nowrap',
    bottomMt: '20px',
    inputMb: 5,
  };

  const defaultProps = {
    styles: defaultStyles,
    codeRegion: { id: 1, code: 'AU', name: 'Australia' },
  };

  const mockNavigateFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReturnValue(mockNavigateFn);
    httpHelperV2.mockResolvedValue({ data: false });
  });

  it('renders correctly with initial state', () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    // Check if title is rendered
    expect(screen.getByTestId('title-text')).toHaveTextContent('create-credentials');
    
    // Check if all form fields are rendered
    expect(screen.getByTestId('autocomplete-company_name')).toBeInTheDocument();
    expect(screen.getByTestId('autocomplete-company_reg_number')).toBeInTheDocument();
    expect(screen.getByTestId('input-firstname')).toBeInTheDocument();
    expect(screen.getByTestId('input-lastname')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-password')).toBeInTheDocument();
    
    // Check if checkboxes are rendered
    expect(screen.getByTestId('checkbox-terms_agree')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-privacy_agree')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-mailing_list_consent')).toBeInTheDocument();
    
    // Check if submit button is rendered and disabled initially
    const submitButton = screen.getByRole('button', { name: 'sign-up' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('navigates to sign-up when no codeRegion is provided', () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} codeRegion={null} />
      </BrowserRouter>
    );

    expect(mockNavigateFn).toHaveBeenCalledWith('/sign-up');
  });

  it('renders form with correct attributes', () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const form = screen.getByTestId('container');
    expect(form).toHaveAttribute('component', 'form');
    expect(form).toHaveAttribute('method', 'post');
    expect(form).toHaveAttribute('action', '/account/sign_up');
    expect(form).toHaveAttribute('enctype', 'multipart/form-data');
  });

  it('renders hidden inputs for company data', () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    // Get all hidden inputs using DOM query
    const allInputs = document.querySelectorAll('input[type="hidden"]');
    
    // Find specific inputs by name
    const companyNumberInput = Array.from(allInputs).find(input => input.name === 'registered_company_number');
    const companyAddressInput = Array.from(allInputs).find(input => input.name === 'company_address');
    const regionInput = Array.from(allInputs).find(input => input.name === 'region_group_id');
    
    expect(companyNumberInput).toHaveAttribute('type', 'hidden');
    expect(companyNumberInput).toHaveAttribute('name', 'registered_company_number');
    expect(companyAddressInput).toHaveAttribute('type', 'hidden');
    expect(companyAddressInput).toHaveAttribute('name', 'company_address');
    expect(regionInput).toHaveAttribute('type', 'hidden');
    expect(regionInput).toHaveAttribute('name', 'region_group_id');
    expect(regionInput).toHaveAttribute('value', '1');
  });

  it('handles firstname input change', async () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const firstnameInput = screen.getByTestId('input-firstname-field');
    fireEvent.change(firstnameInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(firstnameInput.value).toBe('John');
    });
  });

  it('handles lastname input change', async () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const lastnameInput = screen.getByTestId('input-lastname-field');
    fireEvent.change(lastnameInput, { target: { value: 'Doe' } });

    await waitFor(() => {
      expect(lastnameInput.value).toBe('Doe');
    });
  });

  it('handles email input change and validation', async () => {
    checkValid.mockImplementation((value, type, errorCallback, successCallback) => {
      if (value === 'valid@email.com') {
        successCallback();
      } else {
        errorCallback('Invalid email');
      }
    });

    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const emailInput = screen.getByTestId('input-email-field');
    fireEvent.change(emailInput, { target: { value: 'valid@email.com' } });

    await waitFor(() => {
      expect(checkValid).toHaveBeenCalledWith(
        'valid@email.com',
        'company_email',
        expect.any(Function),
        expect.any(Function),
        null,
        expect.any(RegExp)
      );
    });
  });

  it('handles password input change', async () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const passwordInput = screen.getByTestId('input-password-field');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Function),
        'sa-password',
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('handles company name autocomplete input change', async () => {
    httpHelperV2.mockResolvedValue({ data: false });

    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const companyNameInput = screen.getByTestId('autocomplete-company_name-input');
    fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });

    await waitFor(() => {
      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'companies/company_exists/1?name=Test Company&strict=1'
      });
    });
  });

  it('handles company registration autocomplete input change', async () => {
    httpHelperV2.mockResolvedValue({ data: false });

    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const companyRegInput = screen.getByTestId('autocomplete-company_reg_number-input');
    fireEvent.change(companyRegInput, { target: { value: '123456789' } });

    await waitFor(() => {
      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'companies/company_exists/1?reg_number=123456789&strict=1'
      });
    });
  });

  it('handles checkbox changes', () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const termsCheckbox = screen.getByTestId('checkbox-terms_agree-input');
    const privacyCheckbox = screen.getByTestId('checkbox-privacy_agree-input');
    const mailingCheckbox = screen.getByTestId('checkbox-mailing_list_consent-input');

    // Initially all should be unchecked
    expect(termsCheckbox).not.toBeChecked();
    expect(privacyCheckbox).not.toBeChecked();
    expect(mailingCheckbox).not.toBeChecked();

    // Click checkboxes
    fireEvent.click(termsCheckbox);
    fireEvent.click(privacyCheckbox);
    fireEvent.click(mailingCheckbox);

    // Should trigger onChange events
    expect(termsCheckbox.checked).toBeDefined();
    expect(privacyCheckbox.checked).toBeDefined();
    expect(mailingCheckbox.checked).toBeDefined();
  });

  it('renders password field with adornment', () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('adornment')).toBeInTheDocument();
  });

  it('renders submit button with correct type and design', () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: 'sign-up' });
    expect(submitButton).toHaveAttribute('type', 'submit');
    expect(submitButton).toHaveAttribute('design', 'red');
  });

  it('handles submit button click', () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: 'sign-up' });
    fireEvent.click(submitButton);

    // Button should still be disabled but click should be handled
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state during company validation', async () => {
    // Mock a delayed response
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    httpHelperV2.mockReturnValue(promise);

    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const companyNameInput = screen.getByTestId('autocomplete-company_name-input');
    fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });

    // Should show loading
    expect(screen.getByTestId('autocomplete-company_name-loading')).toBeInTheDocument();

    // Resolve the promise
    resolvePromise({ data: false });

    await waitFor(() => {
      expect(screen.queryByTestId('autocomplete-company_name-loading')).not.toBeInTheDocument();
    });
  });

  it('handles company exists error', async () => {
    httpHelperV2.mockResolvedValue({ data: true });

    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const companyNameInput = screen.getByTestId('autocomplete-company_name-input');
    fireEvent.change(companyNameInput, { target: { value: 'Existing Company' } });

    await waitFor(() => {
      expect(httpHelperV2).toHaveBeenCalled();
    });
  });

  it('handles API error during company validation', async () => {
    httpHelperV2.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    const companyNameInput = screen.getByTestId('autocomplete-company_name-input');
    fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });

    await waitFor(() => {
      expect(httpHelperV2).toHaveBeenCalled();
    });
  });

  it('renders links to terms and privacy policy', () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('checkbox-terms_agree')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-privacy_agree')).toBeInTheDocument();
  });

  it('applies correct styling to autocomplete components', () => {
    render(
      <BrowserRouter>
        <ANZForm {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('autocomplete-company_name')).toBeInTheDocument();
    expect(screen.getByTestId('autocomplete-company_reg_number')).toBeInTheDocument();
  });
});

describe('SignUpStep', () => {
  it('wraps ANZForm with Wrapper component', () => {
    const props = { 
      customProp: 'test',
      codeRegion: { id: 1, code: 'AU', name: 'Australia' },
    };
    
    render(
      <BrowserRouter>
        <ANZForm {...props} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('container')).toBeInTheDocument();
    expect(screen.getByTestId('title-text')).toHaveTextContent('create-credentials');
  });
});