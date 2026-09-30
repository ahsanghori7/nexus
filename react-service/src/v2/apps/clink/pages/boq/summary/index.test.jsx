import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Summary from './index';

// Mock dependencies
jest.mock('v2/apps/shared/components/boq/Table', () => {
  return function MockTable({ items, actions }) {
    return (
      <div data-testid="mock-table">
        <div data-testid="items-count">{items.length}</div>
        <div data-testid="actions-enabled">{actions ? 'true' : 'false'}</div>
        {items.map((item, index) => (
          <div key={index} data-testid={`item-${index}`}>
            {JSON.stringify(item)}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('v2/apps/shared/components/boq/SummaryConfig', () => ({
  __esModule: true,
  default: function MockSummaryConfig(props) {
    return <div data-testid="mock-summary-config">{JSON.stringify(props)}</div>;
  },
  Columns: ['column1', 'column2'],
}));

jest.mock('v2/apps/clink/pages/boq/content/Wrapper', () => {
  return function MockWrapper({ children }) {
    return <div data-testid="mock-wrapper">{children}</div>;
  };
});

describe('Summary Component', () => {
  const mockNavigate = jest.fn();

  const createMockStore = (boqState) => {
    const reducer = (state = { boq: boqState }, action) => state;
    return createStore(reducer);
  };

  const mockEntities = [
    {
      label: 'Test Entity 1',
      tender_id: 1,
      status: 'active',
      entries: [
        { budget_total: 100, budget_rate: 10, quantity: 5 },
        { budget_total: 200, budget_rate: 20, quantity: 3 },
      ],
    },
    {
      label: 'Test Entity 2',
      tender_id: 2,
      status: 'pending',
      entries: [
        { budget_total: 0, budget_rate: 15, quantity: 4 },
        { budget_total: 300, budget_rate: 0, quantity: 0 },
      ],
    },
  ];

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders without crashing', () => {
    const store = createMockStore({ entities: [] });
    
    render(
      <Provider store={store}>
        <Summary navigate={mockNavigate} />
      </Provider>
    );
  });

  it('renders with empty entities array', () => {
    const store = createMockStore({ entities: [] });
    
    const { getByTestId } = render(
      <Provider store={store}>
        <Summary navigate={mockNavigate} />
      </Provider>
    );
    
    expect(getByTestId('mock-table')).toBeInTheDocument();
    expect(getByTestId('items-count')).toHaveTextContent('0');
  });

  it('processes entities correctly', () => {
    const store = createMockStore({ entities: mockEntities });
    
    const { getByTestId } = render(
      <Provider store={store}>
        <Summary navigate={mockNavigate} />
      </Provider>
    );
    
    expect(getByTestId('items-count')).toHaveTextContent('2');
  });

  it('calculates budget correctly for entities with budget_total', () => {
    const store = createMockStore({ entities: mockEntities });
    
    const { getByTestId } = render(
      <Provider store={store}>
        <Summary navigate={mockNavigate} />
      </Provider>
    );
    
    const item0 = getByTestId('item-0');
    const parsedItem0 = JSON.parse(item0.textContent);
    
    // Entity 1: budget_total 100 + 200 = 300
    expect(parsedItem0.budget).toBe(300);
  });

  it('calculates budget correctly using budget_rate * quantity when budget_total is 0', () => {
    const store = createMockStore({ entities: mockEntities });
    
    const { getByTestId } = render(
      <Provider store={store}>
        <Summary navigate={mockNavigate} />
      </Provider>
    );
    
    const item1 = getByTestId('item-1');
    const parsedItem1 = JSON.parse(item1.textContent);
    
    // Entity 2: budget_rate 15 * quantity 4 = 60, plus budget_total 300 = 360
    expect(parsedItem1.budget).toBe(360);
  });

  it('creates correct entity structure', () => {
    const store = createMockStore({ entities: mockEntities });
    
    const { getByTestId } = render(
      <Provider store={store}>
        <Summary navigate={mockNavigate} />
      </Provider>
    );
    
    const item0 = getByTestId('item-0');
    const parsedItem0 = JSON.parse(item0.textContent);
    
    expect(parsedItem0).toEqual({
      id: 'test-entity-1',
      label: 'Test Entity 1',
      tid: 1,
      status: 'active',
      budget: 300,
    });
  });

  it('generates correct id from label by replacing spaces with hyphens', () => {
    const entityWithSpaces = {
      label: 'My Test Entity With Spaces',
      tender_id: 3,
      status: 'active',
      entries: [],
    };
    
    const store = createMockStore({ entities: [entityWithSpaces] });
    
    const { getByTestId } = render(
      <Provider store={store}>
        <Summary navigate={mockNavigate} />
      </Provider>
    );
    
    const item0 = getByTestId('item-0');
    const parsedItem0 = JSON.parse(item0.textContent);
    
    expect(parsedItem0.id).toBe('my-test-entity-with-spaces');
  });

  it('passes actions as false to Table component', () => {
    const store = createMockStore({ entities: [] });
    
    const { getByTestId } = render(
      <Provider store={store}>
        <Summary navigate={mockNavigate} />
      </Provider>
    );
    
    expect(getByTestId('actions-enabled')).toHaveTextContent('false');
  });

  it('renders Wrapper component', () => {
    const store = createMockStore({ entities: [] });
    
    const { getByTestId } = render(
      <Provider store={store}>
        <Summary navigate={mockNavigate} />
      </Provider>
    );
    
    expect(getByTestId('mock-wrapper')).toBeInTheDocument();
  });

  it('uses default navigate function when not provided', () => {
    const store = createMockStore({ entities: [] });
    
    // Should not throw error when navigate is not provided
    render(
      <Provider store={store}>
        <Summary />
      </Provider>
    );
  });

  it('matches snapshot', () => {
    const store = createMockStore({ entities: mockEntities });
    
    const { container } = render(
      <Provider store={store}>
        <Summary navigate={mockNavigate} />
      </Provider>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});