import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import '@testing-library/jest-dom';
import { ImageContent, Content, DeleteContent } from './styled';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    dimensions: {
      SM_SCREEN: 768
    }
  }
}));

// Basic theme for styled-components
const theme = {};

describe('Cards Small Styled Components', () => {
  it('renders ImageContent without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <ImageContent>Test content</ImageContent>
      </ThemeProvider>
    );
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveTextContent('Test content');
  });

  it('renders Content without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Content>Test content</Content>
      </ThemeProvider>
    );
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveTextContent('Test content');
  });

  it('renders DeleteContent without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <DeleteContent>Test content</DeleteContent>
      </ThemeProvider>
    );
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveTextContent('Test content');
  });

  it('ImageContent has correct display style', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <ImageContent />
      </ThemeProvider>
    );
    const element = container.firstChild;
    expect(element).toHaveStyle('display: inline-flex');
    expect(element).toHaveStyle('flex: 3');
  });

  it('Content has correct flexbox styles', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Content />
      </ThemeProvider>
    );
    const element = container.firstChild;
    expect(element).toHaveStyle('display: inline-flex');
    expect(element).toHaveStyle('flex-direction: column');
    expect(element).toHaveStyle('flex: 4');
  });

  it('DeleteContent has correct alignment styles', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <DeleteContent />
      </ThemeProvider>
    );
    const element = container.firstChild;
    expect(element).toHaveStyle('display: inline-flex');
    expect(element).toHaveStyle('justify-content: center');
    expect(element).toHaveStyle('align-items: center');
    expect(element).toHaveStyle('flex: 2');
  });
});