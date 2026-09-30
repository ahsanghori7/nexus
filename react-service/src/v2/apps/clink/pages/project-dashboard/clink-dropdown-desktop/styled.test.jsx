import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import {
  StyledDropdownContent,
  StyledDropdownInterfaceDesktop,
} from './styled';

// Mock theme for styled-components
const mockTheme = {};

describe('StyledDropdownContent', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledDropdownContent>
          <button>Test Button</button>
        </StyledDropdownContent>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies correct display and flex properties', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledDropdownContent data-testid="dropdown-content">
          <button>Test Button</button>
        </StyledDropdownContent>
      </ThemeProvider>
    );
    
    const element = container.firstChild;
    const computedStyle = window.getComputedStyle(element);
    
    expect(computedStyle.display).toBe('flex');
    expect(computedStyle.flexDirection).toBe('column');
    expect(computedStyle.position).toBe('relative');
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledDropdownContent>
          <button>Test Button 1</button>
          <button>Test Button 2</button>
        </StyledDropdownContent>
      </ThemeProvider>
    );
    
    expect(getByText('Test Button 1')).toBeInTheDocument();
    expect(getByText('Test Button 2')).toBeInTheDocument();
  });
});

describe('StyledDropdownInterfaceDesktop', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledDropdownInterfaceDesktop>
          Test Content
        </StyledDropdownInterfaceDesktop>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with imageSrc prop', () => {
    const testImageSrc = '/test-image.png';
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledDropdownInterfaceDesktop imageSrc={testImageSrc}>
          Test Content
        </StyledDropdownInterfaceDesktop>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with imageSrcHover prop', () => {
    const testImageSrcHover = '/test-image-hover.png';
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledDropdownInterfaceDesktop imageSrcHover={testImageSrcHover}>
          Test Content
        </StyledDropdownInterfaceDesktop>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with both image props', () => {
    const testImageSrc = '/test-image.png';
    const testImageSrcHover = '/test-image-hover.png';
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledDropdownInterfaceDesktop
          imageSrc={testImageSrc}
          imageSrcHover={testImageSrcHover}
        >
          Test Content
        </StyledDropdownInterfaceDesktop>
      </ThemeProvider>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies correct positioning and padding styles', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledDropdownInterfaceDesktop>
          Test Content
        </StyledDropdownInterfaceDesktop>
      </ThemeProvider>
    );
    
    const element = container.firstChild;
    const computedStyle = window.getComputedStyle(element);
    
    expect(computedStyle.position).toBe('relative');
    expect(computedStyle.textAlign).toBe('left');
  });

  it('renders children content correctly', () => {
    const testContent = 'Dropdown Interface Content';
    const { getByText } = render(
      <ThemeProvider theme={mockTheme}>
        <StyledDropdownInterfaceDesktop>
          {testContent}
        </StyledDropdownInterfaceDesktop>
      </ThemeProvider>
    );
    
    expect(getByText(testContent)).toBeInTheDocument();
  });
});