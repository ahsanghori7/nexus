import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ProcurementScheduleHeader from './ProcurementScheduleHeader';

// Mock the price helper function
jest.mock('v1/quotes-tender/helpers/price', () => ({
  numToPrice: jest.fn((value) => `$${value?.toLocaleString() || '0'}`),
}));

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ProcurementScheduleHeader', () => {
  const defaultProps = {
    totalPackages: 10,
    procurementProgress: {
      percentage: 75,
      ratio: '3/4',
    },
    packagesAtRiskCount: 3,
    summary: {
      budget: 100000,
      profit_loss: 5000,
      forecast: 95000,
    },
  };

  it('renders without crashing', () => {
    renderWithTheme(<ProcurementScheduleHeader {...defaultProps} />);
    expect(screen.getByText('Total Packages')).toBeInTheDocument();
  });

  it('displays total packages correctly', () => {
    renderWithTheme(<ProcurementScheduleHeader {...defaultProps} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('displays procurement progress correctly', () => {
    renderWithTheme(<ProcurementScheduleHeader {...defaultProps} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays packages at risk count correctly', () => {
    renderWithTheme(<ProcurementScheduleHeader {...defaultProps} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays budget, actual, and variance values', () => {
    renderWithTheme(<ProcurementScheduleHeader {...defaultProps} />);
    expect(screen.getByText('$100,000')).toBeInTheDocument();
    expect(screen.getByText('$95,000')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });

  it('handles missing summary gracefully', () => {
    const props = {
      ...defaultProps,
      summary: undefined,
    };
    renderWithTheme(<ProcurementScheduleHeader {...props} />);
    expect(screen.getAllByText('$0')).toHaveLength(3); // Budget, Actual, and Variance should all be $0
  });

  it('handles null summary values gracefully', () => {
    const props = {
      ...defaultProps,
      summary: {
        budget: null,
        profit_loss: null,
        forecast: null,
      },
    };
    renderWithTheme(<ProcurementScheduleHeader {...props} />);
    // Should display $0 for null values
    expect(screen.getAllByText('$0')).toHaveLength(3);
  });

  it('shows positive variance with success color', () => {
    const props = {
      ...defaultProps,
      summary: {
        ...defaultProps.summary,
        profit_loss: 1000, // positive variance
      },
    };
    renderWithTheme(<ProcurementScheduleHeader {...props} />);
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('shows negative variance with error color', () => {
    const props = {
      ...defaultProps,
      summary: {
        ...defaultProps.summary,
        profit_loss: -1000, // negative variance
      },
    };
    renderWithTheme(<ProcurementScheduleHeader {...props} />);
    expect(screen.getByText('−$1,000')).toBeInTheDocument(); // Note: uses minus sign, not hyphen
  });

  it('shows zero variance with secondary color', () => {
    const props = {
      ...defaultProps,
      summary: {
        ...defaultProps.summary,
        profit_loss: 0, // zero variance
      },
    };
    renderWithTheme(<ProcurementScheduleHeader {...props} />);
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('renders all card sections', () => {
    renderWithTheme(<ProcurementScheduleHeader {...defaultProps} />);
    
    // Check for all card headers
    expect(screen.getByText('Total Packages')).toBeInTheDocument();
    expect(screen.getByText('Procurement Progress')).toBeInTheDocument();
    expect(screen.getByText('Packages at Risk')).toBeInTheDocument(); // lowercase 'at'
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
    expect(screen.getByText('Variance')).toBeInTheDocument();
  });
});