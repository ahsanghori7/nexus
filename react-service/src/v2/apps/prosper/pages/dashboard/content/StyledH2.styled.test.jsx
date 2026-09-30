import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import StyledH2 from './StyledH2.styled';

// Mock the clink-components constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        japaneseIndigo: '#3f4854'
      }
    },
    fonts: {
      avantGardeGothicPRO: 'AvantGardeGothicPRO'
    },
    dimensions: {
      LG_SCREEN: 992
    }
  }
}));

describe('StyledH2', () => {
  const mockTheme = {};

  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        {component}
      </ThemeProvider>
    );
  };

  it('renders without crashing', () => {
    const { container } = renderWithTheme(<StyledH2>Test heading</StyledH2>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with correct text content', () => {
    const { getByText } = renderWithTheme(<StyledH2>Test Heading Content</StyledH2>);
    expect(getByText('Test Heading Content')).toBeInTheDocument();
  });

  it('renders as h2 element', () => {
    const { container } = renderWithTheme(<StyledH2>Heading</StyledH2>);
    expect(container.firstChild.tagName).toBe('H2');
  });

  it('applies styles correctly', () => {
    const { container } = renderWithTheme(<StyledH2>Styled Heading</StyledH2>);
    const h2Element = container.firstChild;
    
    const computedStyle = window.getComputedStyle(h2Element);
    expect(computedStyle.textAlign).toBe('left');
    expect(computedStyle.fontWeight).toBe('bold');
    expect(computedStyle.fontSize).toBe('19px');
  });

  it('handles empty content', () => {
    const { container } = renderWithTheme(<StyledH2></StyledH2>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles multiple children', () => {
    const { container } = renderWithTheme(
      <StyledH2>
        <span>Part 1</span>
        <span>Part 2</span>
      </StyledH2>
    );
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild.children).toHaveLength(2);
  });
});