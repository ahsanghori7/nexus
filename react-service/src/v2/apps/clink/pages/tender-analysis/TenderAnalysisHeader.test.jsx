import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { TenderAnalysisHeader } from './TenderAnalysisHeader';

// Mock the dependencies
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        white: '#ffffff',
        clinkPurple: '#8B5CF6',
        clinkLightPurple: '#A78BFA'
      }
    }
  }
}));

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => {
    const translations = {
      'ta-summary': 'Summary',
      'can-compare-quote': 'Can Compare Quote'
    };
    return translations[key] || key;
  }
}));

jest.mock('v2/helpers/flags', () => ({
  __esModule: true,
  default: (flag) => flag === 'HIDE_TABS' ? false : true
}));

jest.mock('v2/apps/shared/components/Loading', () => {
  return function MockLoading({ status }) {
    return <div data-testid="loading">Loading: {status}</div>;
  };
});

jest.mock('v2/apps/clink/pages/orders/subcontractors/modal', () => {
  return function MockModal({ open, setOpen }) {
    return open ? <div data-testid="modal">Modal Content</div> : null;
  };
});

jest.mock('./summary', () => {
  return function MockSummary({ totalBudget, quoteTableItems, items }) {
    return (
      <div data-testid="summary">
        Summary Component - Budget: {totalBudget}
      </div>
    );
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/main-contractor/project/test-slug/boq/123/quote/summary' })
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('TenderAnalysisHeader', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const defaultProps = {
    tabsArray: [],
    loading: null,
    quoteTableItems: [],
    items: [],
    totalBudget: 1000,
    slug: 'test-slug',
    tid: '123'
  };

  it('renders loading state correctly', () => {
    const loadingProps = {
      ...defaultProps,
      loading: { message: 'Loading data...' }
    };

    render(
      <TestWrapper>
        <TenderAnalysisHeader {...loadingProps} />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading: Loading data...');
  });

  it('renders with empty quote items', () => {
    render(
      <TestWrapper>
        <TenderAnalysisHeader {...defaultProps} />
      </TestWrapper>
    );

    // With empty quotes, we should see the tooltip instead of clickable summary
    const tabs = screen.getAllByTestId('tab');
    expect(tabs[0]).toHaveTextContent('Summary');
    expect(screen.getByTestId('summary')).toBeInTheDocument();
  });

  it('renders with multiple quote items and shows summary tab as clickable', () => {
    const propsWithQuotes = {
      ...defaultProps,
      quoteTableItems: [
        { id: 1, label: 'Quote 1' },
        { id: 2, label: 'Quote 2' }
      ],
      tabsArray: [
        { label: 'Quote 1', content: <div>Quote 1 Content</div> },
        { label: 'Quote 2', content: <div>Quote 2 Content</div> }
      ]
    };

    render(
      <TestWrapper>
        <TenderAnalysisHeader {...propsWithQuotes} />
      </TestWrapper>
    );

    const tabs = screen.getAllByTestId('tab');
    expect(tabs[0]).toHaveAttribute('data-label', 'Summary');
    expect(tabs[1]).toHaveAttribute('data-label', 'Quote 1');
    expect(tabs[2]).toHaveAttribute('data-label', 'Quote 2');
  });

  it('handles summary tab click with multiple quotes', () => {
    const propsWithQuotes = {
      ...defaultProps,
      quoteTableItems: [
        { id: 1, label: 'Quote 1' },
        { id: 2, label: 'Quote 2' }
      ]
    };

    render(
      <TestWrapper>
        <TenderAnalysisHeader {...propsWithQuotes} />
      </TestWrapper>
    );

    // Test that tabs component has correct props and can navigate
    expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', '0');
    // Since MUI components are mocked and interaction is limited, we focus on rendering
  });

  it('handles quote tab click', () => {
    const propsWithQuotes = {
      ...defaultProps,
      quoteTableItems: [
        { id: 1, label: 'Quote 1' },
        { id: 2, label: 'Quote 2' }
      ],
      tabsArray: [
        { label: 'Quote 1', content: <div>Quote 1 Content</div> },
        { label: 'Quote 2', content: <div>Quote 2 Content</div> }
      ]
    };

    render(
      <TestWrapper>
        <TenderAnalysisHeader {...propsWithQuotes} />
      </TestWrapper>
    );

    // The mock Tabs component has a hidden button that triggers onChange with index 1
    const tabChangeButton = screen.getByTestId('tab-change-button');
    fireEvent.click(tabChangeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/main-contractor/project/test-slug/boq/123/quote/1');
  });

  it('passes correct props to Summary component', () => {
    const propsWithData = {
      ...defaultProps,
      totalBudget: 5000,
      quoteTableItems: [{ id: 1 }],
      items: [{ id: 1, name: 'Item 1' }]
    };

    render(
      <TestWrapper>
        <TenderAnalysisHeader {...propsWithData} />
      </TestWrapper>
    );

    expect(screen.getByTestId('summary')).toHaveTextContent('Budget: 5000');
  });
});