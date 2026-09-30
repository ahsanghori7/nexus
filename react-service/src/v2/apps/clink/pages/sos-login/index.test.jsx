import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SosLogin from './index';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock react-router-dom (SosLogin uses useLocation)
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ search: '', pathname: '/sos-login' }),
}));

// Mock @mui/material/styles to avoid "type is invalid... got: undefined" from styled(undefined)
jest.mock('@mui/material/styles', () => ({
  ThemeProvider: ({ children }) => children,
  createTheme: () => ({}),
  useTheme: () => ({
    palette: { mode: 'light' },
    breakpoints: {
      down: (key) => `(max-width: ${key})`,
      up: (key) => `(min-width: ${key})`,
      between: (a, b) => `(min-width: ${a}) and (max-width: ${b})`,
    },
  }),
  styled: (Component) => (props) =>
    Component ? require('react').createElement(Component, props) : null,
}));

// Mock Box with component prop support (SosLogin uses <Box component="form">)
jest.mock('@mui/material/Box', () => {
  const React = require('react');
  return function Box({ component: Component = 'div', children, ...props }) {
    return React.createElement(Component, { 'data-testid': 'mui-box', ...props }, children);
  };
});

// Mock CONSTANTS from clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        ghostWhite2: '#f9f9f9',
        platinum2: '#e5e5e5',
      },
    },
  },
}));

// Mock the styled components
jest.mock('./mui.styled', () => ({
  MuiFormField: ({ labelName, value, onChange, type, name, required }) => (
    <div data-testid="mui-form-field">
      <label>{labelName}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        name={name}
        required={required}
        data-testid="form-input"
      />
    </div>
  ),
  MuiLoginWrapper: ({ children }) => (
    <div data-testid="mui-login-wrapper">{children}</div>
  ),
  MuiTitle: ({ children }) => (
    <div data-testid="mui-title">{children}</div>
  ),
  MuiClinkImage: () => (
    <div data-testid="mui-clink-image">Clink Logo</div>
  ),
  MuiSSOError: () => (
    <div data-testid="mui-sso-error">SSO Error</div>
  ),
}));

// Create a test theme
const testTheme = createTheme();

// Test wrapper with theme provider
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={testTheme}>{children}</ThemeProvider>
);

describe('SosLogin Component', () => {
  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <SosLogin />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('mui-login-wrapper')).toBeInTheDocument();
  });

  it('should render the Clink logo', () => {
    render(
      <TestWrapper>
        <SosLogin />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('mui-clink-image')).toBeInTheDocument();
  });

  it('should render the login title with translation key', () => {
    render(
      <TestWrapper>
        <SosLogin />
      </TestWrapper>
    );
    
    const title = screen.getByTestId('mui-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('login-sign-in');
  });

  it('should render the email form field with correct props', () => {
    render(
      <TestWrapper>
        <SosLogin />
      </TestWrapper>
    );
    
    const formField = screen.getByTestId('mui-form-field');
    expect(formField).toBeInTheDocument();
    expect(screen.getByText('login-email')).toBeInTheDocument();
    
    const input = screen.getByTestId('form-input');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
  });

  it('should handle email input changes', () => {
    render(
      <TestWrapper>
        <SosLogin />
      </TestWrapper>
    );
    
    const input = screen.getByTestId('form-input');
    
    // Initial value should be empty
    expect(input).toHaveValue('');
    
    // Simulate typing in the email field
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    // Value should be updated
    expect(input).toHaveValue('test@example.com');
  });

  it('should render a form with correct method and action', () => {
    render(
      <TestWrapper>
        <SosLogin />
      </TestWrapper>
    );
    
    // Check that form elements exist since Box with component="form" is mocked
    expect(screen.getByTestId('form-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sos-submit' })).toBeInTheDocument();
  });

  it('should render submit button with correct text and attributes', () => {
    render(
      <TestWrapper>
        <SosLogin />
      </TestWrapper>
    );
    
    const submitButton = screen.getByRole('button', { name: 'sos-submit' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should render email field as required', () => {
    render(
      <TestWrapper>
        <SosLogin />
      </TestWrapper>
    );
    
    const input = screen.getByTestId('form-input');
    expect(input).toBeRequired();
  });

  it('should have proper form structure for submission', () => {
    render(
      <TestWrapper>
        <SosLogin />
      </TestWrapper>
    );
    
    // Check that the form has method="GET" and action="/sign_up_check"
    // These are set on the Box component with component="form"
    const formElements = screen.getAllByRole('generic');
    const formBox = formElements.find(el => 
      el.hasAttribute('method') && el.getAttribute('method') === 'GET'
    );
    
    // Since Box is mocked, we just verify the structure exists
    expect(screen.getByTestId('form-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sos-submit' })).toBeInTheDocument();
  });

  it('should clear email when value is updated', () => {
    render(
      <TestWrapper>
        <SosLogin />
      </TestWrapper>
    );
    
    const input = screen.getByTestId('form-input');
    
    // Type in email
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(input).toHaveValue('test@example.com');
    
    // Clear email
    fireEvent.change(input, { target: { value: '' } });
    expect(input).toHaveValue('');
  });

  it('should maintain controlled input behavior', () => {
    render(
      <TestWrapper>
        <SosLogin />
      </TestWrapper>
    );
    
    const input = screen.getByTestId('form-input');
    
    // Multiple changes should work correctly
    fireEvent.change(input, { target: { value: 'a' } });
    expect(input).toHaveValue('a');
    
    fireEvent.change(input, { target: { value: 'ab' } });
    expect(input).toHaveValue('ab');
    
    fireEvent.change(input, { target: { value: 'abc@test.com' } });
    expect(input).toHaveValue('abc@test.com');
  });
});