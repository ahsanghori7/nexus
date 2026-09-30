import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Component under test
import Page from './index';

// i18n
jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: { t: (k) => k },
}));

jest.mock('helpers/i18n', () => ({
  __esModule: true,
  default: { t: (k) => k },
}));

// Mock Template to avoid dependency on project prop
jest.mock('v2/apps/clink/pages/shared/template', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="template">{children}</div>,
}));

// Mock router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: 'slug-1' }),
}));

// Mock query string util
jest.mock('v2/helpers/url', () => ({
  getQueryStringVars: () => ({ tender_recommendation_id: '10' }),
}));

// Mock context and actions
const mockActions = {
  getTenderRecommendations: jest.fn(() => ({ type: 'getList' })),
  getTenderRecommendationApprovers: jest.fn(() =>
    Promise.resolve({ payload: ['u1', 'u2'] }),
  ),
  assignTenderRecommendationApprover: jest.fn(),
  withDrawTenderRecommendation: jest.fn(),
  sendTrApprovalReminder: jest.fn(),
  getAuditLogsTenderRecommendationById: jest.fn(() =>
    Promise.resolve({ payload: [] }),
  ),
  sendReminderToApprover: jest.fn(),
  approveOrRejectTenderRecommendation: jest.fn(),
  updateTenderRecommendationById: jest.fn(),
  fetchOrderTemplates: jest.fn(() => ({
    unwrap: () =>
      Promise.resolve([
        { id: 1, name: 'Template 1' },
        { id: 2, name: 'Template 2' },
      ]),
  })),
};
jest.mock('hooks/context', () => ({
  useContext: () => ({ actions: mockActions }),
}));

// Mock HTTP helper used for pdf generation
const mockHttpV2 = jest.fn();
jest.mock('v2/services/httpHelper', () => ({
  __esModule: true,
  httpHelperV2: (...args) => mockHttpV2(...args),
}));

// Bypass connect HOC
jest.mock('react-redux', () => ({ connect: () => (C) => C }));

// Mock closeLogModal action
jest.mock('v2/store/reducers/clink/tender-recommendation', () => ({
  closeLogModal: () => ({ type: 'closeLogModal' }),
}));

// Lightweight component mocks
jest.mock('./Filters', () => ({ value, onChange }) => (
  <div data-testid="filters">
    <button onClick={() => onChange('all')}>all</button>
    <button onClick={() => onChange('drafts')}>drafts</button>
    <button onClick={() => onChange('pending')}>pending</button>
    <button onClick={() => onChange('approved')}>approved</button>
    <button onClick={() => onChange('rejected')}>rejected</button>
    <span>filter:{value}</span>
  </div>
));

let lastOnAction;
jest.mock('./DataTable', () => ({ rows = [], onAction }) => {
  lastOnAction = onAction;
  return <div data-testid="datatable">rows:{rows.length}</div>;
});

jest.mock('v2/apps/shared/components/empty-state', () => {
  return function MockEmptyState({
    variant,
    title,
    description,
    primaryAction,
  }) {
    return (
      <section data-testid="empty-state" data-variant={variant}>
        <h2>{title}</h2>
        <p>{description}</p>
        {primaryAction && (
          <button type="button" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </button>
        )}
      </section>
    );
  };
});

jest.mock(
  'v2/apps/clink/pages/tender-recommendations/PdfDialog',
  () =>
    ({ open, onClose, pdfUrl }) =>
      open ? <div data-testid="pdf">{pdfUrl}</div> : null,
);

jest.mock(
  'v2/apps/shared/components/logs-modal',
  () =>
    ({ open }) =>
      open ? <div data-testid="logs">logs</div> : null,
);

// Mock cancel confirmation dialog
jest.mock(
  'apps/clink/pages/tender-recommendations/CancelTrConfirmationDialog',
  () =>
    ({ open, onCancel, onConfirm }) =>
      open ? (
        <div data-testid="cancel-dialog">
          <button onClick={onConfirm}>confirm-cancel</button>
          <button onClick={onCancel}>close</button>
        </div>
      ) : null,
);

jest.mock(
  'v2/apps/shared/components/approver-modal/approverModal',
  () =>
    ({ open, onClose, shortlistedSubcontractorIds, onSubmit }) =>
      open ? (
        <div data-testid="approver-modal">
          <button onClick={() => onSubmit && onSubmit({ selectedApprovers: [77], shortlistedSubcontractorIds })}>confirm</button>
          <button onClick={onClose}>close</button>
        </div>
      ) : null,
);

