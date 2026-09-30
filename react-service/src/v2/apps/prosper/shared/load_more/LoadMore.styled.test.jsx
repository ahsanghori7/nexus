import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import StyledLoadMore from './LoadMore.styled';

// Mock theme to avoid styled-components theme issues
const mockTheme = {};

describe('StyledLoadMore', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledLoadMore>
          <button>Test Button</button>
        </StyledLoadMore>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply correct display and alignment styles', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledLoadMore>
          <button>Test Button</button>
        </StyledLoadMore>
      </ThemeProvider>
    );
    
    const styledElement = container.firstChild;
    const computedStyles = window.getComputedStyle(styledElement);
    
    expect(computedStyles.display).toBe('flex');
  });

  it('should render children correctly', () => {
    const testContent = 'Load More Content';
    const { getByText } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledLoadMore>
          <div>{testContent}</div>
        </StyledLoadMore>
      </ThemeProvider>
    );
    
    expect(getByText(testContent)).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledLoadMore>
          <button>Load More Button</button>
        </StyledLoadMore>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});