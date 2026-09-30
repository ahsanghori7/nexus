import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { StyledDetailsColumns } from 'v2/apps/admin/pages/prosper/Accounts/company/details/themes/styled';

// Mock CONSTANTS from clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    dimensions: {
      XL_SCREEN: '1200px',
      LG_SCREEN: '992px',
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

describe('Themes Styled Components', () => {
  const renderWithTheme = (Component, props = {}) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <Component {...props}>Test Content</Component>
      </ThemeProvider>
    );
  };

  it('should export StyledDetailsColumns', () => {
    expect(StyledDetailsColumns).toBeDefined();
  });

  it('should render StyledDetailsColumns without crashing', () => {
    const { container } = renderWithTheme(StyledDetailsColumns);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply correct element type to StyledDetailsColumns', () => {
    const { container } = renderWithTheme(StyledDetailsColumns);
    const styledElement = container.firstChild;
    
    expect(styledElement).toBeInTheDocument();
    expect(styledElement.tagName.toLowerCase()).toBe('div');
  });

  it('should pass through props to StyledDetailsColumns', () => {
    const { container } = renderWithTheme(StyledDetailsColumns, {
      'data-testid': 'custom-test-id',
      className: 'custom-class'
    });
    const styledElement = container.firstChild;
    
    expect(styledElement).toHaveAttribute('data-testid', 'custom-test-id');
    expect(styledElement).toHaveClass('custom-class');
  });

  it('should render children correctly', () => {
    const { getByText } = renderWithTheme(StyledDetailsColumns);
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle multiple children', () => {
    const { getByText } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledDetailsColumns>
          <span>Child 1</span>
          <span>Child 2</span>
        </StyledDetailsColumns>
      </ThemeProvider>
    );
    
    expect(getByText('Child 1')).toBeInTheDocument();
    expect(getByText('Child 2')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledDetailsColumns />
      </ThemeProvider>
    );
    
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild.textContent).toBe('');
  });
});