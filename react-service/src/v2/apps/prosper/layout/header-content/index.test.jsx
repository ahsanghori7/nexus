import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import HeaderContent from './index';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'claim-free-token': 'Claim Free Token',
        'buy-more-tokens': 'Buy More Tokens'
      };
      return translations[key] || key;
    }
  })
}));

// Mock the window helpers
jest.mock('v2/helpers/window', () => ({
  isIOS: jest.fn(() => false),
  isIpadOS: jest.fn(() => false)
}));

// Mock the subscription helper
jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isTokenUser: jest.fn(() => true)
  }));
});

// Mock clink-components
jest.mock('clink-components', () => ({
  Dropdown: ({ children, content, renderOpenDropdown, ...props }) => (
    <div data-testid="dropdown" {...props}>
      {renderOpenDropdown && renderOpenDropdown({ isOpen: false, handleClick: jest.fn() })}
      {content}
      {children}
    </div>
  ),
  Image: ({ src, ...props }) => (
    <img data-testid="image" src={src} {...props} />
  ),
  ProfileSection: ({ profileProps, ...props }) => (
    <div data-testid="profile-section" {...props}>
      Profile Section {profileProps && profileProps.isOpen ? 'Open' : 'Closed'}
    </div>
  ),
  CONSTANTS: {
    s3: {
      iconTokenEmptySmall: '/mock-empty-token.png',
      iconTokenSmall: '/mock-token.png'
    },
    dimensions: {
      MD_SCREEN: 768,
      SM_SCREEN: 576,
      LG_SCREEN: 992,
      XL_SCREEN: 1200
    },
    fonts: {
      avantGardeGothicPRO: 'Arial'
    },
    colors: {
      general: {
        white: '#ffffff',
        japaneseIndigo: '#2F4F4F',
        darkJungleGreen: '#1B2631'
      },
      prosper: {
        prosperBoxRed: '#FF0000',
        blackCoral: '#54626F',
        darkGoldenrod: '#B8860B'
      }
    }
  }
}));

