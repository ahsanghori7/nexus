import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import '@testing-library/jest-dom';
import { StyledTooltipContainer, StyledTooltip, MuiNewOpportunityBanner } from './styled';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        white: '#ffffff',
        darkJungleGreen: '#1a1a1a'
      },
      prosper: {
        prosperBoxRed: '#e53e3e'
      }
    },
    dimensions: {
      LG_SCREEN: 1024
    }
  }
}));

// Mock MUI components
jest.mock('@mui/material/Box', () => {
  return ({ children, sx, ...props }) => (
    <div data-testid="mui-box" style={sx} {...props}>
      {children}
    </div>
  );
});

// Basic theme for styled-components
const theme = {};

describe('Cards Big Styled Components', () => {
  describe('StyledTooltipContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledTooltipContainer>Test content</StyledTooltipContainer>
        </ThemeProvider>
      );
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveTextContent('Test content');
    });

    it('displays when matched and not closed', () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledTooltipContainer matched={true} closed={false}>
            Test content
          </StyledTooltipContainer>
        </ThemeProvider>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct base styles when matched and not closed', () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledTooltipContainer matched={true} closed={false} />
        </ThemeProvider>
      );
      const element = container.firstChild;
      expect(element).toHaveStyle('white-space: normal');
      expect(element).toHaveStyle('position: absolute');
      expect(element).toHaveStyle('right: 5px');
      expect(element).toHaveStyle('height: 28px');
      expect(element).toHaveStyle('display: flex');
    });
  });

  describe('StyledTooltip', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledTooltip open={true}>Test content</StyledTooltip>
        </ThemeProvider>
      );
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveTextContent('Test content');
    });

    it('displays when open is true', () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledTooltip open={true}>Test content</StyledTooltip>
        </ThemeProvider>
      );
      const element = container.firstChild;
      expect(element).toHaveStyle('display: flex');
    });

    it('hides when open is false', () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledTooltip open={false}>Test content</StyledTooltip>
        </ThemeProvider>
      );
      const element = container.firstChild;
      expect(element).toHaveStyle('display: none');
    });
  });

  describe('MuiNewOpportunityBanner', () => {
    it('renders without crashing', () => {
      render(<MuiNewOpportunityBanner>New Opportunity</MuiNewOpportunityBanner>);
      expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    });

    it('displays children correctly', () => {
      const testText = 'New Opportunity';
      render(<MuiNewOpportunityBanner>{testText}</MuiNewOpportunityBanner>);
      expect(screen.getByText(testText)).toBeInTheDocument();
    });

    it('applies correct styles', () => {
      render(<MuiNewOpportunityBanner>Test</MuiNewOpportunityBanner>);
      const banner = screen.getByTestId('mui-box');
      
      expect(banner).toHaveStyle({
        position: 'absolute',
        top: '0',
        right: '32px',
        maxWidth: '130px',
        height: '28px',
        backgroundColor: '#e53e3e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: '300',
        color: '#ffffff',
        textAlign: 'center',
        boxSizing: 'border-box',
        borderBottomLeftRadius: '6px',
        borderBottomRightRadius: '6px'
      });
    });

    it('renders as a functional component', () => {
      const { container } = render(<MuiNewOpportunityBanner>Test</MuiNewOpportunityBanner>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});