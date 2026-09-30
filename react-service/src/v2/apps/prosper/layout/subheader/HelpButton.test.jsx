import React from 'react';
import { render, screen } from '@testing-library/react';
import HelpButton from './HelpButton';

describe('HelpButton', () => {
  test('renders without crashing', () => {
    render(<HelpButton />);
    
    const helpButton = screen.getByTestId('need-help-mock');
    expect(helpButton).toBeInTheDocument();
  });

  test('passes tokenPrices prop to NeedHelp component', () => {
    const mockTokenPrices = { price1: 100, price2: 200 };
    
    render(<HelpButton tokenPrices={mockTokenPrices} />);
    
    const helpButton = screen.getByTestId('need-help-mock');
    expect(helpButton).toBeInTheDocument();
  });

  test('passes title prop to NeedHelp component', () => {
    render(<HelpButton />);
    
    const helpButton = screen.getByTestId('need-help-mock');
    expect(helpButton).toHaveAttribute('title', 'buy-more-tokens-title');
  });

  test('renders with custom tokenPrices', () => {
    const customTokenPrices = { basic: 50, premium: 150 };
    
    render(<HelpButton tokenPrices={customTokenPrices} />);
    
    const helpButton = screen.getByTestId('need-help-mock');
    expect(helpButton).toBeInTheDocument();
    expect(helpButton).toHaveAttribute('title', 'buy-more-tokens-title');
  });
});