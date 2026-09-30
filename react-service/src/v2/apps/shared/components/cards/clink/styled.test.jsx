import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import '@testing-library/jest-dom';
import { StyledWrapperWithImage } from './styled';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkPurple: '#6d28d9'
      }
    }
  }
}));

// Basic theme for styled-components
const theme = {};

describe('Cards Clink Styled Components', () => {
  describe('StyledWrapperWithImage', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledWrapperWithImage>Test content</StyledWrapperWithImage>
        </ThemeProvider>
      );
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveTextContent('Test content');
    });

    it('has correct base styles', () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledWrapperWithImage />
        </ThemeProvider>
      );
      const element = container.firstChild;
      expect(element).toHaveStyle('position: relative');
    });

    it('renders with image source and not dropdown', () => {
      const imageSrc = 'test-image.png';
      const imageSrcHover = 'test-image-hover.png';
      
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledWrapperWithImage 
            imageSrc={imageSrc} 
            imageSrcHover={imageSrcHover}
            dropdown={false}
          >
            Test content
          </StyledWrapperWithImage>
        </ThemeProvider>
      );
      
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveTextContent('Test content');
    });

    it('renders with dropdown prop', () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledWrapperWithImage dropdown={true}>
            Test content
          </StyledWrapperWithImage>
        </ThemeProvider>
      );
      
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveTextContent('Test content');
    });

    it('renders without imageSrc', () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledWrapperWithImage dropdown={false}>
            Test content
          </StyledWrapperWithImage>
        </ThemeProvider>
      );
      
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveTextContent('Test content');
    });

    it('handles all prop combinations correctly', () => {
      // Test with imageSrc and dropdown false
      const { rerender, container } = render(
        <ThemeProvider theme={theme}>
          <StyledWrapperWithImage imageSrc="test.png" dropdown={false}>
            Content 1
          </StyledWrapperWithImage>
        </ThemeProvider>
      );
      expect(container.firstChild).toHaveTextContent('Content 1');

      // Test with imageSrc and dropdown true
      rerender(
        <ThemeProvider theme={theme}>
          <StyledWrapperWithImage imageSrc="test.png" dropdown={true}>
            Content 2
          </StyledWrapperWithImage>
        </ThemeProvider>
      );
      expect(container.firstChild).toHaveTextContent('Content 2');

      // Test without imageSrc
      rerender(
        <ThemeProvider theme={theme}>
          <StyledWrapperWithImage dropdown={false}>
            Content 3
          </StyledWrapperWithImage>
        </ThemeProvider>
      );
      expect(container.firstChild).toHaveTextContent('Content 3');
    });

    it('accepts children correctly', () => {
      const testChildren = (
        <div>
          <span>Child 1</span>
          <span>Child 2</span>
        </div>
      );

      const { container } = render(
        <ThemeProvider theme={theme}>
          <StyledWrapperWithImage>
            {testChildren}
          </StyledWrapperWithImage>
        </ThemeProvider>
      );
      
      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelector('span')).toHaveTextContent('Child 1');
    });
  });
});