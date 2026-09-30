import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import Subcontractors from './index';

// Mock external dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

jest.mock('v2/helpers/flags', () =>
  jest.fn((flag) => {
    if (flag === 'DELETE_DRAFT_ORDER') return true;
    if (flag === 'APPROVAL_THRESHOLD') return true;
    return false;
  }),
);

jest.mock('v2/helpers/status/orders', () => ({
  PENDING: 'PENDING',
}));

jest.mock('moment', () => {
  const originalMoment = jest.requireActual('moment');
  return (date) => originalMoment(date || '2023-01-01');
});

jest.mock('lodash/isEmpty', () => jest.fn(() => false));

jest.mock('./AssignedApproversAvatars', () => {
  return function AssignedApproversAvatars({ assignedApprovers }) {
    return (
      <div data-testid="assigned-approvers">
        {assignedApprovers?.length || 0} approvers
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/orders/Mui.Components', () => ({
  themeTable: {},
  AvtarGridContainer: ({ children }) => (
    <div data-testid="avatar-grid">{children}</div>
  ),
  CompanyGridContainer: ({ children }) => (
    <div data-testid="company-grid">{children}</div>
  ),
  StatusGridContainer: ({ children }) => (
    <div data-testid="status-grid">{children}</div>
  ),
}));

jest.mock('v2/apps/clink/pages/shared/MuiDropdown', () => {
  return function MuiDropdownButton({ options }) {
    return (
      <div data-testid="dropdown-button">{options?.length || 0} options</div>
    );
  };
});

jest.mock('v2/helpers/user', () => ({
  getAccountLogo: jest.fn(() => 'test-logo.png'),
}));

jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: jest.fn((value, config) => `$${value || 0}`),
  currencyConfig: { USD: { symbol: '$' } },
}));

jest.mock('v2/apps/clink/pages/orders/subcontractors/modal', () => {
  return function Modal({ open, setOpen }) {
    return open ? <div data-testid="modal">Modal Content</div> : null;
  };
});

jest.mock('v2/apps/clink/pages/orders/subcontractors/useActions', () => {
  return jest.fn(() => [
    { label: 'Action 1', action: jest.fn() },
    { label: 'Action 2', action: jest.fn() },
  ]);
});

jest.mock('./OrderDetailsExpandablePanel', () => {
  return function OrderDetailsExpandablePanel({ rowData }) {
    return (
      <div data-testid="expandable-panel">
        Expandable Panel for {rowData?.order_nr}
      </div>
    );
  };
});

jest.mock('v2/apps/shared/components/approval-expandable-panel', () => {
  return function ApprovalExpandablePanel({ levels }) {
    return (
      <div data-testid="approval-expandable-panel">
        {levels?.length || 0} levels
      </div>
    );
  };
});

// Create a simple theme for ThemeProvider
const mockTheme = {
  palette: { primary: { main: '#000' } },
  spacing: (value) => value * 8,
};

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={mockTheme}>{component}</ThemeProvider>);
};

