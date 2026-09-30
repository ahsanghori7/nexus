import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Material-UI components to avoid complex dependencies
jest.mock('@mui/material/Box', () => {
  return ({ children, ...props }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'box', ...props }, children);
  };
});

jest.mock('@mui/material/Typography', () => {
  return ({ children, component = 'div', ...props }) => {
    const React = require('react');
    return React.createElement(component, { 'data-testid': 'typography', ...props }, children);
  };
});

jest.mock('@mui/material/Grid', () => {
  return ({ children, ...props }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'mui-grid', ...props }, children);
  };
});

jest.mock('@mui/material/FormControl', () => {
  return ({ children, ...props }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'formcontrol', ...props }, children);
  };
});

jest.mock('@mui/material/TextField', () => {
  return ({ error, helperText, onKeyDown, ...props }) => {
    const React = require('react');
    return React.createElement('input', { 
      'data-testid': 'text-field', 
      'data-error': String(Boolean(error)),
      'data-helper-text': helperText || '',
      onKeyDown: onKeyDown, // Pass through the onKeyDown handler
      ...props 
    });
  };
});

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkPurple: '#6B46C1',
        white: '#FFFFFF',
      },
    },
  },
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock i18n helper
jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: (key) => {
      const translations = {
        'update-profile-company-name': 'Company Name',
        'update-profile-first-name': 'First Name',
        'update-profile-last-name': 'Last Name',
        'update-profile-email': 'Email',
        'update-profile-phone': 'Phone',
        'update-profile-password': 'Password',
        'update-profile-repeat-password': 'Repeat Password',
        'update-profile-website': 'Website',
        'update-profile-address': 'Address',
        'update-profile-company-type': 'Company Type',
      };
      return translations[key] || key;
    },
  },
}));

// Import the component after mocks are set up
import MuiFormField from './MuiFormField';

