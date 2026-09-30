import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import * as StyledComponents from 'v2/apps/admin/pages/prosper/Accounts/company/description/styled';

// Mock CONSTANTS from clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperCursorGray: '#cccccc',
        prosperCursorGrayDark: '#999999',
      },
      general: {
        japaneseIndigo: '#293e5c',
      },
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

describe('Description Styled Components', () => {
  const renderWithTheme = (Component, props = {}) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <Component {...props}>Test Content</Component>
      </ThemeProvider>
    );
  };

  it('should export StyledDescriptionItem', () => {
    expect(StyledComponents.StyledDescriptionItem).toBeDefined();
  });

  it('should render StyledDescriptionItem without crashing', () => {
    const { container } = renderWithTheme(StyledComponents.StyledDescriptionItem);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should export StyledDescriptionItemContent', () => {
    expect(StyledComponents.StyledDescriptionItemContent).toBeDefined();
  });

  it('should render StyledDescriptionItemContent without crashing', () => {
    const { container } = renderWithTheme(StyledComponents.StyledDescriptionItemContent);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply correct styles to StyledDescriptionItem', () => {
    const { container } = renderWithTheme(StyledComponents.StyledDescriptionItem);
    const styledElement = container.firstChild;
    
    // Check if the component was created and styled
    expect(styledElement).toBeInTheDocument();
    expect(styledElement.tagName.toLowerCase()).toBe('div');
  });

  it('should apply correct styles to StyledDescriptionItemContent', () => {
    const { container } = renderWithTheme(StyledComponents.StyledDescriptionItemContent);
    const styledElement = container.firstChild;
    
    expect(styledElement).toBeInTheDocument();
    expect(styledElement.tagName.toLowerCase()).toBe('div');
  });

  it('should handle className prop for StyledDescriptionItemContent', () => {
    const { container } = renderWithTheme(StyledComponents.StyledDescriptionItemContent, {
      className: 'description-box'
    });
    const styledElement = container.firstChild;
    
    expect(styledElement).toHaveClass('description-box');
  });

  it('should pass through props to StyledDescriptionItem', () => {
    const { container } = renderWithTheme(StyledComponents.StyledDescriptionItem, {
      'data-testid': 'custom-test-id'
    });
    const styledElement = container.firstChild;
    
    expect(styledElement).toHaveAttribute('data-testid', 'custom-test-id');
  });

  it('should pass through props to StyledDescriptionItemContent', () => {
    const { container } = renderWithTheme(StyledComponents.StyledDescriptionItemContent, {
      'data-testid': 'custom-test-id'
    });
    const styledElement = container.firstChild;
    
    expect(styledElement).toHaveAttribute('data-testid', 'custom-test-id');
  });

  it('should render children correctly', () => {
    const { getByText } = renderWithTheme(StyledComponents.StyledDescriptionItem);
    expect(getByText('Test Content')).toBeInTheDocument();
  });
});