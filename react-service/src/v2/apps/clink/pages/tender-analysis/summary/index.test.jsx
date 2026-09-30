import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Summary from './index';

// Mock dependencies
jest.mock('v2/apps/shared/components/boq/Table', () => {
  return function MockTable({ Columns, items, Body, actions, sx }) {
    return (
      <div data-testid="mock-table">
        <div data-testid="table-columns">{JSON.stringify(Columns)}</div>
        <div data-testid="table-items">{JSON.stringify(items)}</div>
        <div data-testid="table-actions">{JSON.stringify(actions)}</div>
      </div>
    );
  };
});

jest.mock('v2/apps/shared/components/boq/TenderAnalysisConfig', () => ({
  __esModule: true,
  default: function MockTenderAnalysisConfig(props) {
    return <div data-testid="tender-analysis-config" {...props} />;
  },
  Columns: ['analysis-col1', 'analysis-col2'],
}));

jest.mock('v2/apps/shared/components/boq/TenderComparisonConfig', () => ({
  __esModule: true,
  default: function MockTenderComparisonConfig(props) {
    return <div data-testid="tender-comparison-config" {...props} />;
  },
  Columns: ['comparison-col1', 'comparison-col2'],
}));

jest.mock('v2/apps/clink/pages/boq/content/Wrapper', () => {
  return function MockWrapper({ children }) {
    return <div data-testid="wrapper">{children}</div>;
  };
});

jest.mock('./MuiComparisonTable', () => {
  return function MockMuiComparisonTable(props) {
    return (
      <div data-testid="mui-comparison-table">
        <div data-testid="comparison-table-props">{JSON.stringify(props)}</div>
      </div>
    );
  };
});

jest.mock('./TenderBoqDescription', () => {
  return function MockTenderBoqDescription({ totalBudget, packageLabel }) {
    return (
      <div data-testid="tender-boq-description">
        <span data-testid="total-budget">{totalBudget}</span>
        <span data-testid="package-label">{packageLabel}</span>
      </div>
    );
  };
});

// Mock lodash isEmpty
jest.mock('lodash/isEmpty', () => jest.fn());

// Create mock store
const createMockStore = (boqState) => {
  return createStore(() => ({
    boq: boqState,
  }));
};

