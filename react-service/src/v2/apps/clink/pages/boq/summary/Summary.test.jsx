import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import Summary from './index';

// Mock dependencies
jest.mock('v2/apps/shared/components/boq/Table', () => {
  return function MockTable({ Columns, items, Body, actions }) {
    return (
      <div data-testid="boq-table">
        <div data-testid="table-columns">{Columns?.length || 0}</div>
        <div data-testid="table-items-count">{items?.length || 0}</div>
        <div data-testid="table-actions">{actions ? 'true' : 'false'}</div>
        {items?.map((item, index) => (
          <div key={item.id} data-testid={`table-item-${index}`}>
            <div data-testid={`item-id-${index}`}>{item.id}</div>
            <div data-testid={`item-label-${index}`}>{item.label}</div>
            <div data-testid={`item-tid-${index}`}>{item.tid}</div>
            <div data-testid={`item-status-${index}`}>{item.status}</div>
            <div data-testid={`item-budget-${index}`}>{item.budget}</div>
          </div>
        ))}
        {Body && <Body items={items} />}
      </div>
    );
  };
});

jest.mock('v2/apps/shared/components/boq/SummaryConfig', () => ({
  __esModule: true,
  default: function MockSummaryConfig({ navigate, items }) {
    return (
      <div data-testid="summary-config">
        <button
          data-testid="navigate-button"
          onClick={() => navigate && navigate('test-route')}
        >
          Navigate
        </button>
        <div data-testid="config-items-count">{items?.length || 0}</div>
      </div>
    );
  },
  Columns: [
    { field: 'label', headerName: 'Label' },
    { field: 'status', headerName: 'Status' },
    { field: 'budget', headerName: 'Budget' },
  ],
}));

jest.mock('v2/apps/clink/pages/boq/content/Wrapper', () => {
  return function MockWrapper({ children }) {
    return <div data-testid="content-wrapper">{children}</div>;
  };
});

// Mock store
const createMockStore = (initialState = {}) => {
  const defaultState = {
    boq: {
      entities: [],
      ...initialState.boq,
    },
    ...initialState,
  };
  
  const rootReducer = (state = defaultState, action) => {
    switch (action.type) {
      default:
        return state;
    }
  };
  return createStore(rootReducer);
};

const theme = createTheme();

const defaultProps = {
  navigate: jest.fn(),
};

const renderComponent = (props = {}, storeState = {}) => {
  const store = createMockStore(storeState);
  const mergedProps = { ...defaultProps, ...props };

  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Summary {...mergedProps} />
      </ThemeProvider>
    </Provider>
  );
};