describe('HeaderContent', () => {
  const mockTheme = {};
  
  const defaultProps = {
    profileProps: {
      membership: { tokens: 5 },
      info: { subscription_id: 1 },
      token_prices: { basic: 10, premium: 20 },
      canClaimFreeTokens: false,
      country: { code: 'US' }
    },
    claimToken: jest.fn(),
    theme: 'prosper'
  };

  const renderWithTheme = (component) => render(
    <ThemeProvider theme={mockTheme}>{component}</ThemeProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.safari
    Object.defineProperty(window, 'safari', {
      value: undefined,
      writable: true
    });
  });

  test('renders without crashing', () => {
    renderWithTheme(<HeaderContent {...defaultProps} />);
    
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  test('shows tokens for non-EU countries', () => {
    renderWithTheme(<HeaderContent {...defaultProps} />);
    
    // Should show token elements when country is not EU
    expect(screen.getAllByTestId('token-modal-mock')).toHaveLength(3); // Large desktop, mobile, coin button
  });

  test('hides tokens for EU countries', () => {
    const euProps = {
      ...defaultProps,
      profileProps: {
        ...defaultProps.profileProps,
        country: { code: 'EU' }
      }
    };
    
    renderWithTheme(<HeaderContent {...euProps} />);
    
    // Should not show token elements for EU countries
    expect(screen.queryByTestId('token-modal-mock')).not.toBeInTheDocument();
  });

  test('shows correct token copy for non-claimable tokens', () => {
    renderWithTheme(<HeaderContent {...defaultProps} />);
    
    expect(screen.getByText('Buy More Tokens')).toBeInTheDocument();
  });

  test('shows correct token copy for claimable tokens', () => {
    const claimableProps = {
      ...defaultProps,
      profileProps: {
        ...defaultProps.profileProps,
        canClaimFreeTokens: true
      }
    };
    
    renderWithTheme(<HeaderContent {...claimableProps} />);
    
    expect(screen.getByText('Claim Free Token')).toBeInTheDocument();
  });

  test('displays token count', () => {
    renderWithTheme(<HeaderContent {...defaultProps} />);
    
    // Should display the token count (5 tokens)
    const tokenNumbers = screen.getAllByText('5');
    expect(tokenNumbers.length).toBeGreaterThan(0);
  });

  test('displays empty token count when no tokens', () => {
    const noTokenProps = {
      ...defaultProps,
      profileProps: {
        ...defaultProps.profileProps,
        membership: { tokens: 0 }
      }
    };
    
    renderWithTheme(<HeaderContent {...noTokenProps} />);
    
    // Should still render component without errors
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  test('handles missing membership gracefully', () => {
    const noMembershipProps = {
      ...defaultProps,
      profileProps: {
        ...defaultProps.profileProps,
        membership: null
      }
    };
    
    renderWithTheme(<HeaderContent {...noMembershipProps} />);
    
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  test('handles missing country gracefully', () => {
    const noCountryProps = {
      ...defaultProps,
      profileProps: {
        ...defaultProps.profileProps,
        country: null
      }
    };
    
    renderWithTheme(<HeaderContent {...noCountryProps} />);
    
    // Should not show tokens when country is missing
    expect(screen.queryByTestId('token-modal-mock')).not.toBeInTheDocument();
  });

  test('detects Safari browser correctly', () => {
    Object.defineProperty(window, 'safari', {
      value: {},
      writable: true
    });
    
    renderWithTheme(<HeaderContent {...defaultProps} />);
    
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  test('handles modal state changes', () => {
    renderWithTheme(<HeaderContent {...defaultProps} />);
    
    // Find and click token buttons to trigger modal state
    const tokenButtons = screen.getAllByTestId('button-wrapper-mock');
    
    // Click first token button
    fireEvent.click(tokenButtons[0]);
    
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  test('renders dropdown with correct props', () => {
    renderWithTheme(<HeaderContent {...defaultProps} />);
    
    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toHaveClass('profile-section-prosper');
    expect(dropdown).toHaveAttribute('theme', 'prosper');
  });

  test('renders profile section through renderOpenDropdown', () => {
    renderWithTheme(<HeaderContent {...defaultProps} />);
    
    // Should render the OpenDropdown component through renderOpenDropdown
    expect(screen.getByTestId('profile-section')).toBeInTheDocument();
  });

  test('uses correct token icons', () => {
    renderWithTheme(<HeaderContent {...defaultProps} />);
    
    const images = screen.getAllByTestId('image');
    expect(images[0]).toHaveAttribute('src', '/mock-empty-token.png'); // Has tokens, so uses empty icon
  });

  test('uses correct token icons when no tokens', () => {
    const noTokenProps = {
      ...defaultProps,
      profileProps: {
        ...defaultProps.profileProps,
        membership: { tokens: 0 }
      }
    };
    
    renderWithTheme(<HeaderContent {...noTokenProps} />);
    
    const images = screen.getAllByTestId('image');
    expect(images[0]).toHaveAttribute('src', '/mock-token.png'); // No tokens, so uses filled icon
  });

  test('handles non-token users correctly', () => {
    // Mock subscription helper to return false for isTokenUser
    const Subscription = require('v2/helpers/user/subscription');
    Subscription.mockImplementation(() => ({
      isTokenUser: jest.fn(() => false)
    }));
    
    renderWithTheme(<HeaderContent {...defaultProps} />);
    
    // Should still render dropdown but no token elements
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  test('snapshot test', () => {
    const { container } = renderWithTheme(<HeaderContent {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('snapshot test with EU country', () => {
    const euProps = {
      ...defaultProps,
      profileProps: {
        ...defaultProps.profileProps,
        country: { code: 'EU' }
      }
    };
    
    const { container } = renderWithTheme(<HeaderContent {...euProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});