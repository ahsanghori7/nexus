import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from './Login';

// Mock BASE_URLS global
global.BASE_URLS = {
  PROSPER: 'https://prosper.test',
  PROSPER_PASSWORD: '/password',
};

// Mock clink-components
jest.mock('clink-components', () => ({
  Login: ({ theme, method, action, csrf, app, forgotPasswordLink, requestLoginLink }) => (
    <div data-testid="login-component">
      <div data-testid="theme">{theme}</div>
      <div data-testid="method">{method}</div>
      <div data-testid="action">{action}</div>
      <div data-testid="csrf">{csrf ? JSON.stringify(csrf) : 'null'}</div>
      <div data-testid="app">{app}</div>
      <div data-testid="forgot-password-link">{forgotPasswordLink}</div>
      <div data-testid="request-login-link">{requestLoginLink}</div>
    </div>
  ),
  Page: ({ children, noMarginTop }) => (
    <div data-testid="page" data-no-margin-top={noMarginTop}>
      {children}
    </div>
  ),
}));

// Mock Loading component
jest.mock('v2/apps/shared/components/Loading', () => {
  return function MockLoading({ status, message }) {
    return (
      <div data-testid="loading" data-status={status}>
        {message}
      </div>
    );
  };
});

// Mock PHPGloblals helper
jest.mock('v2/helpers/php-globals', () => {
  return jest.fn();
});

const mockPHPGloblals = require('v2/helpers/php-globals');

