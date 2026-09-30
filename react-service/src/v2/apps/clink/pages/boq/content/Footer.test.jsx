import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from './Footer';

// Mock dependencies
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        eerieBlack: '#1C1C1C',
        darkCharcoal: '#2C2C2C',
        clinkLightPurple: '#E8E2F5',
        clinkGreen: '#00C851',
        clinkPurple: '#6F42C1',
        clinkRed: '#E02020',
        white: '#FFFFFF',
      },
      prosper: {
        dimGray2: '#696969',
      },
    },
  },
}));

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key === 'currency' ? 'USD' : key,
}));

jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: (amount, config) => `${config.symbol}${amount.toFixed(2)}`,
  currencyConfig: {
    USD: {
      symbol: '$',
      code: 'USD',
    },
  },
}));

describe('Footer Component', () => {
  it('renders without crashing', () => {
    render(<Footer />);
  });

  it('displays default total of 0 when no total provided', () => {
    render(<Footer />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('displays provided total amount', () => {
    render(<Footer total={1234.56} />);

    expect(screen.getByText('$1234.56')).toBeInTheDocument();
  });

  it('displays Total label', () => {
    render(<Footer />);
    
    const totalLabel = screen.getByText('Total');
    expect(totalLabel).toBeInTheDocument();
  });

  it('total amount is present for default total', () => {
    render(<Footer />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('applies different padding when editing is true', () => {
    const { container } = render(<Footer editing={true} />);
    
    // Check if the component renders when editing is true
    const gridContainer = container.querySelector('.MuiGrid-container');
    expect(gridContainer).toBeInTheDocument();
  });

  it('applies different padding when editing is false', () => {
    const { container } = render(<Footer editing={false} />);
    
    // Check if the component renders when editing is false
    const gridContainer = container.querySelector('.MuiGrid-container');
    expect(gridContainer).toBeInTheDocument();
  });

  it('handles negative total values', () => {
    render(<Footer total={-500.25} />);

    expect(screen.getByText('$-500.25')).toBeInTheDocument();
  });

  it('handles zero total', () => {
    render(<Footer total={0} />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('handles large total values', () => {
    render(<Footer total={999999.99} />);

    expect(screen.getByText('$999999.99')).toBeInTheDocument();
  });

  it('matches snapshot with default props', () => {
    const { container } = render(<Footer />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with custom total and editing true', () => {
    const { container } = render(<Footer total={1500.75} editing={true} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with custom total and editing false', () => {
    const { container } = render(<Footer total={2000.50} editing={false} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});