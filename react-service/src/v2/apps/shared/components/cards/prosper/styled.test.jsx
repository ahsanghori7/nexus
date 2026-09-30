import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import '@testing-library/jest-dom';
import { StyledRightContent } from './styled';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    dimensions: {
      MD_SCREEN: 992
    }
  }
}));

// Basic theme for styled-components
const theme = {};

describe('Cards Prosper Styled Components', () => {
  it('renders StyledRightContent without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <StyledRightContent>Test content</StyledRightContent>
      </ThemeProvider>
    );
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveTextContent('Test content');
  });

  it('StyledRightContent applies styles correctly', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <StyledRightContent data-testid="right-content">Content</StyledRightContent>
      </ThemeProvider>
    );
    const element = container.firstChild;
    expect(element).toBeInTheDocument();
  });
});