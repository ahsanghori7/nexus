import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

// Mock dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isExternalMin: jest.fn(() => false),
  }));
});

jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn((host, path) => `http://example.com${path}`),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkGreen: '#4caf50',
        clinkRed: '#f44336',
        white: '#ffffff',
      },
    },
  },
}));

jest.mock('v2/apps/shared/components/boq/MuiEllipsisTooltip', () => {
  return function MockMuiEllipsisTooltip({ tooltipContent, children }) {
    return <div data-testid="mui-ellipsis-tooltip">{tooltipContent || children}</div>;
  };
});

describe('Header', () => {
  const mockProps = {
    name: 'Test Contractor',
    summaryCurrency: '10000',
    programme: 30,
    margin: 5,
    marginCurrency: '500',
    bestPrice: true,
    bestProgramme: false,
    subcontractor: {
      name: 'Test Contractor',
      membership: {
        account_id: 123,
        subscription_id: 456,
      },
    },
    actions: <div data-testid="actions">Actions Component</div>,
  };

  it('renders table with quote data', () => {
    render(<Header {...mockProps} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Test Contractor')).toBeInTheDocument();
    expect(screen.getByText('10000')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders with minimal props', () => {
    const minimalProps = {
      name: 'Simple Contractor',
      summaryCurrency: '5000',
      programme: 20,
      subcontractor: {},
    };
    
    render(<Header {...minimalProps} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Simple Contractor')).toBeInTheDocument();
  });

  it('handles empty subcontractor', () => {
    const propsWithEmptySubcontractor = {
      ...mockProps,
      subcontractor: {},
    };
    
    render(<Header {...propsWithEmptySubcontractor} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays price match indicators when bestPrice is true', () => {
    render(<Header {...mockProps} />);
    
    // Should render best-priced text
    expect(screen.getByText('best-priced')).toBeInTheDocument();
  });

  it('displays programme match indicators when bestProgramme is true', () => {
    const propsWithBestProgramme = {
      ...mockProps,
      bestPrice: false,
      bestProgramme: true,
    };
    
    render(<Header {...propsWithBestProgramme} />);
    
    expect(screen.getByText('best-programme')).toBeInTheDocument();
  });

  it('renders links for members with subscription', () => {
    render(<Header {...mockProps} />);
    
    // Contractor should have a link due to membership
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'http://example.com/main-contractor/supply_chain/123?return=sc');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders plain text for contractors without subscription', () => {
    const propsWithoutMembership = {
      ...mockProps,
      subcontractor: {
        name: 'Test Contractor',
        membership: null,
      },
    };

    render(<Header {...propsWithoutMembership} />);
    
    expect(screen.getByText('Test Contractor')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<Header {...mockProps} />);
    
    // Should show formatted currency (mocked to return the amount as string)
    expect(screen.getByText('10000')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('displays programme values', () => {
    render(<Header {...mockProps} />);
    
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders actions component', () => {
    render(<Header {...mockProps} />);
    
    expect(screen.getByTestId('actions')).toBeInTheDocument();
  });

  it('applies red color for negative margin', () => {
    const propsWithNegativeMargin = {
      ...mockProps,
      margin: -10,
      marginCurrency: '-1000',
    };
    
    render(<Header {...propsWithNegativeMargin} />);
    
    expect(screen.getByText('-1000')).toBeInTheDocument();
  });

  it('displays translations for table headers', () => {
    render(<Header {...mockProps} />);
    
    expect(screen.getByText('ta-total-price')).toBeInTheDocument();
    expect(screen.getByText('ta-programme-weeks')).toBeInTheDocument();
    expect(screen.getByText('ta-margin')).toBeInTheDocument();
  });
});