import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Orders from './index';

// Mock external dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchOrders: jest.fn(
        () => () => Promise.resolve({ type: 'FETCH_ORDERS' }),
      ),
      fetchQuoteFiles: jest.fn(() => ({ type: 'FETCH_QUOTE_FILES' })),
      withdrawSentOrder: jest.fn(() => ({ type: 'WITHDRAW_SENT_ORDER' })),
      deleteOrder: jest.fn(() => ({ type: 'DELETE_ORDER' })),
      markAsSignOrder: jest.fn(() => ({ type: 'MARK_AS_SIGN_ORDER' })),
      sendApprovalReminder: jest.fn(() => ({ type: 'SEND_APPROVAL_REMINDER' })),
      assignedOrderApprovers: jest.fn(() => ({
        type: 'ASSIGNED_ORDER_APPROVERS',
      })),
      withdrawOrderApproval: jest.fn(() => ({
        type: 'WITHDRAW_ORDER_APPROVAL',
      })),
    },
  }),
}));

jest.mock('clink-components', () => ({
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

jest.mock('v2/apps/clink/pages/shared/template', () => {
  return function Template({ children }) {
    return <div data-testid="template">{children}</div>;
  };
});

jest.mock('v2/apps/clink/pages/shared/Accordion', () => {
  return function SimpleAccordion({ children, title, id }) {
    return (
      <div data-testid="accordion" data-title={title} data-id={id}>
        {children}
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/orders/JumpTo', () => {
  return function JumpTo({ entries }) {
    return <div data-testid="jump-to">JumpTo: {entries?.length} entries</div>;
  };
});

jest.mock('v2/apps/clink/pages/orders/subcontractors', () => {
  return function Subcontractors() {
    return <div data-testid="subcontractors">Subcontractors</div>;
  };
});

jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn(() => 'http://test-url.com'),
}));

jest.mock('v1/transactions/components/shared/DownloadButton', () => {
  return function DownloadButton({ children }) {
    return <button data-testid="download-button">{children}</button>;
  };
});

// Mock react-router-dom
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

// Create mock store
const createMockStore = (initialState) => {
  return configureStore({
    reducer: {
      project: (state = initialState.project) => state,
      order: (state = initialState.order) => state,
      quotesTender: (state = initialState.quotesTender) => state,
      subcontractor: (state = initialState.subcontractor) => state,
      clinkAccount: (state = initialState.clinkAccount) => state,
    },
  });
};

const renderWithProviders = (
  component,
  {
    store = createMockStore({
      project: { data: null },
      order: { list: [], loading: false },
      quotesTender: { quoteFiles: {} },
      subcontractor: {},
      clinkAccount: {},
    }),
    ...renderOptions
  } = {},
) => {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }
  return render(component, { wrapper: Wrapper, ...renderOptions });
};

describe('Orders Component', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ slug: 'test-project' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<Orders />);
    expect(screen.getByTestId('template')).toBeInTheDocument();
  });

  it('shows loader when loading is true', () => {
    const store = createMockStore({
      project: { data: { id: 1 } },
      order: { list: [{ id: 1, tender: null, entries: [] }], loading: true },
      quotesTender: { quoteFiles: {} },
      subcontractor: {},
      clinkAccount: {},
    });

    renderWithProviders(<Orders />, { store });
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows no orders message when no orders available', () => {
    const store = createMockStore({
      project: { data: null },
      order: { list: [], loading: false },
      quotesTender: { quoteFiles: {} },
      subcontractor: {},
      clinkAccount: {},
    });

    renderWithProviders(<Orders />, { store });
    expect(screen.getByText('no-orders-available')).toBeInTheDocument();
    expect(screen.getByText('please-issue-order')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'quotes-and-analysis' }),
    ).toHaveAttribute(
      'href',
      '/main-contractor/project/test-project/quotes_tender',
    );
  });

  it('renders orders when orders are available', () => {
    const mockOrders = [
      {
        id: 1,
        tender: {
          id: 'tender1',
          label: 'Test Tender',
        },
        entries: [
          {
            id: 'entry1',
            order_nr: 'ORDER-001',
            subcontractor: { id: 1, name: 'Test Subcontractor' },
          },
        ],
      },
    ];

    const store = createMockStore({
      project: { data: { id: 1 } },
      order: { list: mockOrders, loading: false },
      quotesTender: { quoteFiles: { tender1: {} } },
      subcontractor: {},
      clinkAccount: {},
    });

    renderWithProviders(<Orders />, { store });
    expect(screen.getByTestId('jump-to')).toBeInTheDocument();
    expect(screen.getByTestId('download-button')).toBeInTheDocument();
    expect(screen.getByTestId('accordion')).toBeInTheDocument();
    expect(screen.getByTestId('subcontractors')).toBeInTheDocument();
  });

  it('filters out orders without tender', () => {
    const mockOrders = [
      {
        id: 1,
        tender: null, // No tender
        entries: [],
      },
      {
        id: 2,
        tender: {
          id: 'tender2',
          label: 'Valid Tender',
        },
        entries: [],
      },
    ];

    const store = createMockStore({
      project: { data: { id: 1 } },
      order: { list: mockOrders, loading: false },
      quotesTender: { quoteFiles: {} },
      subcontractor: {},
      clinkAccount: {},
    });

    renderWithProviders(<Orders />, { store });
    // Should only render one accordion for the valid tender
    const accordions = screen.getAllByTestId('accordion');
    expect(accordions).toHaveLength(1);
    expect(accordions[0]).toHaveAttribute('data-title', 'Valid Tender');
  });

  it('generates correct accordion id from tender label', () => {
    const mockOrders = [
      {
        id: 1,
        tender: {
          id: 'tender1',
          label: 'Test Tender With Spaces',
        },
        entries: [],
      },
    ];

    const store = createMockStore({
      project: { data: { id: 1 } },
      order: { list: mockOrders, loading: false },
      quotesTender: { quoteFiles: {} },
      subcontractor: {},
      clinkAccount: {},
    });

    renderWithProviders(<Orders />, { store });
    const accordion = screen.getByTestId('accordion');
    expect(accordion).toHaveAttribute('data-id', 'test-tender-with-spaces');
  });
});
