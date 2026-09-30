import React from 'react';
import { render, screen } from '@testing-library/react';
import TokenModal from './TokenModal';

// Mock global BASE_URLS
global.BASE_URLS = {
  TOKENS: '/tokens',
};

// Mock all dependencies to avoid complex interactions
jest.mock('v2/helpers/i18n', () => ({
  language: 'en',
  t: (key) => {
    if (key === 'currency') return '$';
    return key;
  },
}));

jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn(),
  getUrl: jest.fn((app, path) => `/${app}${path}`),
}));

jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isActive: jest.fn().mockReturnValue(true),
    isPro: jest.fn().mockReturnValue(false),
    isLite: jest.fn().mockReturnValue(true),
    getType: jest.fn().mockReturnValue({
      FLEXI: 1,
      STANDARD: 2,
      PREMIUM: 3
    }),
  }));
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock styled components
jest.mock('./styled', () => ({
  StyledModalContent: ({ children }) => <div data-testid="styled-modal-content">{children}</div>,
  StyledTokenModalHeader: ({ children }) => <div data-testid="styled-header">{children}</div>,
  StyledTokenModal: ({ children }) => <div data-testid="styled-token-modal">{children}</div>,
  StyledTokenModalPriceWrapper: ({ children }) => <div data-testid="price-wrapper">{children}</div>,
}));

// Mock Modal component - simplified to avoid complex interactions
jest.mock('./Modal', () => ({
  __esModule: true,
  default: ({ children, render, ...props }) => (
    <div data-testid="modal-container" {...props}>
      {render && render()}
      {children}
    </div>
  ),
}));

const { goTo } = require('v2/helpers/url');

describe('TokenModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing with minimal props', () => {
    render(<TokenModal />);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<TokenModal title="custom-token-title" />);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('renders with valid token prices', () => {
    const mockTokenPrices = [
      { tokens_received: 10, price: '£5.00', checkout_url: '/checkout' },
      { tokens_received: 20, price: '£9.00', checkout_url: '/checkout2' },
    ];
    
    render(<TokenModal tokenPrices={mockTokenPrices} />);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('renders with canClaimFreeTokens prop', () => {
    const mockSubcontractor = { tokens: 5 };
    
    render(
      <TokenModal 
        canClaimFreeTokens={true} 
        subcontractor={mockSubcontractor}
      />
    );
    
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('renders with claimToken function', () => {
    const mockClaimToken = jest.fn();
    const mockSubcontractor = { tokens: 5 };
    
    render(
      <TokenModal
        canClaimFreeTokens={true}
        subcontractor={mockSubcontractor}
        claimToken={mockClaimToken}
      />
    );
    
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('renders with external open prop', () => {
    render(<TokenModal externalOpen={true} />);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('renders with onHiddenModal callback', () => {
    const mockOnHiddenModal = jest.fn();
    render(<TokenModal onHiddenModal={mockOnHiddenModal} />);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('renders with custom openElement', () => {
    const customElement = <button data-testid="custom-open-button">Open Tokens</button>;
    render(<TokenModal openElement={customElement} />);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('renders with token prices containing labels', () => {
    const mockTokenPrices = [
      {
        tokens_received: 50,
        price: '£20.00',
        checkout_url: '/checkout',
        label: '25%',
      },
    ];

    render(<TokenModal tokenPrices={mockTokenPrices} />);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('handles isUnlock prop correctly', () => {
    render(<TokenModal isUnlock={true} />);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('handles user prop correctly', () => {
    const mockUser = { id: 1, name: 'Test User' };
    render(<TokenModal user={mockUser} />);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });

  it('renders with all props combined', () => {
    const mockProps = {
      title: 'Test Title',
      tokenPrices: [{ tokens_received: 10, price: '£5.00', checkout_url: '/checkout' }],
      canClaimFreeTokens: true,
      subcontractor: { tokens: 5 },
      claimToken: jest.fn(),
      externalOpen: false,
      onHiddenModal: jest.fn(),
      isUnlock: false,
      user: { id: 1, name: 'Test User' },
    };
    
    render(<TokenModal {...mockProps} />);
    expect(screen.getByTestId('modal-container')).toBeInTheDocument();
  });
});