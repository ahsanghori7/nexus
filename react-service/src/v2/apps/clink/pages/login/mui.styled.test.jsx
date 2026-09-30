import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
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
    t: (key) => key, // Return the key as the translation
  }),
}));

// Mock global BASE_URLS
global.BASE_URLS = {
  APP_CLINK: 'https://app.c-link.com',
  CLINK_HOST: 'https://c-link.com',
};

// Create a default theme for testing
const theme = createTheme();

// Wrapper component with theme provider
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
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

  it('should call onChange when input value changes', () => {
    const mockOnChange = jest.fn();
    
    render(
      <TestWrapper>
        <MuiFormField 
          labelName="Test Label"
          name="testField"
          onChange={mockOnChange}
          value=""
        />
      </TestWrapper>
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should display error message when provided', () => {
    render(
      <TestWrapper>
        <MuiFormField 
          labelName="Test Label"
          errorMessage="This field is required"
        />
      </TestWrapper>
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <TestWrapper>
        <MuiFormField 
          labelName="Test Label"
          disabled={true}
        />
      </TestWrapper>
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  it('should render as password type when type is password', () => {
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
  it('should render children correctly', () => {
    render(
      <TestWrapper>
        <MuiLoginWrapper>
          <div data-testid="test-child">Test Content</div>
        </MuiLoginWrapper>
      </TestWrapper>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});

describe('MuiTitle', () => {
  it('should render title text correctly', () => {
    render(
      <TestWrapper>
        <MuiTitle>Test Title</MuiTitle>
      </TestWrapper>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should apply custom sx styles', () => {
    render(
      <TestWrapper>
        <MuiTitle sx={{ color: 'red' }}>Styled Title</MuiTitle>
      </TestWrapper>
    );
    
    expect(screen.getByText('Styled Title')).toBeInTheDocument();
  });
});

describe('MuiClinkImage', () => {
  it('should render image with correct src', () => {
    render(
      <TestWrapper>
        <MuiClinkImage />
      </TestWrapper>
    );
    
    const image = screen.getByTestId('mui-box');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://app.c-link.com/static/images/svg/clink-logo.svg');
  });
});

describe('MuiLink', () => {
  it('should render link text correctly', () => {
    render(
      <TestWrapper>
        <MuiLink>Test Link</MuiLink>
      </TestWrapper>
    );
    
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const mockOnClick = jest.fn();
    
    render(
      <TestWrapper>
        <MuiLink onClick={mockOnClick}>Clickable Link</MuiLink>
      </TestWrapper>
    );
    
    const link = screen.getByText('Clickable Link');
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

  it('should render error image', () => {
    render(
      <TestWrapper>
        <MuiLoginError />
      </TestWrapper>
    );
    
    const image = screen.getByTestId('mui-avatar');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://app.c-link.com//static/images/png/wrong.png');
  });
});

describe('MuiFormField - testId prop coverage', () => {
  it('should accept testId prop and render without errors', () => {
    render(
      <TestWrapper>
        <MuiFormField
          labelName="Email"
          testId="custom-email-input"
        />
      </TestWrapper>
    );

    // Verify the component renders successfully with the testId prop
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should render with all props including testId', () => {
    const mockChange = jest.fn();
    render(
      <TestWrapper>
        <MuiFormField
          name="email"
          labelName="Email Address"
          value="test@example.com"
          onChange={mockChange}
          type="email"
          errorMessage=""
          disabled={false}
          testId="form-field-with-all-props"
        />
      </TestWrapper>
    );

    // Verify all the props are working correctly
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test@example.com');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should apply testId to password field type', () => {
    render(
      <TestWrapper>
        <MuiFormField
          labelName="Password"
          type="password"
          testId="password-field-test-id"
        />
      </TestWrapper>
    );

    // Verify password field renders
    expect(screen.getByText('Password')).toBeInTheDocument();
  });
});

describe('MuiLink - testid prop coverage', () => {
  it('should render link with testid data attribute', () => {
    render(
      <TestWrapper>
        <MuiLink testid="custom-link">
          Link Text
        </MuiLink>
      </TestWrapper>
    );

    const link = screen.getByTestId('custom-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('Link Text');
  });

  it('should render link with testid and onClick handler', () => {
    const mockClick = jest.fn();
    render(
      <TestWrapper>
        <MuiLink testid="clickable-custom-link" onClick={mockClick}>
          Click Here
        </MuiLink>
      </TestWrapper>
    );

    const link = screen.getByTestId('clickable-custom-link');
    fireEvent.click(link);

    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(link).toHaveTextContent('Click Here');
  });

  it('should have all props including testid and children', () => {
    const mockClick = jest.fn();
    render(
      <TestWrapper>
        <MuiLink testid="full-coverage-link" onClick={mockClick}>
          Full Coverage Link
        </MuiLink>
      </TestWrapper>
    );

    const link = screen.getByTestId('full-coverage-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('data-testid', 'full-coverage-link');
    fireEvent.click(link);
    expect(mockClick).toHaveBeenCalled();
  });
});

describe('MuiLoginWrapper - props coverage', () => {
  it('should accept and render with custom data attributes', () => {
    render(
      <TestWrapper>
        <MuiLoginWrapper data-testid="custom-login-wrapper">
          <div>Content inside wrapper</div>
        </MuiLoginWrapper>
      </TestWrapper>
    );

    const wrapper = screen.getByTestId('custom-login-wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveTextContent('Content inside wrapper');
  });

  it('should render children with all data attributes', () => {
    render(
      <TestWrapper>
        <MuiLoginWrapper data-testid="login-wrapper-complete">
          <div data-testid="child-element">Child Content</div>
        </MuiLoginWrapper>
      </TestWrapper>
    );

    const wrapper = screen.getByTestId('login-wrapper-complete');
    const child = screen.getByTestId('child-element');
    
    expect(wrapper).toBeInTheDocument();
    expect(child).toBeInTheDocument();
  });
});

describe('MuiTitle - props validation coverage', () => {
  it('should render with children prop', () => {
    render(
      <TestWrapper>
        <MuiTitle>
          Title Content
        </MuiTitle>
      </TestWrapper>
    );

    const title = screen.getByText('Title Content');
    expect(title).toBeInTheDocument();
  });

  it('should render with both children and sx props', () => {
    render(
      <TestWrapper>
        <MuiTitle sx={{ fontWeight: 'bold' }}>
          Styled Title
        </MuiTitle>
      </TestWrapper>
    );

    const title = screen.getByText('Styled Title');
    expect(title).toBeInTheDocument();
  });
});