import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { StyledFeed, StyledFeedElement } from './EmptyFeed.styled';

// Mock the clink-components constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        azureishWhite3: '#f8fafc',
        azureishWhite4: '#e1e8ed',
        lightBlue: '#5ba7d6'
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

describe('EmptyFeed Styled Components', () => {
  const mockTheme = {};

  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        {component}
      </ThemeProvider>
    );
  };

  describe('StyledFeed', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <StyledFeed>
          <div>Feed content</div>
        </StyledFeed>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      const { getByText } = renderWithTheme(
        <StyledFeed>
          <div>Empty feed message</div>
        </StyledFeed>
      );
      expect(getByText('Empty feed message')).toBeInTheDocument();
    });

    it('applies container styles', () => {
      const { container } = renderWithTheme(
        <StyledFeed>
          <div>Content</div>
        </StyledFeed>
      );
      const feedElement = container.firstChild;
      const computedStyle = window.getComputedStyle(feedElement);
      
      expect(computedStyle.maxHeight).toBe('617px');
      expect(computedStyle.minHeight).toBe('617px');
      expect(computedStyle.borderRadius).toBe('5px');
    });

    it('handles multiple children', () => {
      const { container } = renderWithTheme(
        <StyledFeed>
          <div>Child 1</div>
          <div>Child 2</div>
        </StyledFeed>
      );
      expect(container.firstChild.children).toHaveLength(2);
    });

    it('handles empty content', () => {
      const { container } = renderWithTheme(<StyledFeed />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('StyledFeedElement', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <StyledFeedElement>
          Feed element content
        </StyledFeedElement>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders text content correctly', () => {
      const { getByText } = renderWithTheme(
        <StyledFeedElement>
          Empty feed element text
        </StyledFeedElement>
      );
      expect(getByText('Empty feed element text')).toBeInTheDocument();
    });

    it('applies base text styles', () => {
      const { container } = renderWithTheme(
        <StyledFeedElement>
          Base element
        </StyledFeedElement>
      );
      const element = container.firstChild;
      const computedStyle = window.getComputedStyle(element);
      
      expect(computedStyle.textAlign).toBe('center');
      expect(computedStyle.fontSize).toBe('18px');
      expect(computedStyle.fontWeight).toBe('600');
    });

    it('applies small prop styles', () => {
      const { container } = renderWithTheme(
        <StyledFeedElement small>
          Small element
        </StyledFeedElement>
      );
      const element = container.firstChild;
      const computedStyle = window.getComputedStyle(element);
      
      expect(computedStyle.fontSize).toBe('15px');
      expect(computedStyle.fontWeight).toBe('400');
    });

    it('applies second prop styles', () => {
      const { container } = renderWithTheme(
        <StyledFeedElement second>
          <img src="test.jpg" alt="test" />
          Second element
        </StyledFeedElement>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies third prop styles', () => {
      const { container } = renderWithTheme(
        <StyledFeedElement third>
          Third element
        </StyledFeedElement>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies fourth prop styles', () => {
      const { container } = renderWithTheme(
        <StyledFeedElement fourth>
          <img src="test.jpg" alt="test" />
          Fourth element
        </StyledFeedElement>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies fifth prop styles', () => {
      const { container } = renderWithTheme(
        <StyledFeedElement fifth>
          <button>Fifth button</button>
          Fifth element
        </StyledFeedElement>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with strong text', () => {
      const { getByText } = renderWithTheme(
        <StyledFeedElement>
          Text with <strong>bold part</strong>
        </StyledFeedElement>
      );
      expect(getByText('bold part')).toBeInTheDocument();
    });

    it('handles complex content with button', () => {
      const { getByRole } = renderWithTheme(
        <StyledFeedElement fifth>
          <button>Action Button</button>
          <span>Additional text</span>
        </StyledFeedElement>
      );
      expect(getByRole('button')).toBeInTheDocument();
    });

    it('handles combination of props', () => {
      const { container } = renderWithTheme(
        <StyledFeedElement small second>
          Combined props element
        </StyledFeedElement>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles empty content', () => {
      const { container } = renderWithTheme(<StyledFeedElement />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});