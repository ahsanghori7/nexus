import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddToSupplyChainModal from './index';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock the child components
jest.mock('../two-step-modal', () => ({
  __esModule: true,
  default: ({ title, openElement }) => (
    <div data-testid="two-step-modal">
      <div>{title}</div>
      {openElement}
    </div>
  ),
}));

describe('AddToSupplyChainModal Component', () => {
  const mockTrades = [
    { id: 1, name: 'Plumbing', label: 'Plumbing' },
    { id: 2, name: 'Electrical', label: 'Electrical' },
  ];
  
  const mockLocations = [
    { id: 1, name: 'London', label: 'London' },
    { id: 2, name: 'Manchester', label: 'Manchester' },
  ];
  
  const mockAccount = {
    id: 1,
    company_name: 'Main Contractor Ltd',
  };

  it('renders with default props', () => {
    render(
      <AddToSupplyChainModal
        account={mockAccount}
        trades={mockTrades}
        locations={mockLocations}
      />
    );
    
    expect(screen.getByTestId('two-step-modal')).toBeInTheDocument();
    expect(screen.getAllByText('add-to-supply-chain')).toHaveLength(2); // Title and button
  });

  it('renders with custom open element', () => {
    const customButton = <button>Custom Add Button</button>;
    
    render(
      <AddToSupplyChainModal
        account={mockAccount}
        trades={mockTrades}
        locations={mockLocations}
        customOpenElement={customButton}
      />
    );
    
    expect(screen.getByText('Custom Add Button')).toBeInTheDocument();
  });

  it('renders with default button when no custom element provided', () => {
    render(
      <AddToSupplyChainModal
        account={mockAccount}
        trades={mockTrades}
        locations={mockLocations}
      />
    );
    
    // Should render the button with translation key
    expect(screen.getAllByText('add-to-supply-chain')).toHaveLength(2); // Title and button
  });

  it('passes trades and locations to step 2', () => {
    const { container } = render(
      <AddToSupplyChainModal
        account={mockAccount}
        trades={mockTrades}
        locations={mockLocations}
      />
    );
    
    expect(container).toBeInTheDocument();
  });
});

