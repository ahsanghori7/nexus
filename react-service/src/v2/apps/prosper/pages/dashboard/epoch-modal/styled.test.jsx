import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { StyledButtonWrapper, StyledEpochModalContent } from './styled';

// Mock the clink-components constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    dimensions: {
      LG_SCREEN: 992
    }
  }
}));

describe('Epoch Modal Styled Components', () => {
  const mockTheme = {};

  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        {component}
      </ThemeProvider>
    );
  };

  describe('StyledButtonWrapper', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <StyledButtonWrapper>
          <button>Test Button</button>
        </StyledButtonWrapper>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      const { getByText } = renderWithTheme(
        <StyledButtonWrapper>
          <button>Click me</button>
        </StyledButtonWrapper>
      );
      expect(getByText('Click me')).toBeInTheDocument();
    });

    it('applies flex layout styles', () => {
      const { container } = renderWithTheme(
        <StyledButtonWrapper>
          <div>Content</div>
        </StyledButtonWrapper>
      );
      const wrapper = container.firstChild;
      const computedStyle = window.getComputedStyle(wrapper);
      
      expect(computedStyle.display).toBe('flex');
      expect(computedStyle.justifyContent).toBe('center');
      expect(computedStyle.width).toBe('100%');
    });

    it('handles multiple children', () => {
      const { container } = renderWithTheme(
        <StyledButtonWrapper>
          <button>Button 1</button>
          <button>Button 2</button>
        </StyledButtonWrapper>
      );
      expect(container.firstChild.children).toHaveLength(2);
    });

    it('handles empty content', () => {
      const { container } = renderWithTheme(<StyledButtonWrapper />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('StyledEpochModalContent', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <StyledEpochModalContent>
          <iframe title="test" src="about:blank" />
        </StyledEpochModalContent>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders iframe content correctly', () => {
      const { container } = renderWithTheme(
        <StyledEpochModalContent>
          <iframe title="epoch-content" src="about:blank" />
        </StyledEpochModalContent>
      );
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('title', 'epoch-content');
    });

    it('renders other content types', () => {
      const { getByText } = renderWithTheme(
        <StyledEpochModalContent>
          <div>Other content</div>
        </StyledEpochModalContent>
      );
      expect(getByText('Other content')).toBeInTheDocument();
    });

    it('handles mixed content', () => {
      const { container } = renderWithTheme(
        <StyledEpochModalContent>
          <div>Text content</div>
          <iframe title="mixed" src="about:blank" />
        </StyledEpochModalContent>
      );
      expect(container.firstChild.children).toHaveLength(2);
      expect(container.querySelector('iframe')).toBeInTheDocument();
    });

    it('handles empty content', () => {
      const { container } = renderWithTheme(<StyledEpochModalContent />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});