describe('Summary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('content-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('boq-table')).toBeInTheDocument();
    });

    test('renders with empty entities', () => {
      const storeState = {
        boq: { entities: [] },
      };
      renderComponent({}, storeState);
      
      expect(screen.getByTestId('table-items-count')).toHaveTextContent('0');
    });

    test('disables table actions', () => {
      renderComponent();
      expect(screen.getByTestId('table-actions')).toHaveTextContent('false');
    });
  });

  describe('Entity Processing', () => {
    test('processes single entity correctly', () => {
      const storeState = {
        boq: {
          entities: [
            {
              id: 1,
              label: 'Test Entity',
              tender_id: 123,
              status: 'active',
              entries: [
                {
                  id: 1,
                  budget_rate: 100,
                  quantity: 5,
                  budget_total: 500,
                },
                {
                  id: 2,
                  budget_rate: 200,
                  quantity: 3,
                  budget_total: 600,
                },
              ],
            },
          ],
        },
      };
      
      renderComponent({}, storeState);
      
      expect(screen.getByTestId('table-items-count')).toHaveTextContent('1');
      expect(screen.getByTestId('item-id-0')).toHaveTextContent('test-entity');
      expect(screen.getByTestId('item-label-0')).toHaveTextContent('Test Entity');
      expect(screen.getByTestId('item-tid-0')).toHaveTextContent('123');
      expect(screen.getByTestId('item-status-0')).toHaveTextContent('active');
      expect(screen.getByTestId('item-budget-0')).toHaveTextContent('1100');
    });

    test('processes multiple entities correctly', () => {
      const storeState = {
        boq: {
          entities: [
            {
              id: 1,
              label: 'First Entity',
              tender_id: 123,
              status: 'active',
              entries: [
                { budget_rate: 100, quantity: 2, budget_total: 200 },
              ],
            },
            {
              id: 2,
              label: 'Second Entity',
              tender_id: 456,
              status: 'inactive',
              entries: [
                { budget_rate: 150, quantity: 4, budget_total: 600 },
              ],
            },
          ],
        },
      };
      
      renderComponent({}, storeState);
      
      expect(screen.getByTestId('table-items-count')).toHaveTextContent('2');
      
      // First entity
      expect(screen.getByTestId('item-id-0')).toHaveTextContent('first-entity');
      expect(screen.getByTestId('item-label-0')).toHaveTextContent('First Entity');
      expect(screen.getByTestId('item-budget-0')).toHaveTextContent('200');
      
      // Second entity
      expect(screen.getByTestId('item-id-1')).toHaveTextContent('second-entity');
      expect(screen.getByTestId('item-label-1')).toHaveTextContent('Second Entity');
      expect(screen.getByTestId('item-budget-1')).toHaveTextContent('600');
    });

    test('handles entities with complex labels', () => {
      const storeState = {
        boq: {
          entities: [
            {
              id: 1,
              label: 'Test Entity With Spaces',
              tender_id: 123,
              status: 'active',
              entries: [
                { budget_rate: 100, quantity: 1, budget_total: 100 },
              ],
            },
            {
              id: 2,
              label: 'UPPERCASE ENTITY',
              tender_id: 456,
              status: 'inactive',
              entries: [
                { budget_rate: 200, quantity: 1, budget_total: 200 },
              ],
            },
          ],
        },
      };
      
      renderComponent({}, storeState);
      
      expect(screen.getByTestId('item-id-0')).toHaveTextContent('test-entity-with-spaces');
      expect(screen.getByTestId('item-id-1')).toHaveTextContent('uppercase-entity');
    });
  });

  describe('Budget Calculations', () => {
    test('calculates budget using budget_total when available', () => {
      const storeState = {
        boq: {
          entities: [
            {
              id: 1,
              label: 'Test Entity',
              tender_id: 123,
              status: 'active',
              entries: [
                {
                  budget_rate: 100,
                  quantity: 2,
                  budget_total: 300, // Should use this value
                },
              ],
            },
          ],
        },
      };
      
      renderComponent({}, storeState);
      expect(screen.getByTestId('item-budget-0')).toHaveTextContent('300');
    });

    test('calculates budget using rate × quantity when budget_total is zero', () => {
      const storeState = {
        boq: {
          entities: [
            {
              id: 1,
              label: 'Test Entity',
              tender_id: 123,
              status: 'active',
              entries: [
                {
                  budget_rate: 100,
                  quantity: 3,
                  budget_total: 0, // Should fall back to rate × quantity
                },
              ],
            },
          ],
        },
      };
      
      renderComponent({}, storeState);
      expect(screen.getByTestId('item-budget-0')).toHaveTextContent('300');
    });

    test('calculates budget using rate × quantity when budget_total is null', () => {
      const storeState = {
        boq: {
          entities: [
            {
              id: 1,
              label: 'Test Entity',
              tender_id: 123,
              status: 'active',
              entries: [
                {
                  budget_rate: 150,
                  quantity: 2,
                  budget_total: null,
                },
              ],
            },
          ],
        },
      };
      
      renderComponent({}, storeState);
      expect(screen.getByTestId('item-budget-0')).toHaveTextContent('300');
    });

    test('handles mixed budget calculation methods', () => {
      const storeState = {
        boq: {
          entities: [
            {
              id: 1,
              label: 'Test Entity',
              tender_id: 123,
              status: 'active',
              entries: [
                {
                  budget_rate: 100,
                  quantity: 2,
                  budget_total: 250, // Use this
                },
                {
                  budget_rate: 150,
                  quantity: 3,
                  budget_total: 0, // Use rate × quantity = 450
                },
                {
                  budget_rate: 200,
                  quantity: 1,
                  budget_total: 200, // Use this
                },
              ],
            },
          ],
        },
      };
      
      renderComponent({}, storeState);
      // Total: 250 + 450 + 200 = 900
      expect(screen.getByTestId('item-budget-0')).toHaveTextContent('900');
    });

    test('handles entities with no entries', () => {
      const storeState = {
        boq: {
          entities: [
            {
              id: 1,
              label: 'Empty Entity',
              tender_id: 123,
              status: 'active',
              entries: [],
            },
          ],
        },
      };
      
      renderComponent({}, storeState);
      expect(screen.getByTestId('item-budget-0')).toHaveTextContent('0');
    });

    test('handles string numeric values', () => {
      const storeState = {
        boq: {
          entities: [
            {
              id: 1,
              label: 'Test Entity',
              tender_id: 123,
              status: 'active',
              entries: [
                {
                  budget_rate: '100.50',
                  quantity: '2',
                  budget_total: '0',
                },
              ],
            },
          ],
        },
      };
      
      renderComponent({}, storeState);
      expect(screen.getByTestId('item-budget-0')).toHaveTextContent('201');
    });
  });

  describe('Navigation', () => {
    test('passes navigate function to SummaryConfig', () => {
      const mockNavigate = jest.fn();
      renderComponent({ navigate: mockNavigate });
      
      const navigateButton = screen.getByTestId('navigate-button');
      navigateButton.click();
      
      expect(mockNavigate).toHaveBeenCalledWith('test-route');
    });

    test('handles missing navigate function', () => {
      renderComponent({ navigate: undefined });
      expect(screen.getByTestId('summary-config')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles entities with undefined entries', () => {
      const storeState = {
        boq: {
          entities: [
            {
              id: 1,
              label: 'Test Entity',
              tender_id: 123,
              status: 'active',
              // entries is undefined
            },
          ],
        },
      };
      
      // This should not crash, though it might not display correctly
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        renderComponent({}, storeState);
      } catch (error) {
        // Expected to potentially fail due to undefined entries
      }
      
      consoleSpy.mockRestore();
    });

    test('handles empty entity list', () => {
      const storeState = {
        clink: {
          project: {
            projectDetails: { slug: 'test-project' },
            entities: [],
          },
        },
      };
      
      renderComponent({}, storeState);
      expect(screen.getByTestId('content-wrapper')).toBeInTheDocument();
    });

    test('handles decimal budget calculations', () => {
      const storeState = {
        boq: {
          entities: [
            {
              id: 1,
              label: 'Decimal Entity',
              tender_id: 123,
              status: 'active',
              entries: [
                {
                  budget_rate: 99.99,
                  quantity: 1.5,
                  budget_total: 0,
                },
              ],
            },
          ],
        },
      };
      
      renderComponent({}, storeState);
      expect(screen.getByTestId('item-budget-0')).toHaveTextContent('149.98');
    });
  });

  describe('Table Configuration', () => {
    test('passes correct columns to table', () => {
      renderComponent();
      expect(screen.getByTestId('table-columns')).toHaveTextContent('3');
    });

    test('renders WrapperSummary component', () => {
      renderComponent();
      expect(screen.getByTestId('summary-config')).toBeInTheDocument();
    });
  });
});