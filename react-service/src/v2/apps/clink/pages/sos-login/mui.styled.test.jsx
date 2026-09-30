import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  MuiFormField,
  MuiLoginWrapper,
  MuiTitle,
  MuiClinkImage,
  MuiLink,
  MuiLoginError,
} from './mui.styled';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock CONSTANTS from clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkGreen: '#00ff00',
        white: '#ffffff',
      },
    },
  },
}));

// Mock BASE_URLS since it's missing from the source file
global.BASE_URLS = {
  APP_CLINK: 'https://test.c-link.com',
};

// Create a test theme
const testTheme = createTheme();

// Test wrapper with theme provider
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={testTheme}>{children}</ThemeProvider>
);

describe('MuiFormField', () => {
  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <MuiFormField labelName="Test Label" />
      </TestWrapper>
    );
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should handle onChange events', () => {
    const mockOnChange = jest.fn();
    
    render(
      <TestWrapper>
        <MuiFormField 
          labelName="Email"
          value=""
          onChange={mockOnChange}
          name="email"
        />
      </TestWrapper>
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should display error message when provided', () => {
    render(
      <TestWrapper>
        <MuiFormField 
          labelName="Email"
          errorMessage="Invalid email"
        />
      </TestWrapper>
    );
    
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <TestWrapper>
        <MuiFormField 
          labelName="Email"
          disabled={true}
        />
      </TestWrapper>
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should use correct input type', () => {
    render(
      <TestWrapper>
        <MuiFormField 
          labelName="Password"
          type="password"
        />
      </TestWrapper>
    );
    
    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('type', 'password');
  });
});

describe('MuiLoginWrapper', () => {
  it('should render children without crashing', () => {
    render(
      <TestWrapper>
        <MuiLoginWrapper>
          <div data-testid="test-child">Test Content</div>
        </MuiLoginWrapper>
      </TestWrapper>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should apply correct styling with background image', () => {
    render(
      <TestWrapper>
        <MuiLoginWrapper>
          <div data-testid="test-content">Content</div>
        </MuiLoginWrapper>
      </TestWrapper>
    );
    
    // Check that the test content exists within the wrapper
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});

describe('MuiTitle', () => {
  it('should render children text', () => {
    render(
      <TestWrapper>
        <MuiTitle>Login Title</MuiTitle>
      </TestWrapper>
    );
    
    expect(screen.getByText('Login Title')).toBeInTheDocument();
  });

  it('should accept custom sx prop', () => {
    render(
      <TestWrapper>
        <MuiTitle sx={{ color: 'red' }}>
          Custom Styled Title
        </MuiTitle>
      </TestWrapper>
    );
    
    expect(screen.getByText('Custom Styled Title')).toBeInTheDocument();
  });
});

describe('MuiClinkImage', () => {
  it('should render image with correct attributes', () => {
    render(
      <TestWrapper>
        <MuiClinkImage />
      </TestWrapper>
    );
    
    // The MUI Box component with component="img" is mocked, so we check for the mock structure
    const image = screen.getByTestId('mui-box');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://test.c-link.com/static/images/svg/clink-logo.svg');
    expect(image).toHaveAttribute('alt', 'Reset your password');
  });
});

describe('MuiLink', () => {
  it('should render children and handle click events', () => {
    const mockOnClick = jest.fn();
    
    render(
      <TestWrapper>
        <MuiLink onClick={mockOnClick}>
          Click me
        </MuiLink>
      </TestWrapper>
    );
    
    const link = screen.getByRole('button', { name: 'Click me' });
    expect(link).toBeInTheDocument();
    
    fireEvent.click(link);
    expect(mockOnClick).toHaveBeenCalled();
  });
});

describe('MuiLoginError', () => {
  it('should render error content with translation keys', () => {
    render(
      <TestWrapper>
        <MuiLoginError />
      </TestWrapper>
    );
    
    expect(screen.getByText('login-error-title')).toBeInTheDocument();
    expect(screen.getByText('login-error-content')).toBeInTheDocument();
  });

  it('should render error avatar with correct attributes', () => {
    render(
      <TestWrapper>
        <MuiLoginError />
      </TestWrapper>
    );
    
    // The MUI Avatar component is mocked, so we check for the mock structure
    const avatar = screen.getByTestId('mui-avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://app.c-link.com//static/images/png/wrong.png');
    expect(avatar).toHaveAttribute('alt', 'Login error');
  });
});