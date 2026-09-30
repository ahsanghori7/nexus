import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import {
  StyledContainer,
  StyledList,
  StyledListItem,
  StyledNotifications,
  StyledSeparator,
  StyledTokenSM,
  StyledTokenLG,
  StyledBuyTokenBanner,
  StyledTokensNumber,
  StyledNavProfileWrapper,
} from './styled';

// Create a basic theme for styled components testing
const mockTheme = {};

describe('Header Styled Components', () => {
  const renderWithTheme = (component) =>
    render(<ThemeProvider theme={mockTheme}>{component}</ThemeProvider>);

  describe('StyledContainer', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('applies flex display', () => {
      const { container } = renderWithTheme(<StyledContainer />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.display).toBe('flex');
      expect(styles.alignItems).toBe('center');
    });
  });

  describe('StyledList', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledList />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('applies list styling', () => {
      const { container } = renderWithTheme(<StyledList />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.listStyle).toBe('none');
      expect(styles.textAlign).toBe('right');
      expect(styles.color).toBe('white');
      expect(styles.margin).toBe('0px');
      expect(styles.padding).toBe('0px');
    });
  });

  describe('StyledListItem', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledListItem />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('applies item styling', () => {
      const { container } = renderWithTheme(<StyledListItem />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.fontSize).toBe('14px');
      expect(styles.textDecoration).toBe('none');
      expect(styles.color).toBe('rgb(255, 255, 255)');
      expect(styles.padding).toBe('0px');
      expect(styles.marginBottom).toBe('17px');
    });
  });

  describe('StyledNotifications', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledNotifications />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('applies notification styling', () => {
      const { container } = renderWithTheme(<StyledNotifications />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.height).toBe('100%');
      expect(styles.display).toBe('flex');
      expect(styles.alignItems).toBe('center');
    });
  });

  describe('StyledSeparator', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledSeparator />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('applies separator styling', () => {
      const { container } = renderWithTheme(<StyledSeparator />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.width).toBe('1px');
      expect(styles.marginTop).toBe('9px');
      expect(styles.marginBottom).toBe('5px');
    });
  });

  describe('StyledTokenSM', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledTokenSM />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('inherits from StyledToken', () => {
      const { container } = renderWithTheme(<StyledTokenSM />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.display).toBe('flex');
      expect(styles.justifyContent).toBe('space-between');
      expect(styles.alignItems).toBe('center');
      expect(styles.width).toBe('130px');
    });
  });

  describe('StyledTokenLG', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledTokenLG />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders with canClaimFreeTokens prop', () => {
      const { container } = renderWithTheme(<StyledTokenLG canClaimFreeTokens />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders with showInbox prop', () => {
      const { container } = renderWithTheme(<StyledTokenLG showInbox />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders without showInbox prop', () => {
      const { container } = renderWithTheme(<StyledTokenLG showInbox={false} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('StyledBuyTokenBanner', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledBuyTokenBanner />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('applies banner styling', () => {
      const { container } = renderWithTheme(<StyledBuyTokenBanner />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.color).toBe('rgb(255, 255, 255)');
      expect(styles.fontSize).toBe('12px');
      expect(styles.display).toBe('flex');
      expect(styles.justifyContent).toBe('center');
      expect(styles.alignItems).toBe('center');
      expect(styles.padding).toBe('10px');
      expect(styles.borderRadius).toBe('4px');
      expect(styles.position).toBe('relative');
      expect(styles.marginRight).toBe('16px');
    });
  });

  describe('StyledTokensNumber', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledTokensNumber />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('applies base styling', () => {
      const { container } = renderWithTheme(<StyledTokensNumber />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.fontSize).toBe('16px');
      expect(styles.fontWeight).toBe('600');
      expect(styles.position).toBe('relative');
      expect(styles.top).toBe('-25px');
    });

    test('applies Safari styling', () => {
      const { container } = renderWithTheme(<StyledTokensNumber isSafari />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.top).toBe('-31px');
    });

    test('applies iPad styling', () => {
      const { container } = renderWithTheme(<StyledTokensNumber isIpad />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.top).toBe('-32px');
    });

    test('applies label styling', () => {
      const { container } = renderWithTheme(<StyledTokensNumber isLabel />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.top).toBe('10px');
    });
  });

  describe('StyledNavProfileWrapper', () => {
    test('renders without crashing', () => {
      const { container } = renderWithTheme(<StyledNavProfileWrapper />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('applies wrapper styling', () => {
      const { container } = renderWithTheme(<StyledNavProfileWrapper />);
      const element = container.firstChild;
      
      const styles = window.getComputedStyle(element);
      expect(styles.display).toBe('flex');
    });
  });

  // Snapshot tests
  test('StyledContainer snapshot', () => {
    const { container } = renderWithTheme(<StyledContainer />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('StyledList snapshot', () => {
    const { container } = renderWithTheme(<StyledList />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('StyledListItem snapshot', () => {
    const { container } = renderWithTheme(<StyledListItem />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('StyledBuyTokenBanner snapshot', () => {
    const { container } = renderWithTheme(<StyledBuyTokenBanner />);
    expect(container.firstChild).toMatchSnapshot();
  });
});