describe('Summary', () => {
  const mockBoq = {
    entity: {
      id: 1,
      tender: {
        label: 'Test Tender',
        project_id: 123,
        awarded: false,
      },
    },
    orderTemplates: ['template1', 'template2'],
  };

  const mockItems = [
    { id: 1, type: 'material', name: 'Item 1' },
    { id: 2, type: 'labour', name: 'Item 2' },
  ];

  const mockQuoteTableItems = [
    {
      id: 'quote1',
      summaryCurrency: '10000',
      programme: 30,
      subcontractor: { name: 'Contractor 1' },
      rows: [
        { boq_item_id: 1, amount: 500 },
        { boq_item_id: 2, amount: 300 },
      ],
    },
    {
      id: 'quote2',
      summaryCurrency: '12000',
      programme: 25,
      subcontractor: { name: 'Contractor 2' },
      rows: [
        { boq_item_id: 1, amount: 600 },
        { boq_item_id: 2, amount: 400 },
      ],
    },
  ];

  const mockNavigate = jest.fn();
  const mockStore = createMockStore(mockBoq);

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset timer mock
    jest.useFakeTimers();
    
    // Mock isEmpty to return false for non-empty arrays
    const isEmpty = require('lodash/isEmpty');
    isEmpty.mockImplementation((value) => {
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object' && value !== null) return Object.keys(value).length === 0;
      return !value;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderWithStore = (component, store = mockStore) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  it('renders wrapper and basic structure', () => {
    renderWithStore(
      <Summary
        boq={mockBoq}
        items={mockItems}
        quoteTableItems={[]}
        navigate={mockNavigate}
        totalBudget="50000"
      />
    );

    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('tender-boq-description')).toBeInTheDocument();
    expect(screen.getByTestId('mock-table')).toBeInTheDocument();
  });

  it('displays tender boq description with correct props', () => {
    renderWithStore(
      <Summary
        boq={mockBoq}
        items={mockItems}
        quoteTableItems={[]}
        navigate={mockNavigate}
        totalBudget="50000"
      />
    );

    expect(screen.getByTestId('total-budget')).toHaveTextContent('50000');
    expect(screen.getByTestId('package-label')).toHaveTextContent('Test Tender');
  });

  it('renders table with correct props', () => {
    renderWithStore(
      <Summary
        boq={mockBoq}
        items={mockItems}
        quoteTableItems={[]}
        navigate={mockNavigate}
        totalBudget="50000"
      />
    );

    const tableColumns = JSON.parse(screen.getByTestId('table-columns').textContent);
    const tableItems = JSON.parse(screen.getByTestId('table-items').textContent);
    const tableActions = JSON.parse(screen.getByTestId('table-actions').textContent);

    expect(tableColumns).toEqual(['analysis-col1', 'analysis-col2']);
    expect(tableItems).toEqual(mockItems);
    expect(tableActions).toBe(false);
  });

  it('shows skeleton when quotes not prepared', () => {
    renderWithStore(
      <Summary
        boq={mockBoq}
        items={mockItems}
        quoteTableItems={mockQuoteTableItems}
        navigate={mockNavigate}
        totalBudget="50000"
      />
    );

    expect(screen.getByTestId('mui-skeleton')).toBeInTheDocument();
  });

  it('shows comparison tables after timeout when quotes are present', async () => {
    renderWithStore(
      <Summary
        boq={mockBoq}
        items={mockItems}
        quoteTableItems={mockQuoteTableItems}
        navigate={mockNavigate}
        totalBudget="50000"
      />
    );

    // Initially shows skeleton
    expect(screen.getByTestId('mui-skeleton')).toBeInTheDocument();

    // Fast forward timer
    jest.advanceTimersByTime(900);

    await waitFor(() => {
      expect(screen.queryByTestId('mui-skeleton')).not.toBeInTheDocument();
      expect(screen.getAllByTestId('mui-comparison-table')).toHaveLength(2);
    });
  });

  it('processes quote table items and adds item types', async () => {
    renderWithStore(
      <Summary
        boq={mockBoq}
        items={mockItems}
        quoteTableItems={mockQuoteTableItems}
        navigate={mockNavigate}
        totalBudget="50000"
      />
    );

    jest.advanceTimersByTime(900);

    await waitFor(() => {
      const comparisonTables = screen.getAllByTestId('comparison-table-props');
      const firstTableProps = JSON.parse(comparisonTables[0].textContent);
      
      // Check that item types were added to rows
      expect(firstTableProps.items[0]).toEqual({
        boq_item_id: 1,
        amount: 500,
        type: 'material',
      });
      expect(firstTableProps.items[1]).toEqual({
        boq_item_id: 2,
        amount: 300,
        type: 'labour',
      });
    });
  });

  it('passes correct props to MuiComparisonTable', async () => {
    renderWithStore(
      <Summary
        boq={mockBoq}
        items={mockItems}
        quoteTableItems={mockQuoteTableItems}
        navigate={mockNavigate}
        totalBudget="50000"
      />
    );

    jest.advanceTimersByTime(900);

    await waitFor(() => {
      const comparisonTables = screen.getAllByTestId('comparison-table-props');
      const firstTableProps = JSON.parse(comparisonTables[0].textContent);
      
      expect(firstTableProps).toMatchObject({
        id: 'quote1',
        summaryCurrency: '10000',
        programme: 30,
        subcontractor: { name: 'Contractor 1' },
        pid: 123,
        awarded: false,
        entity: mockBoq.entity,
        orderTemplates: mockBoq.orderTemplates,
      });
    });
  });

  it('handles missing tender in entity', () => {
    const boqWithoutTender = {
      entity: { id: 1 },
      orderTemplates: [],
    };
    const storeWithoutTender = createMockStore(boqWithoutTender);

    renderWithStore(
      <Summary
        boq={boqWithoutTender}
        items={mockItems}
        quoteTableItems={[]}
        navigate={mockNavigate}
        totalBudget="50000"
      />,
      storeWithoutTender
    );

    expect(screen.getByTestId('package-label')).toBeEmptyDOMElement();
  });

  it('handles missing entity', () => {
    const boqWithoutEntity = {
      orderTemplates: [],
    };
    const storeWithoutEntity = createMockStore(boqWithoutEntity);

    renderWithStore(
      <Summary
        boq={boqWithoutEntity}
        items={mockItems}
        quoteTableItems={[]}
        navigate={mockNavigate}
        totalBudget="50000"
      />,
      storeWithoutEntity
    );

    expect(screen.getByTestId('package-label')).toBeEmptyDOMElement();
  });

  it('handles items without matching boq_item_id', async () => {
    const quoteWithUnmatchedItems = [
      {
        id: 'quote1',
        summaryCurrency: '10000',
        programme: 30,
        subcontractor: { name: 'Contractor 1' },
        rows: [
          { boq_item_id: 999, amount: 500 }, // No matching item
        ],
      },
    ];

    renderWithStore(
      <Summary
        boq={mockBoq}
        items={mockItems}
        quoteTableItems={quoteWithUnmatchedItems}
        navigate={mockNavigate}
        totalBudget="50000"
      />
    );

    jest.advanceTimersByTime(900);

    await waitFor(() => {
      const comparisonTables = screen.getAllByTestId('comparison-table-props');
      const firstTableProps = JSON.parse(comparisonTables[0].textContent);
      
      // Item should remain unchanged when no matching item is found
      expect(firstTableProps.items[0]).toEqual({
        boq_item_id: 999,
        amount: 500,
      });
    });
  });

  it('handles empty quote table items', () => {
    renderWithStore(
      <Summary
        boq={mockBoq}
        items={mockItems}
        quoteTableItems={[]}
        navigate={mockNavigate}
        totalBudget="50000"
      />
    );

    // Should show skeleton even with empty quotes (because prepareQuotes starts as false)
    expect(screen.getByTestId('mui-skeleton')).toBeInTheDocument();
    // Should not show comparison tables when no quotes
    expect(screen.queryByTestId('mui-comparison-table')).not.toBeInTheDocument();
  });

  it('clears timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = renderWithStore(
      <Summary
        boq={mockBoq}
        items={mockItems}
        quoteTableItems={mockQuoteTableItems}
        navigate={mockNavigate}
        totalBudget="50000"
      />
    );

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});