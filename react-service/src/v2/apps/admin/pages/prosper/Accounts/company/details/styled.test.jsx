import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { StyledCheckboxWrapper } from 'v2/apps/admin/pages/prosper/Accounts/company/details/styled';

// Mock CONSTANTS from clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxGreen: '#00ff00',
        boxInset: '#f0f0f0',
      },
      general: {
        white: '#ffffff',
      },
    },
    s3: {
      checkmarkGreen: 'http://example.com/checkmark.png',
    },
    dimensions: {
      XL_SCREEN: '1200px',
    },
  },
}));

// Basic theme for styled-components
const mockTheme = {
  colors: {
    primary: '#000',
    secondary: '#fff',
  },
};

describe('Details Styled Components', () => {
  const renderWithTheme = (Component, props = {}) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <Component {...props}>Test Content</Component>
      </ThemeProvider>
    );
  };

  it('should export StyledCheckboxWrapper', () => {
    expect(StyledCheckboxWrapper).toBeDefined();
  });

  it('should render StyledCheckboxWrapper without crashing', () => {
    const { container } = renderWithTheme(StyledCheckboxWrapper);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply correct element type to StyledCheckboxWrapper', () => {
    const { container } = renderWithTheme(StyledCheckboxWrapper);
    const styledElement = container.firstChild;
    
    expect(styledElement).toBeInTheDocument();
    expect(styledElement.tagName.toLowerCase()).toBe('div');
  });

  it('should pass through props to StyledCheckboxWrapper', () => {
    const { container } = renderWithTheme(StyledCheckboxWrapper, {
      'data-testid': 'custom-test-id',
      className: 'custom-class'
    });
    const styledElement = container.firstChild;
    
    expect(styledElement).toHaveAttribute('data-testid', 'custom-test-id');
    expect(styledElement).toHaveClass('custom-class');
  });

  it('should render children correctly', () => {
    const { getByText } = renderWithTheme(StyledCheckboxWrapper);
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle multiple children', () => {
    const { getByText } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledCheckboxWrapper>
          <span>Child 1</span>
          <span>Child 2</span>
        </StyledCheckboxWrapper>
      </ThemeProvider>
    );
    
    expect(getByText('Child 1')).toBeInTheDocument();
    expect(getByText('Child 2')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledCheckboxWrapper />
      </ThemeProvider>
    );
    
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild.textContent).toBe('');
  });

  it('should accept additional HTML attributes', () => {
    const { container } = renderWithTheme(StyledCheckboxWrapper, {
      id: 'checkbox-wrapper',
      role: 'checkbox'
    });
    const styledElement = container.firstChild;
    
    expect(styledElement).toHaveAttribute('id', 'checkbox-wrapper');
    expect(styledElement).toHaveAttribute('role', 'checkbox');
  });
});