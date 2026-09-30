import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the dependencies before importing the component
jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn(),
  getQueryStringVars: jest.fn(() => ({})),
}));

jest.mock('v2/helpers/php-globals', () => ({
  PHPAppClinkGloblals: jest.fn(() => ({
    csrfToken: 'mock-csrf-token',
    error_message: null,
  })),
}));

jest.mock('v2/apps/shared/components/muiTheme', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    palette: {
      primary: { main: '#1976d2' },
      error: { main: '#d32f2f' },
    },
  })),
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      clinkLogo: 'mock-clink-logo.png',
      prosperLogoFull: 'mock-prosper-logo.png',
    },
  },
  Image: ({ src }) => <img src={src} alt="Logo" data-testid="logo-image" />,
}));

// Mock MUI components to simplify testing
jest.mock('@mui/material', () => ({
  ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>,
  Typography: ({ children, variant, color, ...props }) => (
    <div data-testid={`typography-${variant}`} data-color={color} {...props}>
      {children}
    </div>
  ),
  Grid: ({ children, ...props }) => (
    <div data-testid="grid" {...props}>
      {children}
    </div>
  ),
  Paper: ({ children, ...props }) => (
    <div data-testid="paper" {...props}>
      {children}
    </div>
  ),
  Container: ({ children }) => <div data-testid="container">{children}</div>,
  TextField: ({ label, value, onChange, ...props }) => (
    <input
      data-testid="email-input"
      placeholder={label}
      value={value}
      onChange={onChange}
      {...props}
    />
  ),
  Button: ({ children, onClick, type, ...props }) => (
    <button data-testid="submit-button" onClick={onClick} type={type} {...props}>
      {children}
    </button>
  ),
}));

import DownloadAll from './DownloadAll';
import { goTo, getQueryStringVars } from 'v2/helpers/url';
import { PHPAppClinkGloblals } from 'v2/helpers/php-globals';
import useMuiTheme from 'v2/apps/shared/components/muiTheme';

describe('DownloadAll Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    getQueryStringVars.mockReturnValue({});
    PHPAppClinkGloblals.mockReturnValue({
      csrfToken: 'mock-csrf-token',
      error_message: null,
    });
    useMuiTheme.mockReturnValue({
      palette: {
        primary: { main: '#1976d2' },
        error: { main: '#d32f2f' },
      },
    });
  });

  it('renders without crashing', () => {
    render(<DownloadAll />);
    
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByText('We are preparing your files for download')).toBeInTheDocument();
  });

  it('displays both company logos', () => {
    render(<DownloadAll />);
    
    const logoImages = screen.getAllByTestId('logo-image');
    expect(logoImages).toHaveLength(2);
    expect(logoImages[0]).toHaveAttribute('src', 'mock-clink-logo.png');
    expect(logoImages[1]).toHaveAttribute('src', 'mock-prosper-logo.png');
  });

  it('shows "preparing files" title when no email parameter', () => {
    getQueryStringVars.mockReturnValue({});
    
    render(<DownloadAll />);
    
    expect(screen.getByText('We are preparing your files for download')).toBeInTheDocument();
  });

  it('shows "thank you" title when email parameter is present', () => {
    getQueryStringVars.mockReturnValue({ email: 'test@example.com' });
    
    render(<DownloadAll />);
    
    expect(screen.getByText("Thank you! We'll notify you as soon as your download is ready")).toBeInTheDocument();
  });

  it('displays email form when no email parameter', () => {
    getQueryStringVars.mockReturnValue({});
    
    render(<DownloadAll />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { type: 'submit' })).toBeInTheDocument();
    expect(screen.getByText('Please provide your email address to receive a notification when your download is ready..')).toBeInTheDocument();
  });

  it('hides email form when email parameter is present and no error', () => {
    getQueryStringVars.mockReturnValue({ email: 'test@example.com' });
    
    render(<DownloadAll />);
    
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { type: 'submit' })).not.toBeInTheDocument();
  });

  it('shows email form when there is an error message', () => {
    getQueryStringVars.mockReturnValue({ email: 'test@example.com' });
    PHPAppClinkGloblals.mockReturnValue({
      csrfToken: 'mock-csrf-token',
      error_message: 'Invalid email format',
    });
    
    render(<DownloadAll />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { type: 'submit' })).toBeInTheDocument();
  });

  it('displays error message when present', () => {
    PHPAppClinkGloblals.mockReturnValue({
      csrfToken: 'mock-csrf-token',
      error_message: 'Invalid email format',
    });
    
    render(<DownloadAll />);
    
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('allows user to input email address', async () => {
    render(<DownloadAll />);
    
    const emailInput = screen.getByRole('textbox');
    await user.type(emailInput, 'test@example.com');
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('submits form with email and redirects', async () => {
    // Mock window.location.href
    delete window.location;
    window.location = { href: 'https://example.com/download' };
    
    render(<DownloadAll />);
    
    const emailInput = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    expect(goTo).toHaveBeenCalledWith('https://example.com/download&email=test%40example.com');
  });

  it('handles CSRF token configuration', () => {
    PHPAppClinkGloblals.mockReturnValue({
      csrfToken: 'valid-token',
      error_message: null,
    });
    
    render(<DownloadAll />);
    
    // Verify component renders properly with CSRF token
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('handles form submission via Enter key', async () => {
    delete window.location;
    window.location = { href: 'https://example.com/download' };
    
    render(<DownloadAll />);
    
    const emailInput = screen.getByRole('textbox');
    
    await user.type(emailInput, 'test@example.com');
    await user.keyboard('{Enter}');
    
    expect(goTo).toHaveBeenCalledWith('https://example.com/download&email=test%40example.com');
  });

  it('uses clink theme', () => {
    render(<DownloadAll />);
    
    expect(useMuiTheme).toHaveBeenCalledWith('clink');
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
  });

  it('handles empty query parameters', () => {
    getQueryStringVars.mockReturnValue(null);
    
    render(<DownloadAll />);
    
    // Should still render without crashing
    expect(screen.getByText('We are preparing your files for download')).toBeInTheDocument();
  });

  it('properly encodes email in URL', async () => {
    delete window.location;
    window.location = { href: 'https://example.com/download' };
    
    render(<DownloadAll />);
    
    const emailInput = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    // Test with email that needs encoding
    await user.type(emailInput, 'test+user@example.com');
    await user.click(submitButton);
    
    expect(goTo).toHaveBeenCalledWith('https://example.com/download&email=test%2Buser%40example.com');
  });
});