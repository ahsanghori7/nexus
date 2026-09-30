import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuoteReview from './index';

// Mock all the dependencies
jest.mock('v2/apps/shared/components/boq/Table', () => {
  return function MockTable(props) {
    return <div data-testid="mock-table">Mock Table</div>;
  };
});

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: (key) => {
      const translations = {
        'ta-programme-weeks': 'Programme Weeks',
        'ta-total': 'Total',
        'currency': 'USD',
        'ta-comments': 'Comments'
      };
      return translations[key] || key;
    }
  }
}));

jest.mock('v2/apps/clink/pages/boq/content/Wrapper', () => {
  return function MockWrapper({ children }) {
    return <div data-testid="mock-wrapper">{children}</div>;
  };
});

jest.mock('v2/apps/clink/pages/tender-analysis/summary/actions', () => {
  return function MockActions(props) {
    return <div data-testid="mock-actions">Mock Actions</div>;
  };
});

jest.mock('v2/apps/shared/components/boq/QuoteReviewConfig', () => ({
  __esModule: true,
  default: () => <div>Mock Table Rows</div>,
  Columns: []
}));

jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: (amount) => `$${amount?.toLocaleString() || '0'}`,
  currencyConfig: {
    USD: { symbol: '$' }
  }
}));

jest.mock('v2/apps/clink/pages/boq/content/style', () => ({
  inputBaseSx: {}
}));

jest.mock('v2/apps/shared/components/muiTheme', () => {
  return function useTheme() {
    return {
      palette: {
        primary: { main: '#000' }
      }
    };
  };
});

jest.mock('v2/helpers/user/subscription', () => {
  return function Subscription() {
    return {
      isExternalMin: () => false
    };
  };
});

jest.mock('v2/helpers/url', () => ({
  getUrl: (host, path) => `https://example.com${path}`
}));

describe('QuoteReview', () => {
  const defaultProps = {
    quote: {
      tender: { project_id: 1, awarded: false },
      rows: [],
      summary: 50000,
      subcontractor: {
        name: 'Test Contractor',
        membership: null
      }
    },
    entity: {
      tender: { project_id: 1, awarded: false },
      entries: [],
      programme_weeks: { text: '12 weeks' }
    },
    orderTemplates: []
  };

  it('renders without crashing', () => {
    render(<QuoteReview {...defaultProps} />);
    
    expect(screen.getByTestId('mock-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('mock-table')).toBeInTheDocument();
    expect(screen.getByTestId('mock-actions')).toBeInTheDocument();
  });

  it('displays contractor name', () => {
    render(<QuoteReview {...defaultProps} />);
    
    expect(screen.getByText('Test Contractor')).toBeInTheDocument();
  });

  it('displays programme weeks', () => {
    render(<QuoteReview {...defaultProps} />);
    
    expect(screen.getByText('Programme Weeks:')).toBeInTheDocument();
    expect(screen.getByText('12 weeks')).toBeInTheDocument();
  });

  it('displays total summary', () => {
    render(<QuoteReview {...defaultProps} />);
    
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });

  it('handles empty quote data', () => {
    const emptyProps = {
      quote: {
        rows: [],
        summary: null,
        subcontractor: {
          name: '',
          membership: null
        }
      },
      entity: {
        entries: [],
        programme_weeks: { text: '' }
      },
      orderTemplates: []
    };

    render(<QuoteReview {...emptyProps} />);
    
    expect(screen.getByTestId('mock-wrapper')).toBeInTheDocument();
  });

  it('renders with membership data for subcontractor link', () => {
    const propsWithMembership = {
      ...defaultProps,
      quote: {
        ...defaultProps.quote,
        subcontractor: {
          name: 'Linked Contractor',
          membership: {
            account_id: 123,
            subscription_id: 456
          }
        }
      }
    };

    render(<QuoteReview {...propsWithMembership} />);
    
    expect(screen.getByText('Linked Contractor')).toBeInTheDocument();
  });
});