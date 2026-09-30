import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TenderBoqDescription from './TenderBoqDescription';

// Mock the dependencies
jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: (key) => {
      const translations = {
        'package': 'Package',
        'total-budget': 'Total Budget'
      };
      return translations[key] || key;
    }
  }
}));

jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: (amount) => `$${amount?.toLocaleString() || '0'}`,
  currencyConfig: {
    currency: 'USD',
    symbol: '$'
  }
}));

describe('TenderBoqDescription', () => {
  it('renders with totalBudget and packageLabel', () => {
    render(
      <TenderBoqDescription 
        totalBudget={50000} 
        packageLabel="Construction Package" 
      />
    );
    
    // Check that the component renders without crashing and shows expected content
    const boxes = screen.getAllByTestId('mui-box');
    expect(boxes.length).toBeGreaterThan(0);
    expect(screen.getByText('Construction Package')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });

  it('renders with default packageLabel', () => {
    render(<TenderBoqDescription totalBudget={25000} />);
    
    const boxes = screen.getAllByTestId('mui-box');
    expect(boxes.length).toBeGreaterThan(0);
    expect(screen.getByText('$25,000')).toBeInTheDocument();
  });

  it('renders with zero budget', () => {
    render(
      <TenderBoqDescription 
        totalBudget={0} 
        packageLabel="Empty Package" 
      />
    );
    
    const boxes = screen.getAllByTestId('mui-box');
    expect(boxes.length).toBeGreaterThan(0);
    expect(screen.getByText('Empty Package')).toBeInTheDocument();
    // Zero budget should not render the budget section due to Boolean(totalBudget) check
    expect(screen.queryByText('Total Budget:')).not.toBeInTheDocument();
  });

  it('renders with undefined totalBudget', () => {
    render(
      <TenderBoqDescription 
        totalBudget={undefined} 
        packageLabel="Undefined Budget Package" 
      />
    );
    
    const boxes = screen.getAllByTestId('mui-box');
    expect(boxes.length).toBeGreaterThan(0);
    expect(screen.getByText('Undefined Budget Package')).toBeInTheDocument();
  });
});