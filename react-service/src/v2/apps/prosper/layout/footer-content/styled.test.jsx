import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { StyledContainer, StyledContainerItem } from './styled';

// Create a basic theme for styled components testing
const mockTheme = {};

describe('Footer Styled Components', () => {
  const renderWithTheme = (component) =>
    render(<ThemeProvider theme={mockTheme}>{component}</ThemeProvider>);

  describe('StyledContainer', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders with children', () => {
      const { container } = renderWithTheme(
        <StyledContainer>
          <div>Test content</div>
        </StyledContainer>
      );
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveTextContent('Test content');
    });

    test('applies correct styles', () => {
      const { container } = renderWithTheme(<StyledContainer />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.display).toBe('flex');
      expect(styles.width).toBe('100%');
      expect(styles.alignItems).toBe('center');
      expect(styles.justifyContent).toBe('center');
      expect(styles.flexWrap).toBe('wrap');
    });
  });

  describe('StyledContainerItem', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledContainerItem />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders with children', () => {
      const { container } = renderWithTheme(
        <StyledContainerItem>Item content</StyledContainerItem>
      );
      expect(container.firstChild).toHaveTextContent('Item content');
    });

    test('applies basic styles', () => {
      const { container } = renderWithTheme(<StyledContainerItem />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.flex).toBe('1 0 100%');
      expect(styles.textAlign).toBe('center');
      expect(styles.fontSize).toBe('10px');
      expect(styles.fontWeight).toBe('700px');
      expect(styles.marginBottom).toBe('4px');
      expect(styles.opacity).toBe('1');
    });

    test('applies main prop styles', () => {
      const { container } = renderWithTheme(<StyledContainerItem main />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.fontSize).toBe('14px');
      expect(styles.fontWeight).toBe('400px');
    });

    test('renders as main item with correct styling', () => {
      const { container } = renderWithTheme(
        <StyledContainerItem main>Main Item</StyledContainerItem>
      );
      const element = container.firstChild;
      
      expect(element).toHaveTextContent('Main Item');
      const styles = window.getComputedStyle(element);
      expect(styles.fontSize).toBe('14px');
    });

    test('renders as regular item without main prop', () => {
      const { container } = renderWithTheme(
        <StyledContainerItem>Regular Item</StyledContainerItem>
      );
      const element = container.firstChild;
      
      expect(element).toHaveTextContent('Regular Item');
      const styles = window.getComputedStyle(element);
      expect(styles.fontSize).toBe('10px');
    });
  });
});