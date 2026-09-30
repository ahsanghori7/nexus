import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { LoaderWrapper, PasswordWrapper } from './ChangePassword.styled';

// Mock theme with required constants
const mockTheme = {
  prosperBoxRed: '#F44336',
  LG_SCREEN: 1024
};

// Wrapper component to provide theme context
const ThemeWrapper = ({ children }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
);

describe('ChangePassword.styled', () => {
  describe('LoaderWrapper', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <ThemeWrapper>
          <LoaderWrapper data-testid="loader-wrapper">
            <button>Test Button</button>
          </LoaderWrapper>
        </ThemeWrapper>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      const { getByText } = render(
        <ThemeWrapper>
          <LoaderWrapper>
            <button>Submit</button>
            <span>Loading...</span>
          </LoaderWrapper>
        </ThemeWrapper>
      );
      
      expect(getByText('Submit')).toBeInTheDocument();
      expect(getByText('Loading...')).toBeInTheDocument();
    });

    it('applies correct display style', () => {
      const { container } = render(
        <ThemeWrapper>
          <LoaderWrapper />
        </ThemeWrapper>
      );
      
      const element = container.firstChild;
      const computedStyle = window.getComputedStyle(element);
      expect(computedStyle.display).toBe('flex');
    });
  });

  describe('PasswordWrapper', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <ThemeWrapper>
          <PasswordWrapper data-testid="password-wrapper">
            <div>Test Content</div>
          </PasswordWrapper>
        </ThemeWrapper>
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      const { getByText } = render(
        <ThemeWrapper>
          <PasswordWrapper>
            <div className="prosper-password">
              <div className="prosper-password--wrapper">
                <div className="prosper-password--body">
                  Test Form Content
                </div>
              </div>
            </div>
          </PasswordWrapper>
        </ThemeWrapper>
      );
      
      expect(getByText('Test Form Content')).toBeInTheDocument();
    });

    it('applies max-width constraint', () => {
      const { container } = render(
        <ThemeWrapper>
          <PasswordWrapper />
        </ThemeWrapper>
      );
      
      const element = container.firstChild;
      const computedStyle = window.getComputedStyle(element);
      expect(computedStyle.maxWidth).toBe('1330px');
    });

    it('centers content with auto margins', () => {
      const { container } = render(
        <ThemeWrapper>
          <PasswordWrapper />
        </ThemeWrapper>
      );
      
      const element = container.firstChild;
      const computedStyle = window.getComputedStyle(element);
      expect(computedStyle.marginLeft).toBe('auto');
      expect(computedStyle.marginRight).toBe('auto');
    });
  });

  describe('Component integration', () => {
    it('renders both components together', () => {
      const { getByTestId } = render(
        <ThemeWrapper>
          <PasswordWrapper data-testid="password-wrapper">
            <div className="prosper-password">
              <LoaderWrapper data-testid="loader-wrapper">
                <button>Submit</button>
              </LoaderWrapper>
            </div>
          </PasswordWrapper>
        </ThemeWrapper>
      );
      
      expect(getByTestId('password-wrapper')).toBeInTheDocument();
      expect(getByTestId('loader-wrapper')).toBeInTheDocument();
    });
  });
});