describe('Login Component', () => {
  const defaultProps = {
    theme: 'prosper',
    app: 'test-app',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing with basic props', () => {
    mockPHPGloblals.mockReturnValue(null);
    
    render(<Login {...defaultProps} />);
    
    const page = screen.getByTestId('page');
    const loginComponent = screen.getByTestId('login-component');
    
    expect(page).toBeInTheDocument();
    expect(loginComponent).toBeInTheDocument();
  });

  test('renders Page component with noMarginTop prop', () => {
    mockPHPGloblals.mockReturnValue(null);
    
    render(<Login {...defaultProps} />);
    
    const page = screen.getByTestId('page');
    expect(page).toHaveAttribute('data-no-margin-top', 'true');
  });

  test('passes correct props to LoginComponent when no config', () => {
    mockPHPGloblals.mockReturnValue(null);
    
    render(<Login {...defaultProps} />);
    
    expect(screen.getByTestId('theme')).toHaveTextContent('prosper');
    expect(screen.getByTestId('method')).toHaveTextContent('post');
    expect(screen.getByTestId('action')).toHaveTextContent('login/validate');
    expect(screen.getByTestId('csrf')).toHaveTextContent('null');
    expect(screen.getByTestId('app')).toHaveTextContent('test-app');
    expect(screen.getByTestId('forgot-password-link')).toHaveTextContent(
      'https://prosper.test/password/reset'
    );
    expect(screen.getByTestId('request-login-link')).toHaveTextContent(
      'https://prosper.test/account/request_login'
    );
  });

  test('includes CSRF token when provided in config', () => {
    const mockConfig = {
      csfr: 'test-csrf-token',
    };
    mockPHPGloblals.mockReturnValue(mockConfig);
    
    render(<Login {...defaultProps} />);
    
    const csrfElement = screen.getByTestId('csrf');
    const expectedCsrf = JSON.stringify({
      name: 'csfr_token',
      value: 'test-csrf-token',
    });
    
    expect(csrfElement).toHaveTextContent(expectedCsrf);
  });

  test('displays error message when provided in config', () => {
    const mockConfig = {
      messages: {
        error: 'Login failed. Please try again.',
      },
    };
    mockPHPGloblals.mockReturnValue(mockConfig);
    
    render(<Login {...defaultProps} />);
    
    const loading = screen.getByTestId('loading');
    expect(loading).toBeInTheDocument();
    expect(loading).toHaveAttribute('data-status', 'error');
    expect(loading).toHaveTextContent('Login failed. Please try again.');
  });

  test('does not display error message when no error in config', () => {
    const mockConfig = {
      messages: {},
    };
    mockPHPGloblals.mockReturnValue(mockConfig);
    
    render(<Login {...defaultProps} />);
    
    const loading = screen.queryByTestId('loading');
    expect(loading).not.toBeInTheDocument();
  });

  test('handles config with both CSRF and error message', () => {
    const mockConfig = {
      csfr: 'test-csrf-token',
      messages: {
        error: 'Invalid credentials',
      },
    };
    mockPHPGloblals.mockReturnValue(mockConfig);
    
    render(<Login {...defaultProps} />);
    
    // Check CSRF token
    const csrfElement = screen.getByTestId('csrf');
    const expectedCsrf = JSON.stringify({
      name: 'csfr_token',
      value: 'test-csrf-token',
    });
    expect(csrfElement).toHaveTextContent(expectedCsrf);
    
    // Check error message
    const loading = screen.getByTestId('loading');
    expect(loading).toBeInTheDocument();
    expect(loading).toHaveTextContent('Invalid credentials');
  });

  test('handles empty config object', () => {
    const mockConfig = {};
    mockPHPGloblals.mockReturnValue(mockConfig);
    
    render(<Login {...defaultProps} />);
    
    const loginComponent = screen.getByTestId('login-component');
    expect(loginComponent).toBeInTheDocument();
    
    expect(screen.getByTestId('csrf')).toHaveTextContent('null');
    
    const loading = screen.queryByTestId('loading');
    expect(loading).not.toBeInTheDocument();
  });

  test('renders with different theme', () => {
    mockPHPGloblals.mockReturnValue(null);
    
    render(<Login {...defaultProps} theme="clink" />);
    
    expect(screen.getByTestId('theme')).toHaveTextContent('clink');
  });

  test('renders with different app', () => {
    mockPHPGloblals.mockReturnValue(null);
    
    render(<Login {...defaultProps} app="different-app" />);
    
    expect(screen.getByTestId('app')).toHaveTextContent('different-app');
  });

  test('handles undefined props gracefully', () => {
    mockPHPGloblals.mockReturnValue(null);
    
    render(<Login />);
    
    const loginComponent = screen.getByTestId('login-component');
    expect(loginComponent).toBeInTheDocument();
    
    // Should handle undefined theme and app
    expect(screen.getByTestId('theme')).toHaveTextContent('');
    expect(screen.getByTestId('app')).toHaveTextContent('');
  });

  test('constructs correct URLs using BASE_URLS', () => {
    mockPHPGloblals.mockReturnValue(null);
    
    render(<Login {...defaultProps} />);
    
    expect(screen.getByTestId('forgot-password-link')).toHaveTextContent(
      'https://prosper.test/password/reset'
    );
    expect(screen.getByTestId('request-login-link')).toHaveTextContent(
      'https://prosper.test/account/request_login'
    );
  });

  test('handles config with only CSRF token', () => {
    const mockConfig = {
      csfr: 'only-csrf-token',
    };
    mockPHPGloblals.mockReturnValue(mockConfig);
    
    render(<Login {...defaultProps} />);
    
    const csrfElement = screen.getByTestId('csrf');
    const expectedCsrf = JSON.stringify({
      name: 'csfr_token',
      value: 'only-csrf-token',
    });
    expect(csrfElement).toHaveTextContent(expectedCsrf);
    
    const loading = screen.queryByTestId('loading');
    expect(loading).not.toBeInTheDocument();
  });

  test('handles config with only error message', () => {
    const mockConfig = {
      messages: {
        error: 'Network error occurred',
      },
    };
    mockPHPGloblals.mockReturnValue(mockConfig);
    
    render(<Login {...defaultProps} />);
    
    expect(screen.getByTestId('csrf')).toHaveTextContent('null');
    
    const loading = screen.getByTestId('loading');
    expect(loading).toBeInTheDocument();
    expect(loading).toHaveTextContent('Network error occurred');
  });
});