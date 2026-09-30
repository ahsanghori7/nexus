import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MuiComparisonTable from './MuiComparisonTable';

// Mock the dependencies
jest.mock('v2/apps/shared/components/boq/Table', () => {
  return function MockTable({ Columns, items, Body, actions, sx }) {
    return (
      <div data-testid="mock-table">
        Mock Table - Actions: {actions ? 'true' : 'false'}
      </div>
    );
  };
});

jest.mock('./actions', () => {
  return function MockActions({ quoteInfo, orderTemplates, pid, awarded, entity }) {
    return (
      <div data-testid="mock-actions">
        Mock Actions - PID: {pid}, Awarded: {awarded ? 'true' : 'false'}
      </div>
    );
  };
});

jest.mock('./Header', () => {
  return function MockHeader({ 
    name, 
    summaryCurrency, 
    programme, 
    margin, 
    marginCurrency, 
    bestPrice, 
    bestProgramme, 
    subcontractor,
    actions 
  }) {
    return (
      <div data-testid="mock-header">
        Mock Header - Name: {name}, Currency: {summaryCurrency}
        {actions}
      </div>
    );
  };
});

describe('MuiComparisonTable', () => {
  const defaultProps = {
    quoteTableItem: {},
    orderTemplates: [],
    Columns: [],
    items: [],
    Body: () => <div>Body</div>,
    pid: 0,
    awarded: false,
    entity: {}
  };

  it('renders with minimal props', () => {
    render(<MuiComparisonTable {...defaultProps} />);
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-table')).toBeInTheDocument();
    expect(screen.getByTestId('mock-actions')).toBeInTheDocument();
  });

  it('renders with complete quote table item', () => {
    const propsWithQuote = {
      ...defaultProps,
      quoteTableItem: {
        summaryCurrency: 'USD',
        subcontractor: { name: 'Test Contractor' },
        programme: 30,
        margin: 10.5,
        marginCurrency: 'EUR',
        bestPrice: true,
        bestProgramme: false
      },
      pid: 123,
      awarded: true
    };

    render(<MuiComparisonTable {...propsWithQuote} />);
    
    expect(screen.getByTestId('mock-header')).toHaveTextContent('Name: Test Contractor');
    expect(screen.getByTestId('mock-header')).toHaveTextContent('Currency: USD');
    expect(screen.getByTestId('mock-actions')).toHaveTextContent('PID: 123');
    expect(screen.getByTestId('mock-actions')).toHaveTextContent('Awarded: true');
  });

  it('passes table actions as false', () => {
    render(<MuiComparisonTable {...defaultProps} />);
    
    expect(screen.getByTestId('mock-table')).toHaveTextContent('Actions: false');
  });

  it('handles empty subcontractor gracefully', () => {
    const propsWithEmptySubcontractor = {
      ...defaultProps,
      quoteTableItem: {
        summaryCurrency: 'GBP',
        subcontractor: {},
        programme: 45
      }
    };

    render(<MuiComparisonTable {...propsWithEmptySubcontractor} />);
    
    expect(screen.getByTestId('mock-header')).toHaveTextContent('Currency: GBP');
    expect(screen.getByTestId('mock-header')).toHaveTextContent('Name:'); // Empty name
  });
});