describe('Subcontractors Component', () => {
  const mockProps = {
    pid: '123',
    entryData: [],
    tender: { id: 'tender-1', label: 'Test Tender' },
    withdrawSentOrder: jest.fn(),
    markAsSignOrder: jest.fn(),
    deleteOrder: jest.fn(),
    quoteFilesForTender: {},
    userInfo: { id: 'user-1', name: 'Test User' },
    sendApprovalReminder: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders without crashing', () => {
    renderWithTheme(<Subcontractors {...mockProps} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders empty table when no entry data', () => {
    renderWithTheme(<Subcontractors {...mockProps} />);

    // Should render table headers
    expect(screen.getByText('order-page-order-n')).toBeInTheDocument();
    expect(screen.getByText('order-page-document')).toBeInTheDocument();
    expect(screen.getByText('order-page-order-date')).toBeInTheDocument();
    expect(screen.getByText('order-page-company')).toBeInTheDocument();
    expect(screen.getByText('order-page-value')).toBeInTheDocument();
    expect(screen.getByText('order-page-status')).toBeInTheDocument();
  });

  it('renders order data when provided', () => {
    const entryData = [
      {
        id: '1',
        order_nr: 'ORDER-001',
        created_at: '2023-01-01T00:00:00Z',
        value: 1000,
        status: 'COMPLETED',
        document: {
          id: 'doc-1',
          name: 'Test Document Name',
        },
        subcontractor: {
          id: 'sub-1',
          name: 'Test Subcontractor',
        },
        signatory: {
          signers: 2,
          total: 3,
        },
        assigned_approvers: [
          { id: '1', approver_user: { id: 'user-1' } },
          { id: '2', approver_user: { id: 'user-2' } },
        ],
      },
    ];

    renderWithTheme(<Subcontractors {...mockProps} entryData={entryData} />);

    expect(screen.getByText('ORDER-001')).toBeInTheDocument();
    expect(screen.getByText('01/01/2023')).toBeInTheDocument();
    expect(screen.getByText('Test Subcontractor')).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('handles pending status with signatory information', () => {
    const entryData = [
      {
        id: '1',
        order_nr: 'ORDER-002',
        created_at: '2023-01-01T00:00:00Z',
        value: 500,
        status: 'PENDING',
        document: {
          id: 'doc-2',
          name: 'Another Document',
        },
        subcontractor: {
          id: 'sub-2',
          name: 'Another Subcontractor',
        },
        signatory: {
          signers: 1,
          total: 2,
        },
        assigned_approvers: [],
      },
    ];

    renderWithTheme(<Subcontractors {...mockProps} entryData={entryData} />);

    expect(screen.getByText('PENDING (1/2)')).toBeInTheDocument();
  });

  it('renders document tooltip for abbreviation', () => {
    const entryData = [
      {
        id: '1',
        order_nr: 'ORDER-003',
        created_at: '2023-01-01T00:00:00Z',
        value: 750,
        status: 'DRAFT',
        document: {
          id: 'doc-3',
          name: 'Very Long Document Name',
        },
        subcontractor: {
          id: 'sub-3',
          name: 'Third Subcontractor',
        },
        assigned_approvers: [],
      },
    ];

    renderWithTheme(<Subcontractors {...mockProps} entryData={entryData} />);

    // The abbreviation should be VLDN (first letters of each word)
    expect(screen.getByText('VLDN')).toBeInTheDocument();
  });

  it('shows expand/collapse button when approval threshold flag is on and has approvers', () => {
    const entryData = [
      {
        id: '1',
        order_nr: 'ORDER-004',
        created_at: '2023-01-01T00:00:00Z',
        value: 300,
        status: 'PENDING',
        document: {
          id: 'doc-4',
          name: 'Document Four',
        },
        subcontractor: {
          id: 'sub-4',
          name: 'Fourth Subcontractor',
        },
        assigned_approvers: [{ id: '1', approver_user: { id: 'user-1' } }],
      },
    ];

    renderWithTheme(<Subcontractors {...mockProps} entryData={entryData} />);

    expect(screen.getByLabelText('expand row')).toBeInTheDocument();
  });

  it('toggles expandable panel when expand button is clicked', () => {
    const entryData = [
      {
        id: '1',
        order_nr: 'ORDER-005',
        created_at: '2023-01-01T00:00:00Z',
        value: 200,
        status: 'PENDING',
        document: {
          id: 'doc-5',
          name: 'Document Five',
        },
        subcontractor: {
          id: 'sub-5',
          name: 'Fifth Subcontractor',
        },
        assigned_approvers: [{ id: '1', approver_user: { id: 'user-1' } }],
      },
    ];

    renderWithTheme(<Subcontractors {...mockProps} entryData={entryData} />);

    const expandButton = screen.getByLabelText('expand row');

    // Panel should not be visible initially
    expect(screen.queryByTestId('expandable-panel')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(expandButton);

    // Panel should now be visible
    expect(screen.getByTestId('approval-expandable-panel')).toBeInTheDocument();
  });

  it('renders actions dropdown when actions are available', () => {
    const entryData = [
      {
        id: '1',
        order_nr: 'ORDER-006',
        created_at: '2023-01-01T00:00:00Z',
        value: 100,
        status: 'DRAFT',
        document: {
          id: 'doc-6',
          name: 'Document Six',
        },
        subcontractor: {
          id: 'sub-6',
          name: 'Sixth Subcontractor',
        },
        assigned_approvers: [],
      },
    ];

    renderWithTheme(<Subcontractors {...mockProps} entryData={entryData} />);

    expect(screen.getByTestId('dropdown-button')).toBeInTheDocument();
    expect(screen.getByText('2 options')).toBeInTheDocument();
  });

  it('skips empty rows in entry data', () => {
    const entryData = [
      {}, // Empty row should be skipped
      {
        id: '1',
        order_nr: 'ORDER-007',
        created_at: '2023-01-01T00:00:00Z',
        value: 150,
        status: 'SENT',
        document: {
          id: 'doc-7',
          name: 'Document Seven',
        },
        subcontractor: {
          id: 'sub-7',
          name: 'Seventh Subcontractor',
        },
        assigned_approvers: [],
      },
    ];

    // Mock isEmpty to return true for empty objects
    const isEmpty = require('lodash/isEmpty');
    isEmpty.mockImplementation((obj) => Object.keys(obj).length === 0);

    // Mock flag to always return true for APPROVAL_THRESHOLD
    jest.doMock('v2/helpers/flags', () =>
      jest.fn((flag) => {
        if (flag === 'DELETE_DRAFT_ORDER') return true;
        if (flag === 'APPROVAL_THRESHOLD') return true;
        return false;
      }),
    );

    // Provide at least one assigned_approvers item to ensure levels.length > 0
    entryData[1].assigned_approvers = [
      {
        approver_user_id: 1,
        status: { label: 'Approved' },
        level: 1,
      },
    ];

    renderWithTheme(<Subcontractors {...mockProps} entryData={entryData} />);

    // Should only show one order row (the non-empty one)
    expect(screen.getByText('ORDER-007')).toBeInTheDocument();
    expect(screen.getAllByText(/ORDER-/).length).toBe(1);
  });
});
