import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { StyledPromoTokens, StyledSubPanel, StyledH1 } from './styled';

// Mock theme for styled-components
const mockTheme = {
  colors: {
    prosper: {
      prosperPurple: '#6b46c1'
    },
    general: {
      white: '#ffffff'
    }
  }
};

describe('PromoTokens Styled Components', () => {
  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        {component}
      </ThemeProvider>
    );
  };

  describe('StyledPromoTokens', () => {
    it('should render without crashing', () => {
      const { container } = renderWithTheme(
        <StyledPromoTokens>
          <div>Test content</div>
        </StyledPromoTokens>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have flex column layout styles', () => {
      const { container } = renderWithTheme(
        <StyledPromoTokens>
          <div>Test content</div>
        </StyledPromoTokens>
      );
      const styledElement = container.firstChild;
      expect(styledElement).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '0px',
        padding: '0px'
      });
    });

    it('should render children correctly', () => {
      const { getByText } = renderWithTheme(
        <StyledPromoTokens>
          <div>Test child content</div>
        </StyledPromoTokens>
      );
      expect(getByText('Test child content')).toBeInTheDocument();
    });
  });

  describe('StyledSubPanel', () => {
    it('should render without crashing', () => {
      const { container } = renderWithTheme(
        <StyledSubPanel>
          <div>Sub panel content</div>
        </StyledSubPanel>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have correct layout styles', () => {
      const { container } = renderWithTheme(
        <StyledSubPanel>
          <div>Sub panel content</div>
        </StyledSubPanel>
      );
      const styledElement = container.firstChild;
      expect(styledElement).toHaveStyle({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '200px'
      });
    });

    it('should render children correctly', () => {
      const { getByText } = renderWithTheme(
        <StyledSubPanel>
          <span>Panel content</span>
        </StyledSubPanel>
      );
      expect(getByText('Panel content')).toBeInTheDocument();
    });
  });

  describe('StyledH1', () => {
    it('should render without crashing', () => {
      const { container } = renderWithTheme(
        <StyledH1>Heading text</StyledH1>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have correct typography styles', () => {
      const { container } = renderWithTheme(
        <StyledH1>Heading text</StyledH1>
      );
      const styledElement = container.firstChild;
      expect(styledElement).toHaveStyle({
        fontSize: '48px',
        textAlign: 'center',
        fontWeight: 'bold'
      });
    });

    it('should render text content correctly', () => {
      const { getByText } = renderWithTheme(
        <StyledH1>Test Heading</StyledH1>
      );
      expect(getByText('Test Heading')).toBeInTheDocument();
    });

    it('should be rendered as h1 element', () => {
      const { container } = renderWithTheme(
        <StyledH1>Test Heading</StyledH1>
      );
      expect(container.firstChild.tagName).toBe('H1');
    });
  });
});