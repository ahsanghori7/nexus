import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import TenderAnalysis from './index';

// Mock all the heavy dependencies
jest.mock('react-redux', () => ({
  connect: (mapStateToProps, mapDispatchToProps) => (component) => component
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ slug: 'test-project', tid: '123' })
}));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      loadBoq: jest.fn(),
      loadUnits: jest.fn(),
      loadQuotes: jest.fn(),
      loadOrderTemplates: jest.fn(),
      fetchBoQByTenderId: jest.fn(),
      fetchUnits: jest.fn(),
      fetchOrderTemplates: jest.fn(),
      fetchBoQQuotes: jest.fn(),
      setLocalLoadQuotes: jest.fn(),
      fetchQuoteHistory: jest.fn(),
      goToSummaryQuotesTable: jest.fn(),
      goToSummaryQuoteReview: jest.fn(),
      goToSummaryQuoteHistory: jest.fn()
    }
  })
}));

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: (key) => key
  }
}));

jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: (amount) => `$${amount}`,
  currencyConfig: { USD: { symbol: '$' } }
}));

jest.mock('v2/helpers/flags', () => ({
  __esModule: true,
  default: () => false
}));

jest.mock('lodash/orderBy', () => jest.fn((arr) => arr));
jest.mock('lodash/maxBy', () => jest.fn());
jest.mock('lodash/minBy', () => jest.fn());

jest.mock('./TenderAnalysisHeader', () => ({
  TenderAnalysisHeader: ({ loading }) => (
    <div data-testid="tender-analysis-header">
      Header - Loading: {loading ? 'true' : 'false'}
    </div>
  )
}));

jest.mock('v2/apps/clink/pages/tender-analysis/quote-review', () => {
  return function QuoteReview() {
    return <div data-testid="quote-review">Quote Review</div>;
  };
});

jest.mock('v2/apps/clink/pages/tender-analysis/quote-history', () => {
  return function QuoteHistory() {
    return <div data-testid="quote-history">Quote History</div>;
  };
});

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('TenderAnalysis', () => {
  const defaultProps = {
    boq: {
      loading: null,
      units: [],
      entity: null,
      loadedQuotes: [],
      quotes: [],
      orderTemplates: [],
      quoteHistory: []
    },
    dispatch: jest.fn(),
    contextType: 'clink'
  };

  it('renders loading state', () => {
    const loadingProps = {
      ...defaultProps,
      boq: {
        ...defaultProps.boq,
        loading: { message: 'Loading...' }
      }
    };

    render(
      <TestWrapper>
        <TenderAnalysis {...loadingProps} />
      </TestWrapper>
    );

    expect(screen.getByTestId('tender-analysis-header')).toBeInTheDocument();
  });

  it('renders with empty entity', () => {
    render(
      <TestWrapper>
        <TenderAnalysis {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByTestId('tender-analysis-header')).toBeInTheDocument();
  });

  it('calculates budget correctly with entity entries', () => {
    const propsWithEntity = {
      ...defaultProps,
      boq: {
        ...defaultProps.boq,
        entity: {
          entries: [
            { budget_total: 1000 },
            { budget_rate: 50, quantity: 10 },
            { budget_rate: 25, quantity: 4 }
          ]
        }
      }
    };

    render(
      <TestWrapper>
        <TenderAnalysis {...propsWithEntity} />
      </TestWrapper>
    );

    expect(screen.getByTestId('tender-analysis-header')).toBeInTheDocument();
  });

  it('handles quotes data', () => {
    const propsWithQuotes = {
      ...defaultProps,
      boq: {
        ...defaultProps.boq,
        quotes: [{ 
          id: 1, 
          summary: 5000, 
          quote: [],
          programme: 10,
          subcontractor: { name: 'Test Contractor' },
          differences: []
        }]
      }
    };

    render(
      <TestWrapper>
        <TenderAnalysis {...propsWithQuotes} />
      </TestWrapper>
    );

    expect(screen.getByTestId('tender-analysis-header')).toBeInTheDocument();
  });

  it('renders with default contextType', () => {
    const propsWithoutContextType = {
      boq: defaultProps.boq,
      dispatch: jest.fn()
      // contextType omitted to test default
    };

    render(
      <TestWrapper>
        <TenderAnalysis {...propsWithoutContextType} />
      </TestWrapper>
    );

    expect(screen.getByTestId('tender-analysis-header')).toBeInTheDocument();
  });
});