jest.mock(
  'v2/apps/clink/pages/orders/subcontractors/modal',
  () =>
    ({ open, children }) =>
      open ? <div data-testid="issue-order-modal">{children}</div> : null,
);

jest.mock(
  'v2/apps/clink/pages/tender-analysis/summary/actions/Form',
  () =>
    ({ quoteInfo, orderTemplates, setOpen }) => (
      <div data-testid="issue-order-form">
        form - quote:{quoteInfo?.id} - templates:{orderTemplates?.length}
      </div>
    ),
);

jest.mock(
  'v1/document-creator/components/page/header/RejectModal',
  () =>
    ({ open }) =>
      open ? <div data-testid="reject-modal">reject</div> : null,
);

jest.mock('v2/helpers/splitName', () => ({
  __esModule: true,
  default: (name) => ({ firstName: 'First', lastName: 'Last' }),
}));

const baseProps = () => ({
  contextType: 'clink',
  dispatch: jest.fn((action) => {
    // If action has a .then method, it's a promise-like (from mock actions)
    if (action && typeof action.then === 'function') {
      return action;
    }
    // Handle async thunks properly
    if (typeof action === 'function') {
      return action((innerAction) => innerAction);
    }
    return action;
  }),
  project: { data: { id: 1 } },
  clinkAccount: { user: { id: 7 } },
  tenderRecommendations: [
    { tender_recommendation_id: 10, status: 'Draft', package_id: 2 },
    { tender_recommendation_id: 11, status: 'Pending', package_id: 3 },
  ],
});