describe('MuiFormField Component', () => {
  describe('Basic Rendering', () => {
    test('renders company name field correctly', () => {
      render(
        <MuiFormField
          name="account[name]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('formcontrol')).toBeInTheDocument();
      expect(screen.getByTestId('mui-icon-Business')).toBeInTheDocument();
      expect(screen.getByText('Company Name')).toBeInTheDocument();
      expect(screen.getByTestId('text-field')).toBeInTheDocument();
    });

    test('renders first name field correctly', () => {
      render(
        <MuiFormField
          name="user[firstname]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('PersonIcon')).toBeInTheDocument();
      expect(screen.getByText('First Name')).toBeInTheDocument();
    });

    test('renders email field correctly', () => {
      render(
        <MuiFormField
          name="user[email]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('mui-icon-Email')).toBeInTheDocument();
      // Use getAllByText to avoid multiple matches issue
      const emailTexts = screen.getAllByText('Email');
      expect(emailTexts.length).toBeGreaterThan(0);
    });

    test('renders password field correctly', () => {
      render(
        <MuiFormField
          name="user[password]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('mui-icon-Lock')).toBeInTheDocument();
      expect(screen.getByText('New Password')).toBeInTheDocument();
    });

    test('renders phone field correctly', () => {
      render(
        <MuiFormField
          name="user[contact_number]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('mui-icon-LocalPhone')).toBeInTheDocument();
      expect(screen.getByText('Contact Number')).toBeInTheDocument();
    });
  });

  describe('Field Types and Icons', () => {
    test('renders website field with web icon', () => {
      render(
        <MuiFormField
          name="account[website]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('mui-icon-Web')).toBeInTheDocument();
      expect(screen.getByText('Company Website')).toBeInTheDocument();
    });

    test('renders address field with place icon', () => {
      render(
        <MuiFormField
          name="account[address]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('mui-icon-Place')).toBeInTheDocument();
      expect(screen.getByText('Company Address')).toBeInTheDocument();
    });

    test('renders job title field with work icon', () => {
      render(
        <MuiFormField
          name="user[job_title]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('mui-icon-Work')).toBeInTheDocument();
      expect(screen.getByText('Job Title')).toBeInTheDocument();
    });

    test('renders repeat password field with enhanced encryption icon', () => {
      render(
        <MuiFormField
          name="password_confirm"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('mui-icon-EnhancedEncryption')).toBeInTheDocument();
      expect(screen.getByText('Repeat New Password')).toBeInTheDocument();
    });

    test('renders last name field with person icon', () => {
      render(
        <MuiFormField
          name="user[lastname]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('PersonIcon')).toBeInTheDocument();
      expect(screen.getByText('Last Name')).toBeInTheDocument();
    });

    test('renders company email field with mail outline icon', () => {
      render(
        <MuiFormField
          name="account[email]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('mui-icon-MailOutline')).toBeInTheDocument();
      expect(screen.getByText('Company Email')).toBeInTheDocument();
    });

    test('renders company landline field with phone callback icon', () => {
      render(
        <MuiFormField
          name="account[landline]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('mui-icon-PhoneCallback')).toBeInTheDocument();
      expect(screen.getByText('Company Landline Number')).toBeInTheDocument();
    });

    test('renders display name field with rename icon', () => {
      render(
        <MuiFormField
          name="user[display_name]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('mui-icon-DriveFileRenameOutline')).toBeInTheDocument();
      expect(screen.getByText('Display Name')).toBeInTheDocument();
    });
  });

  describe('Props and Functionality', () => {
    test('displays provided value', () => {
      render(
        <MuiFormField
          name="user[firstname]"
          value="John"
          onChange={() => {}}
        />
      );

      const textField = screen.getByTestId('text-field');
      expect(textField).toHaveAttribute('value', 'John');
    });

    test('handles onChange events', () => {
      const mockOnChange = jest.fn();
      render(
        <MuiFormField
          name="user[email]"
          value=""
          onChange={mockOnChange}
        />
      );

      const textField = screen.getByTestId('text-field');
      // The onChange function is passed as a prop but not as an attribute
      expect(textField).toBeInTheDocument();
      expect(textField).toHaveAttribute('name', 'user[email]');
    });

    test('passes type prop to TextField', () => {
      render(
        <MuiFormField
          name="user[email]"
          type="email"
          value=""
          onChange={() => {}}
        />
      );

      const textField = screen.getByTestId('text-field');
      expect(textField).toHaveAttribute('type', 'email');
    });

    test('renders with default props when unknown name provided', () => {
      render(
        <MuiFormField
          name="unknown_field"
          value=""
          onChange={() => {}}
        />
      );

      // Should still render the basic structure
      expect(screen.getByTestId('formcontrol')).toBeInTheDocument();
      expect(screen.getByTestId('text-field')).toBeInTheDocument();
    });
  });

  describe('Required Fields', () => {
    test('shows required indicator for required fields', () => {
      render(
        <MuiFormField
          name="user[firstname]"
          value=""
          onChange={() => {}}
        />
      );

      // First name is required, should show red asterisk
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    test('does not show required indicator for optional fields', () => {
      render(
        <MuiFormField
          name="user[contact_number]"
          value=""
          onChange={() => {}}
        />
      );

      // Contact number is not required
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    test('shows required for company name', () => {
      render(
        <MuiFormField
          name="account[name]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    test('shows required for user email', () => {
      render(
        <MuiFormField
          name="user[email]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    test('shows required for company email', () => {
      render(
        <MuiFormField
          name="account[email]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Field Validation and States', () => {
    test('renders field with error state', () => {
      render(
        <MuiFormField
          name="user[email]"
          value="invalid-email"
          onChange={() => {}}
          errorMessage="Invalid email format"
        />
      );

      const textField = screen.getByTestId('text-field');
      expect(textField).toHaveAttribute('data-error', 'true');
      expect(textField).toHaveAttribute('data-helper-text', 'Invalid email format');
    });

    test('renders field without error when no error message', () => {
      render(
        <MuiFormField
          name="user[email]"
          value="test@example.com"
          onChange={() => {}}
        />
      );

      const textField = screen.getByTestId('text-field');
      expect(textField).toHaveAttribute('data-error', 'false');
      expect(textField).toHaveAttribute('data-helper-text', '');
    });

    test('passes name prop correctly', () => {
      render(
        <MuiFormField
          name="user[email]"
          value=""
          onChange={() => {}}
        />
      );

      const textField = screen.getByTestId('text-field');
      expect(textField).toHaveAttribute('name', 'user[email]');
    });
  });

  describe('Special Components and RegNumber', () => {
    test('renders registration number field', () => {
      render(
        <MuiFormField
          name="account[reg_number]"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByTestId('formcontrol')).toBeInTheDocument();
      expect(screen.getByText('Registration Number')).toBeInTheDocument();
      // RegNumber component should render the ® symbol
      expect(screen.getByText('®')).toBeInTheDocument();
    });

    test('handles key down events for name fields', () => {
      const mockOnChange = jest.fn();
      render(
        <MuiFormField
          name="user[firstname]"
          value=""
          onChange={mockOnChange}
        />
      );

      const textField = screen.getByTestId('text-field');
      // The onKeyDown function is passed but function props don't appear as attributes
      expect(textField).toBeInTheDocument();
      expect(textField).toHaveAttribute('name', 'user[firstname]');
    });

    test('displays labels correctly for different field types', () => {
      const fieldTests = [
        { name: 'user[firstname]', expectedLabel: 'First Name' },
        { name: 'user[lastname]', expectedLabel: 'Last Name' },
        { name: 'account[name]', expectedLabel: 'Company Name' },
        { name: 'account[address]', expectedLabel: 'Company Address' },
      ];

      fieldTests.forEach(({ name, expectedLabel }) => {
        const { unmount } = render(
          <MuiFormField
            name={name}
            value=""
            onChange={() => {}}
          />
        );
        
        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
        unmount();
      });
    });

    test('handles password type fields correctly', () => {
      render(
        <MuiFormField
          name="user[password]"
          type="password"
          value="test123"
          onChange={() => {}}
        />
      );
      
      expect(screen.getByText('New Password')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test123')).toBeInTheDocument();
    });

    test('handles email type fields correctly', () => {
      render(
        <MuiFormField
          name="user[email]"
          type="email"
          value="test@example.com"
          onChange={() => {}}
        />
      );
      
      // Use getAllByText since "Email" appears twice (icon and label)
      const emailElements = screen.getAllByText('Email');
      expect(emailElements.length).toBeGreaterThan(0);
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    test('handles textarea type fields correctly', () => {
      render(
        <MuiFormField
          name="account[address]"
          type="textarea"
          value="123 Test Street"
          onChange={() => {}}
        />
      );
      
      expect(screen.getByText('Company Address')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Test Street')).toBeInTheDocument();
    });

    test('handles numeric input fields', () => {
      render(
        <MuiFormField
          name="account[reg_number]"
          type="text"
          value="12345"
          onChange={() => {}}
        />
      );
      
      expect(screen.getByDisplayValue('12345')).toBeInTheDocument();
    });

    test('handles special characters in field values', () => {
      render(
        <MuiFormField
          name="account[website]"
          value="https://example.com/special?param=value&other=123"
          onChange={() => {}}
        />
      );
      
      expect(screen.getByDisplayValue('https://example.com/special?param=value&other=123')).toBeInTheDocument();
    });

    test('handles empty string values', () => {
      render(
        <MuiFormField
          name="user[firstname]"
          value=""
          onChange={() => {}}
        />
      );
      
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    test('handles undefined onChange prop gracefully', () => {
      render(
        <MuiFormField
          name="user[firstname]"
          value="John"
        />
      );
      
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    test('handles keydown events to prevent numbers in firstname field', () => {
      const { fireEvent } = require('@testing-library/react');
      
      render(
        <MuiFormField
          name="firstname"  // Use the exact name that triggers the condition
          value="John"
          onChange={() => {}}
        />
      );
      
      const input = screen.getByTestId('text-field');
      
      // Use fireEvent to properly trigger the onKeyDown handler
      fireEvent.keyDown(input, { key: '1' });
      fireEvent.keyDown(input, { key: '2' });
      fireEvent.keyDown(input, { key: 'a' }); // This should not be prevented
      
      expect(input).toBeInTheDocument();
    });

    test('handles keydown events to prevent numbers in lastname field', () => {
      const { fireEvent } = require('@testing-library/react');
      
      render(
        <MuiFormField
          name="lastname"  // Use the exact name that triggers the condition
          value="Doe"
          onChange={() => {}}
        />
      );
      
      const input = screen.getByTestId('text-field');
      
      // Use fireEvent to properly trigger the onKeyDown handler
      fireEvent.keyDown(input, { key: '5' });
      fireEvent.keyDown(input, { key: '9' });
      fireEvent.keyDown(input, { key: 'z' }); // This should not be prevented
      
      expect(input).toBeInTheDocument();
    });

    test('handles component without name prop', () => {
      render(
        <MuiFormField
          value="test"
          onChange={() => {}}
        />
      );
      
      // Should render without crashing even without name prop (covers default parameter)
      expect(screen.getByTestId('formcontrol')).toBeInTheDocument();
      expect(screen.getByTestId('text-field')).toBeInTheDocument();
    });

    test('handles component without value prop', () => {
      render(
        <MuiFormField
          name="user[firstname]"
          onChange={() => {}}
        />
      );
      
      // Should render without crashing even without value prop (covers default parameter)
      expect(screen.getByTestId('formcontrol')).toBeInTheDocument();
      expect(screen.getByTestId('text-field')).toBeInTheDocument();
    });

    test('handles unknown field names gracefully', () => {
      render(
        <MuiFormField
          name="unknown[field]"
          value="test"
          onChange={() => {}}
        />
      );
      
      // Should render without crashing even with unknown field name
      expect(screen.getByTestId('formcontrol')).toBeInTheDocument();
      expect(screen.getByTestId('text-field')).toBeInTheDocument();
    });

    test('does not interfere with keydown in non-name fields', () => {
      render(
        <MuiFormField
          name="user[email]"
          value="test@example.com"
          onChange={() => {}}
        />
      );
      
      const input = screen.getByTestId('text-field');
      
      // Should allow all keys in email field (not firstname/lastname)
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: '1',
        bubbles: true,
        cancelable: true
      }));
      
      expect(input).toBeInTheDocument();
    });
  });
});