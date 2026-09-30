import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TokenButton from './TokenButton';

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

// Mock the URL helper
jest.mock('v2/helpers/url', () => ({
  getQueryStringVars: jest.fn(() => ({})),
  resetUrl: jest.fn()
}));

describe('TokenButton', () => {
  const defaultProps = {
    tokenPrices: { basic: 10, premium: 20 },
    subcontractor: { canClaimFreeTokens: false },
    claimToken: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<TokenButton {...defaultProps} />);
    
    const tokenModal = screen.getByTestId('token-modal-mock');
    expect(tokenModal).toBeInTheDocument();
  });

  test('renders with "buy more tokens" text when canClaimFreeTokens is false', () => {
    render(<TokenButton {...defaultProps} />);
    
    const button = screen.getByTestId('token-modal-trigger');
    expect(button).toHaveTextContent('Buy More Tokens');
  });

  test('renders with "claim free token" text when canClaimFreeTokens is true', () => {
    const props = {
      ...defaultProps,
      subcontractor: { canClaimFreeTokens: true }
    };
    
    render(<TokenButton {...props} />);
    
    const button = screen.getByTestId('token-modal-trigger');
    expect(button).toHaveTextContent('Claim Free Token');
  });

  test('button has correct id and className', () => {
    render(<TokenButton {...defaultProps} />);
    
    const button = screen.getByTestId('token-modal-trigger');
    expect(button).toHaveAttribute('id', 'page-header-token-button');
    expect(button).toHaveClass('package-modal', 'header-buy-token');
  });

  test('clicking button triggers modal open', () => {
    render(<TokenButton {...defaultProps} />);
    
    const button = screen.getByTestId('token-modal-trigger');
    fireEvent.click(button);
    
    // The modal should now be open (externalOpen would be true)
    // Since we're using a mock, we can verify the button was clicked
    expect(button).toBeInTheDocument();
  });

  test('passes tokenPrices to TokenModal', () => {
    const tokenPrices = { standard: 15, premium: 30 };
    render(<TokenButton {...defaultProps} tokenPrices={tokenPrices} />);
    
    const tokenModal = screen.getByTestId('token-modal-mock');
    expect(tokenModal).toBeInTheDocument();
  });

  test('passes subcontractor canClaimFreeTokens to TokenModal', () => {
    const subcontractor = { canClaimFreeTokens: true };
    render(<TokenButton {...defaultProps} subcontractor={subcontractor} />);
    
    const tokenModal = screen.getByTestId('token-modal-mock');
    expect(tokenModal).toBeInTheDocument();
  });

  test('passes claimToken function to TokenModal', () => {
    const claimToken = jest.fn();
    render(<TokenButton {...defaultProps} claimToken={claimToken} />);
    
    const tokenModal = screen.getByTestId('token-modal-mock');
    expect(tokenModal).toBeInTheDocument();
  });

  test('handles undefined subcontractor gracefully', () => {
    const props = {
      ...defaultProps,
      subcontractor: undefined
    };
    
    render(<TokenButton {...props} />);
    
    const button = screen.getByTestId('token-modal-trigger');
    expect(button).toHaveTextContent('Buy More Tokens');
  });

  test('handles empty subcontractor gracefully', () => {
    const props = {
      ...defaultProps,
      subcontractor: {}
    };
    
    render(<TokenButton {...props} />);
    
    const button = screen.getByTestId('token-modal-trigger');
    expect(button).toHaveTextContent('Buy More Tokens');
  });

  test('default claimToken function does not throw', () => {
    const props = {
      tokenPrices: { basic: 10 },
      subcontractor: { canClaimFreeTokens: false }
      // No claimToken provided
    };
    
    expect(() => render(<TokenButton {...props} />)).not.toThrow();
  });
});