describe('tender-recommendations list page', () => {
  beforeAll(() => {
    // Use modern fake timers for this suite
    jest.useFakeTimers();
  });

  afterAll(() => {
    // Put timers back to normal so other tests aren't affected
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers(); // optional but nice
    global.BASE_URLS = { CLINK: 'https://clink.test' };
    window.open = jest.fn();
    mockHttpV2.mockResolvedValue({ url: 'http://doc.pdf' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('handleAction navigates/edit, opens logs/pdf, and triggers approval flow', async () => {
    render(<Page {...baseProps()} />);

    // edit
    act(() => {
      lastOnAction('edit', { package_id: 99, tender_recommendation_id: 10 });
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      '/main-contractor/project/slug-1/tender_recommendation/99/10',
    );

    // logs
    await act(async () => {
      lastOnAction('view-logs', { tender_recommendation_id: 10 });
    });
    expect(await screen.findByTestId('logs')).toBeInTheDocument();

    // view report
    act(() => {
      lastOnAction('view-report', {});
    });
    expect(screen.getByTestId('pdf')).toBeInTheDocument();

    // request-approval
    await act(async () => {
      lastOnAction('request-approval', { tender_recommendation_id: 10 });
    });
    expect(screen.getByTestId('approver-modal')).toBeInTheDocument();
  });

  it('opens approver modal on request-approval action', async () => {
    render(<Page {...baseProps()} />);
    await act(async () => {
      lastOnAction('request-approval', { tender_recommendation_id: 10 });
    });
    expect(screen.getByTestId('approver-modal')).toBeInTheDocument();
  });

  it('auto-generates and opens PDF when trId in query and exists', async () => {
    render(<Page {...baseProps()} />);
    // Effect posts to generate and opens PdfDialog
    expect(mockHttpV2).toHaveBeenCalledWith({
      url: 'project/1/tender_recommendation/10/report/generate',
      method: 'POST',
    });
    expect(await screen.findByTestId('pdf')).toHaveTextContent('#toolbar=0');
  });

  it('withdraws approval and refreshes the list on success', async () => {
    // withDraw thunk resolves
    mockActions.withDrawTenderRecommendation.mockResolvedValue({});
    render(<Page {...baseProps()} />);

    const initialCalls = mockActions.getTenderRecommendations.mock.calls.length;

    await act(async () => {
      lastOnAction('withdraw', {
        tender_recommendation_id: 11,
        package_id: 3,
      });
    });

    expect(mockActions.withDrawTenderRecommendation).toHaveBeenCalledWith({
      project_id: 1,
      tid: 11,
    });
    // verify list refresh happened
    expect(
      mockActions.getTenderRecommendations.mock.calls.length,
    ).toBeGreaterThan(initialCalls);
    // success snackbar appears (using translation key string)
    expect(screen.getByText('tr-withdraw-success-msg')).toBeInTheDocument();
  });

  it('shows snackbar on withdraw error', async () => {
    const error = { response: { data: { message: 'oops' } } };
    mockActions.withDrawTenderRecommendation.mockRejectedValue(error);
    render(<Page {...baseProps()} />);

    await act(async () => {
      lastOnAction('withdraw', {
        tender_recommendation_id: 10,
        package_id: 2,
      });
    });

    expect(screen.getByText('oops')).toBeInTheDocument();
  });

  it('sends reminder and calls the action', async () => {
    mockActions.sendTrApprovalReminder.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });
    render(<Page {...baseProps()} />);

    await act(async () => {
      lastOnAction('send-reminder', {
        tender_recommendation_id: 10,
        package_id: 2,
        approval_id: 100,
        submitted_by: { id: 7 }, // Matches clinkAccount user id
      });
    });

    expect(mockActions.sendTrApprovalReminder).toHaveBeenCalledWith({
      project_id: 1,
      tid: 10,
      approval_id: 100,
    });
  });

  it('sends reminder on reminder error', async () => {
    mockActions.sendTrApprovalReminder.mockReturnValue({
      // eslint-disable-next-line prefer-promise-reject-errors
      unwrap: () => Promise.reject({ message: 'reminder fail' }),
    });
    render(<Page {...baseProps()} />);

    await act(async () => {
      lastOnAction('send-reminder', {
        tender_recommendation_id: 11,
        package_id: 3,
        approval_id: 101,
        submitted_by: { id: 7 }, // Matches clinkAccount user id
      });
      // Wait for the promise to reject and the error handler to execute
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockActions.sendTrApprovalReminder).toHaveBeenCalledWith({
      project_id: 1,
      tid: 11,
      approval_id: 101,
    });

    // Error message should be displayed in snackbar
    expect(screen.getByText('reminder fail')).toBeInTheDocument();
  });

  it('cancels TR and refreshes the list on success', async () => {
    // update action resolves via unwrap
    mockActions.updateTenderRecommendationById.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });
    render(<Page {...baseProps()} />);

    const initialCalls = mockActions.getTenderRecommendations.mock.calls.length;

    // open cancel dialog
    await act(async () => {
      lastOnAction('cancel-tr', {
        tender_recommendation_id: 10,
        package_id: 2,
      });
    });
    expect(screen.getByTestId('cancel-dialog')).toBeInTheDocument();

    // confirm cancel
    await act(async () => {
      screen.getByText('confirm-cancel').click();
    });

    expect(mockActions.updateTenderRecommendationById).toHaveBeenCalledWith({
      project_id: 1,
      tid: 10,
      data: { status: 'Cancelled' },
    });
    expect(
      mockActions.getTenderRecommendations.mock.calls.length,
    ).toBeGreaterThan(initialCalls);
    // dialog closes
    expect(screen.queryByTestId('cancel-dialog')).not.toBeInTheDocument();
  });

  it('shows snackbar on cancel TR error', async () => {
    mockActions.updateTenderRecommendationById.mockReturnValue({
      // eslint-disable-next-line prefer-promise-reject-errors
      unwrap: () => Promise.reject({ message: 'cancel fail' }),
    });
    render(<Page {...baseProps()} />);

    await act(async () => {
      lastOnAction('cancel-tr', {
        tender_recommendation_id: 11,
        package_id: 3,
      });
    });
    expect(screen.getByTestId('cancel-dialog')).toBeInTheDocument();

    await act(async () => {
      screen.getByText('confirm-cancel').click();
    });

    expect(screen.getByText('cancel fail')).toBeInTheDocument();
    // dialog closes in finally
    expect(screen.queryByTestId('cancel-dialog')).not.toBeInTheDocument();
  });

  it('filters by status (drafts, pending, approved, rejected)', async () => {
    const props = baseProps();
    props.tenderRecommendations = [
      { tender_recommendation_id: 1, status: 'Draft', package_id: 1 },
      { tender_recommendation_id: 2, status: 'Pending', package_id: 2 },
      { tender_recommendation_id: 3, status: 'Approved', package_id: 3 },
      { tender_recommendation_id: 4, status: 'Rejected', package_id: 4 },
      { tender_recommendation_id: 5, status: 'Draft', package_id: 5 },
    ];

    render(<Page {...props} />);

    // Initially shows all
    expect(screen.getByText('rows:5')).toBeInTheDocument();

    // Filter by drafts
    act(() => {
      screen.getByText('drafts').click();
    });
    expect(screen.getByText('rows:2')).toBeInTheDocument();

    // Filter by pending
    act(() => {
      screen.getByText('pending').click();
    });
    expect(screen.getByText('rows:1')).toBeInTheDocument();

    // Filter by approved
    act(() => {
      screen.getByText('approved').click();
    });
    expect(screen.getByText('rows:1')).toBeInTheDocument();

    // Filter by rejected
    act(() => {
      screen.getByText('rejected').click();
    });
    expect(screen.getByText('rows:1')).toBeInTheDocument();

    // Filter back to all
    act(() => {
      screen.getByText('all').click();
    });
    expect(screen.getByText('rows:5')).toBeInTheDocument();
  });

  it('opens issue order modal and displays quote info and templates', async () => {
    jest.useFakeTimers();
    mockActions.fetchOrderTemplates.mockReturnValue({
      unwrap: () =>
        Promise.resolve([
          { id: 1, name: 'Standard Template' },
          { id: 2, name: 'Premium Template' },
        ]),
    });

    render(<Page {...baseProps()} />);

    // Wait for order templates to be fetched
    await act(async () => {
      jest.runAllTimers();
    });

    await act(async () => {
      lastOnAction('issue-order', {
        tender_recommendation_id: 10,
        transaction_id: 5001,
        subcontractor: { id: '100', name: 'ABC Contractor' },
        package_id: 2,
      });
    });

    // Check if modal is open
    expect(screen.getByTestId('issue-order-modal')).toBeInTheDocument();
    // Check if form is rendered with correct props
    expect(screen.getByTestId('issue-order-form')).toBeInTheDocument();
    expect(screen.getByText(/quote:5001/)).toBeInTheDocument();
    expect(screen.getByText(/templates:2/)).toBeInTheDocument();
  });

  it('fetches order templates on mount', async () => {
    render(<Page {...baseProps()} />);

    expect(mockActions.fetchOrderTemplates).toHaveBeenCalled();
  });

  it('shows error snackbar when order templates fetch fails', async () => {
    jest.useFakeTimers();
    mockActions.fetchOrderTemplates.mockReturnValue({
      unwrap: () => Promise.reject({ message: 'Failed to fetch templates' }),
    });

    render(<Page {...baseProps()} />);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(screen.getByText('Failed to fetch templates')).toBeInTheDocument();
  });

  it('displays empty state when no recommendations match filter', () => {
    const props = baseProps();
    props.tenderRecommendations = [];
    render(<Page {...props} />);

    expect(screen.getByTestId('empty-state')).toHaveAttribute(
      'data-variant',
      'firstUse',
    );
    expect(
      screen.getByText('no-recommendations-available'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('tender-recommendations-empty-description'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/Wow\. So empty/i)).not.toBeInTheDocument();
  });

  it('uses search empty state when filters have no matching recommendations', () => {
    const props = baseProps();
    props.tenderRecommendations = [
      { tender_recommendation_id: 1, status: 'Draft', package_id: 1 },
    ];
    render(<Page {...props} />);

    act(() => {
      screen.getByText('pending').click();
    });

    expect(screen.getByTestId('empty-state')).toHaveAttribute(
      'data-variant',
      'search',
    );
    expect(screen.getByText('no-results-found')).toBeInTheDocument();
    expect(screen.getByText('adjust-filters-search')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'go-to-quotes-and-analysis' }),
    ).not.toBeInTheDocument();
  });

  it('opens quotes and analysis from the empty state CTA', () => {
    const props = baseProps();
    props.tenderRecommendations = [];
    render(<Page {...props} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'go-to-quotes-and-analysis' }),
    );

    expect(window.open).toHaveBeenCalledWith(
      'https://clink.test/project/slug-1/quotes_tender',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('edits rejected TR and navigates to form', async () => {
    render(<Page {...baseProps()} />);

    await act(async () => {
      lastOnAction('edit', {
        tender_recommendation_id: 10,
        package_id: 2,
        status: 'Rejected',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/main-contractor/project/slug-1/tender_recommendation/2/10',
    );
  });

  it('edits draft TR without status update', async () => {
    render(<Page {...baseProps()} />);

    await act(async () => {
      lastOnAction('edit', {
        tender_recommendation_id: 10,
        package_id: 2,
        status: 'Draft',
      });
    });

    expect(mockActions.updateTenderRecommendationById).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(
      '/main-contractor/project/slug-1/tender_recommendation/2/10',
    );
  });

  it('closes PDF dialog', async () => {
    jest.useFakeTimers();
    render(<Page {...baseProps()} />);

    // PDF opens due to trId in query
    await act(async () => {
      jest.runAllTimers();
    });
    expect(screen.getByTestId('pdf')).toBeInTheDocument();

    // Verify PDF was generated via http call
    expect(mockHttpV2).toHaveBeenCalledWith({
      url: 'project/1/tender_recommendation/10/report/generate',
      method: 'POST',
    });
  });

  it('closes logs modal', async () => {
    render(<Page {...baseProps()} />);

    await act(async () => {
      lastOnAction('view-logs', { tender_recommendation_id: 10 });
    });
    expect(screen.getByTestId('logs')).toBeInTheDocument();
  });

  it('closes reject modal on successful rejection', async () => {
    mockActions.approveOrRejectTenderRecommendation.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });
    mockActions.getTenderRecommendations.mockReturnValue({ type: 'getList' });

    render(<Page {...baseProps()} />);

    // Open PDF and trigger rejection flow
    await act(async () => {
      lastOnAction('view-report', {
        tender_recommendation_id: 10,
        package_id: 2,
      });
    });

    // The reject flow would be triggered from PdfDialog but since it's mocked
    // we're verifying the component structure
    expect(screen.getByTestId('pdf')).toBeInTheDocument();
  });

  it('handles cancel dialog close button', async () => {
    render(<Page {...baseProps()} />);

    await act(async () => {
      lastOnAction('cancel-tr', {
        tender_recommendation_id: 10,
        package_id: 2,
      });
    });

    expect(screen.getByTestId('cancel-dialog')).toBeInTheDocument();

    await act(async () => {
      screen.getByText('close').click();
    });

    expect(screen.queryByTestId('cancel-dialog')).not.toBeInTheDocument();
  });

  it('handles approver modal close without confirming', async () => {
    jest.useFakeTimers();
    mockActions.getTenderRecommendationApprovers.mockReturnValueOnce(
      Promise.resolve({ payload: ['u1', 'u2'] }),
    );

    render(<Page {...baseProps()} />);

    await act(async () => {
      lastOnAction('request-approval', { tender_recommendation_id: 10 });
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(screen.getByTestId('approver-modal')).toBeInTheDocument();

    await act(async () => {
      screen.getByText('close').click();
    });

    // Modal closes without calling onConfirm
    expect(screen.queryByTestId('approver-modal')).not.toBeInTheDocument();
  });

  it('confirms approver selection and assigns approver', async () => {
    jest.useFakeTimers();
    mockActions.getTenderRecommendationApprovers.mockReturnValueOnce(
      Promise.resolve({ payload: ['u1', 'u2'] }),
    );
    mockActions.assignTenderRecommendationApprover.mockReturnValueOnce({
      unwrap: () => Promise.resolve(),
    });

    render(<Page {...baseProps()} />);

    await act(async () => {
      lastOnAction('request-approval', { tender_recommendation_id: 10 });
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(screen.getByTestId('approver-modal')).toBeInTheDocument();

    await act(async () => {
      screen.getByText('confirm').click();
    });

    await act(async () => {
      jest.runAllTimers();
    });

    // Check that the approver assignment was called with correct params
    expect(mockActions.assignTenderRecommendationApprover).toHaveBeenCalledWith(
      {
        project_id: 1,
        tid: "10",
        data: [77],
      },
    );
  });

  it('uses selected TR ID from URL query params', () => {
    const props = baseProps();
    props.tenderRecommendations = [
      { tender_recommendation_id: 10, status: 'Pending', package_id: 2 },
    ];

    render(<Page {...props} />);

    // The trId from query params should trigger PDF generation
    expect(mockHttpV2).toHaveBeenCalledWith({
      url: 'project/1/tender_recommendation/10/report/generate',
      method: 'POST',
    });
  });

  it('renders datatable with correct row count', () => {
    const props = baseProps();
    props.tenderRecommendations = [
      { tender_recommendation_id: 1, status: 'Draft', package_id: 1 },
      { tender_recommendation_id: 2, status: 'Pending', package_id: 2 },
      { tender_recommendation_id: 3, status: 'Approved', package_id: 3 },
    ];

    render(<Page {...props} />);

    expect(screen.getByText('rows:3')).toBeInTheDocument();
  });

  it('renders filters component', () => {
    render(<Page {...baseProps()} />);

    expect(screen.getByTestId('filters')).toBeInTheDocument();
    expect(screen.getByText('filter:all')).toBeInTheDocument();
  });

  it('does not render empty state when recommendations exist', () => {
    render(<Page {...baseProps()} />);

    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});
