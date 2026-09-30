import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShortlistedSubcontractorsTable from './ShortlistedSubcontractorsTable';

const mockActions = {
  deleteShortlistedSubcontractor: jest.fn().mockResolvedValue({}),
  fetchShortlistedSubcontractors: jest.fn().mockResolvedValue({}),
  fetchShortlistApprovers: jest.fn().mockResolvedValue({}),
  approveOrRejectShortlistedSubcontractor: jest.fn().mockResolvedValue({}),
  acknowledgeRejection: jest.fn().mockResolvedValue({}),
  getProjectProcurement: jest.fn().mockResolvedValue({}),
  getShortlistedSubcontractorLogs: jest
    .fn()
    .mockResolvedValue({ payload: { logs: [] } }),
  withdrawShortlistedSubcontractorApproval: jest.fn().mockResolvedValue({}),
};

const mockBulkUpdateProjectHistory = jest.fn();

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: mockActions,
  }),
}));

jest.mock('react-redux', () => ({
  connect: (mapStateToProps) => (component) => {
    const mockState = {
      clinkAccount: { user: { id: 1 } },
      procurementSchedule: { approvers: [], fetchingApprovers: false },
    };
    return (props) => component({ ...props, ...mapStateToProps(mockState) });
  },
}));

const translations = {
  'shortlisted-subcontractors': 'Shortlisted Subcontractors',
  'shortlisted-suppliers': 'Shortlisted Subcontractors',
  'no-shortlisted-subcontractors-yet': 'No shortlisted subcontractors yet.',
  'no-shortlisted-suppliers-yet': 'No shortlisted subcontractors yet.',
  'subcontractor-name': 'Subcontractor name',
  'supplier-name': 'Subcontractor name',
  status: 'Status',
  'requested-approver': 'Requested Approver',
  actions: 'Actions',
  draft: 'Draft',
  'request-approval': 'Request Approval',
  'use-bulk-request-supplier-approval':
    'Use Bulk Request Supplier Approval to submit drafts',
  'pending-approval': 'Pending Approval',
  approve: 'Approve',
  reject: 'Reject',
  reason: 'Reason',
  withdraw: 'Withdraw',
  acknowledge: 'Acknowledge',
  'rejection-reason': 'Rejection reason',
  'remove-from-shortlist': 'Remove from shortlist',
  'remove-from-shortlist-title': 'Remove supplier from shortlist',
  'remove-from-shortlist-confirmation':
    'Remove {{name}} from the shortlisted suppliers for this work package?',
  'remove-from-shortlist-detail':
    'They will no longer appear in this work package and will not be included in Bulk Request Supplier Approval. You can shortlist them again later.',
  'yes-remove': 'Yes, remove',
  'no-go-back': 'No, go back',
  'remove-from-shortlist-success': '{{name}} removed from shortlist',
  'remove-from-shortlist-error':
    'Failed to remove supplier from shortlist. Please try again.',
};

// Resolves {{mustache}} placeholders the way i18next would, so tests can assert
// the copy a user actually sees.
const translate = (key, options) =>
  (translations[key] || key).replace(/{{(\w+)}}/g, (match, name) =>
    options && name in options ? options[name] : match,
  );

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => translate(key, options),
  }),
}));

jest.mock('i18next', () => ({
  t: (key, options) => translate(key, options),
}));

const mockShowSnackbar = jest.fn();

jest.mock('v2/hooks/useSnackbar', () => ({
  useSnackbar: () => ({
    showSnackbar: mockShowSnackbar,
  }),
}));

jest.mock(
  'v1/document-creator/components/page/header/RejectModal',
  () =>
    function MockRejectModal({ open, onReject }) {
      if (!open) return null;
      return (
        <button type="button" onClick={() => onReject('rejection reason')}>
          submit-reject
        </button>
      );
    },
);

jest.mock(
  'v2/apps/shared/components/logs-modal',
  () =>
    function MockLogsModal() {
      return null;
    },
);

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        warningYellow: '#fff3cd',
        successGreen: '#d4edda',
        errorRed: '#f8d7da',
        lightGray: '#e2e3e5',
        darkCharcoal: '#383d41',
        webOrange: '#856404',
        successDarkGreen: '#155724',
        errorDarkRed: '#721c24',
        mediumGray: '#6c757d',
        ghostWhite: '#f5f5f5',
        white: '#ffffff',
      },
    },
  },
}));

jest.mock('v2/constants/colors', () => ({
  white: '#ffffff',
  christmasSilver: '#ced4da',
  grayLight: '#e2e3e5',
  clinkRed: '#dc3545',
  whiteSmoke: '#f5f5f5',
  japaneseIndigo: '#2b3946',
  gray2: '#31323799',
}));

describe('ShortlistedSubcontractorsTable', () => {
  const mockUnwrap = jest.fn();
  const mockDispatch = jest.fn(() => ({ unwrap: mockUnwrap }));
  const defaultProps = {
    projectId: 1,
    tenderId: 1,
    dispatch: mockDispatch,
    bulkUpdateProjectHistory: mockBulkUpdateProjectHistory,
  };

  beforeEach(() => {
    mockDispatch.mockClear();
    mockShowSnackbar.mockClear();
    mockBulkUpdateProjectHistory.mockClear();
    Object.values(mockActions).forEach((action) => action.mockClear());
    mockUnwrap.mockReset();
    mockUnwrap.mockResolvedValue({});
  });

  it('renders empty state with the bulk request hint instead of a button', () => {
    render(<ShortlistedSubcontractorsTable data={[]} {...defaultProps} />);

    expect(screen.getByText('Shortlisted Subcontractors')).toBeInTheDocument();
    expect(
      screen.getByText('No shortlisted subcontractors yet.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Use Bulk Request Supplier Approval to submit drafts'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Request Approval')).not.toBeInTheDocument();
  });

  it('renders table rows and headers', () => {
    const mockData = [
      {
        id: 1,
        name: 'Test Subcontractor 1',
        status: { label: 'Approved' },
        approver_name: 'John Doe',
      },
      {
        id: 2,
        name: 'Test Subcontractor 2',
        status: { label: 'Pending' },
        approver_name: 'Jane Smith',
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    expect(screen.getByText('Subcontractor name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Requested Approver')).toBeInTheDocument();
    expect(screen.getByText('Test Subcontractor 1')).toBeInTheDocument();
    expect(screen.getByText('Test Subcontractor 2')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
  });

  it('falls back to Draft when status is missing', () => {
    const mockData = [
      {
        id: 1,
        name: 'Test Subcontractor',
        status: null,
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows dash when requested approver is missing', () => {
    const mockData = [
      {
        id: 1,
        name: 'Test Subcontractor',
        status: { label: 'Approved' },
        approver_name: null,
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders no selection checkboxes for a requester', () => {
    const mockData = [
      {
        id: 1,
        name: 'Draft Subcontractor',
        status: { label: 'Draft' },
      },
      {
        id: 2,
        name: 'Pending Subcontractor',
        status: { label: 'Pending' },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    // Neither row awaits user 1, so this package is read-only for them.
    expect(
      screen.queryByTestId('supplier-select-all-checkbox'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('supplier-checkbox-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('supplier-checkbox-2')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('supplier-request-approval-btn'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('supplier-bulk-approve-btn'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('supplier-bulk-request-hint')).toBeInTheDocument();
  });

  const approvableRow = (id, name) => ({
    id,
    name,
    status: { label: 'Pending' },
    submitted_by: { id: 2 },
    approvals: {
      level1: {
        status: 'in_progress',
        approvers: [{ id: id * 10, approver_user_id: 1, status: { label: 'Pending' } }],
      },
    },
  });

  it('gives the approver checkboxes and bulk actions instead of the hint', () => {
    const mockData = [
      approvableRow(3, 'Awaiting Me'),
      { id: 4, name: 'Draft Subcontractor', status: { label: 'Draft' } },
      {
        id: 5,
        name: 'Awaiting Someone Else',
        status: { label: 'Pending' },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [
              { id: 50, approver_user_id: 99, status: { label: 'Pending' } },
            ],
          },
        },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    // Only the row awaiting this user is selectable.
    expect(screen.getByTestId('supplier-checkbox-3')).toBeInTheDocument();
    expect(screen.queryByTestId('supplier-checkbox-4')).not.toBeInTheDocument();
    expect(screen.queryByTestId('supplier-checkbox-5')).not.toBeInTheDocument();

    expect(screen.getByTestId('supplier-select-all-checkbox')).toBeInTheDocument();
    // The approver actions replace the requester hint.
    expect(
      screen.queryByTestId('supplier-bulk-request-hint'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('supplier-bulk-approve-btn')).toBeDisabled();
    expect(screen.getByTestId('supplier-bulk-reject-btn')).toBeDisabled();
  });

  it('bulk approves every selected supplier in a single request', async () => {
    const mockData = [approvableRow(3, 'First'), approvableRow(6, 'Second')];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByTestId('supplier-select-all-checkbox'));
    expect(screen.getByTestId('supplier-bulk-approve-btn')).not.toBeDisabled();

    fireEvent.click(screen.getByTestId('supplier-bulk-approve-btn'));

    await waitFor(() => {
      expect(
        mockActions.approveOrRejectShortlistedSubcontractor,
      ).toHaveBeenCalledTimes(1);
    });

    const payload =
      mockActions.approveOrRejectShortlistedSubcontractor.mock.calls[0][0];
    expect(payload.data.status).toBe('Approved');
    expect(payload.data.approvals).toEqual([
      { approval_id: 30, shortlisted_subcontractor_id: 3 },
      { approval_id: 60, shortlisted_subcontractor_id: 6 },
    ]);
  });

  it('select-all picks up only the rows awaiting this user', () => {
    const mockData = [
      approvableRow(3, 'Mine'),
      { id: 4, name: 'Draft', status: { label: 'Draft' } },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByTestId('supplier-select-all-checkbox'));

    expect(screen.getByTestId('supplier-checkbox-3')).toBeChecked();
    expect(screen.queryByTestId('supplier-checkbox-4')).not.toBeInTheDocument();
  });

  it('attaches no tooltip to the hint while it fits', () => {
    render(<ShortlistedSubcontractorsTable data={[]} {...defaultProps} />);

    expect(screen.getByTestId('mui-tooltip')).toHaveAttribute('data-title', '');
  });

  it('attaches the full hint as a tooltip once the pill is clipped', async () => {
    const scrollWidth = jest
      .spyOn(Element.prototype, 'scrollWidth', 'get')
      .mockReturnValue(400);
    const clientWidth = jest
      .spyOn(Element.prototype, 'clientWidth', 'get')
      .mockReturnValue(120);

    render(<ShortlistedSubcontractorsTable data={[]} {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('mui-tooltip')).toHaveAttribute(
        'data-title',
        'Use Bulk Request Supplier Approval to submit drafts',
      );
    });

    scrollWidth.mockRestore();
    clientWidth.mockRestore();
  });

  it('still offers per-row approve and reject to the assigned approver', () => {
    const mockData = [
      {
        id: 3,
        name: 'Pending Subcontractor',
        status: { label: 'Pending' },
        submitted_by: { id: 2 },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [
              {
                approver_user_id: 1,
                status: { label: 'pending' },
              },
            ],
          },
        },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    expect(screen.getByTestId('supplier-approve-btn-3')).toBeInTheDocument();
    expect(screen.getByTestId('supplier-reject-btn-3')).toBeInTheDocument();
  });

  it('shows rejection reason popover for rejected by current user', async () => {
    const mockData = [
      {
        id: 1,
        name: 'Rejected Subcontractor',
        status: { label: 'Rejected' },
        approver_notes: 'Missing document',
        submitted_by: { id: 1 },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [
              {
                approver_user_id: 1,
                status: { label: 'pending' },
              },
            ],
          },
        },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    const reasonLink = screen.getByText('Reason');
    fireEvent.click(reasonLink);

    expect(await screen.findByText('Rejection reason')).toBeInTheDocument();
    expect(screen.getByText('Missing document')).toBeInTheDocument();
    expect(screen.getByText('Acknowledge')).toBeInTheDocument();
  });

  it('shows withdraw for pending and remove from shortlist for draft in the menu', async () => {
    const mockData = [
      {
        id: 1,
        name: 'Pending Subcontractor',
        status: { label: 'Pending' },
        submitted_by: { id: 1 },
      },
      {
        id: 2,
        name: 'Draft Subcontractor',
        status: { label: 'Draft' },
        submitted_by: { id: 1 },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    const actionButtons = screen.getAllByLabelText('more actions');
    fireEvent.click(actionButtons[0]);
    expect(await screen.findByText('Withdraw')).toBeInTheDocument();

    fireEvent.click(document.body);
    fireEvent.click(actionButtons[1]);
    expect(
      await screen.findByTestId('supplier-menu-remove-from-shortlist'),
    ).toHaveTextContent('Remove from shortlist');
  });

  it('offers remove from shortlist for a rejection acknowledged supplier', async () => {
    const mockData = [
      {
        id: 5,
        name: 'Acknowledged Subcontractor',
        status: { label: 'Rejection Acknowledged' },
        submitted_by: { id: 1 },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByLabelText('more actions'));

    expect(
      await screen.findByTestId('supplier-menu-remove-from-shortlist'),
    ).toBeInTheDocument();
  });

  it('hides remove from shortlist for approved suppliers and for other submitters', async () => {
    const mockData = [
      {
        id: 6,
        name: 'Approved Subcontractor',
        status: { label: 'Approved' },
        submitted_by: { id: 1 },
      },
      {
        id: 7,
        name: 'Someone Elses Draft',
        status: { label: 'Draft' },
        submitted_by: { id: 2 },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    const actionButtons = screen.getAllByLabelText('more actions');

    fireEvent.click(actionButtons[0]);
    await screen.findByTestId('supplier-actions-menu');
    expect(
      screen.queryByTestId('supplier-menu-remove-from-shortlist'),
    ).not.toBeInTheDocument();

    fireEvent.click(document.body);
    fireEvent.click(actionButtons[1]);
    await screen.findByTestId('supplier-actions-menu');
    expect(
      screen.queryByTestId('supplier-menu-remove-from-shortlist'),
    ).not.toBeInTheDocument();
  });

  const draftSubcontractor = [
    {
      id: 8,
      name: 'Draft Subcontractor',
      status: { label: 'Draft' },
      submitted_by: { id: 1 },
    },
  ];

  const openRemoveDialog = async () => {
    fireEvent.click(screen.getByLabelText('more actions'));
    fireEvent.click(
      await screen.findByTestId('supplier-menu-remove-from-shortlist'),
    );
    return screen.findByTestId('supplier-remove-dialog');
  };

  it('names the supplier in the confirmation dialog and keeps it on cancel', async () => {
    render(
      <ShortlistedSubcontractorsTable
        data={draftSubcontractor}
        {...defaultProps}
      />,
    );

    await openRemoveDialog();

    expect(
      screen.getByText('Remove supplier from shortlist'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Remove Draft Subcontractor from the shortlisted suppliers for this work package?',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('supplier-remove-cancel-btn'));

    await waitFor(() => {
      expect(
        screen.queryByTestId('supplier-remove-dialog'),
      ).not.toBeInTheDocument();
    });
    expect(mockActions.deleteShortlistedSubcontractor).not.toHaveBeenCalled();
  });

  it('removes the supplier and refetches the shortlist on confirm', async () => {
    render(
      <ShortlistedSubcontractorsTable
        data={draftSubcontractor}
        {...defaultProps}
      />,
    );

    await openRemoveDialog();
    fireEvent.click(screen.getByTestId('supplier-remove-confirm-btn'));

    await waitFor(() => {
      expect(mockActions.deleteShortlistedSubcontractor).toHaveBeenCalledWith({
        projectId: 1,
        tenderId: 1,
        shortlistedSubcontractorId: 8,
      });
    });

    await waitFor(() => {
      expect(mockActions.fetchShortlistedSubcontractors).toHaveBeenCalledWith(
        1,
      );
    });
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      'Draft Subcontractor removed from shortlist',
      'success',
    );
    await waitFor(() => {
      expect(
        screen.queryByTestId('supplier-remove-dialog'),
      ).not.toBeInTheDocument();
    });
  });

  it('surfaces an error and does not refetch when the removal fails', async () => {
    mockUnwrap.mockRejectedValue(new Error('nope'));

    render(
      <ShortlistedSubcontractorsTable
        data={draftSubcontractor}
        {...defaultProps}
      />,
    );

    await openRemoveDialog();
    fireEvent.click(screen.getByTestId('supplier-remove-confirm-btn'));

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'Failed to remove supplier from shortlist. Please try again.',
        'error',
      );
    });
    expect(mockActions.fetchShortlistedSubcontractors).not.toHaveBeenCalled();
    expect(screen.getByTestId('supplier-remove-dialog')).toBeInTheDocument();
  });

  it('triggers bulkUpdateProjectHistory and skips a duplicate procurement refresh when approving returns sids', async () => {
    const mockData = [
      {
        id: 5,
        subcontractor_id: 5,
        name: 'Approver Test Sub',
        status: { label: 'Pending' },
        submitted_by: { id: 2 },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [
              {
                id: 10,
                approver_user_id: 1,
                status: { label: 'pending' },
              },
            ],
          },
        },
      },
    ];

    mockUnwrap.mockResolvedValueOnce({ sids: [5] });

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByTestId('supplier-approve-btn-5'));

    await waitFor(() => {
      expect(mockBulkUpdateProjectHistory).toHaveBeenCalledWith(
        { supplyChain: [{ value: 5, label: 'Approver Test Sub' }] },
        null,
        1,
        true,
      );
    });

    expect(mockActions.getProjectProcurement).toHaveBeenCalledTimes(1);
  });

  it('falls back to a procurement refresh when approving returns no sids', async () => {
    const mockData = [
      {
        id: 5,
        subcontractor_id: 5,
        name: 'Approver Test Sub',
        status: { label: 'Pending' },
        submitted_by: { id: 2 },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [
              {
                id: 10,
                approver_user_id: 1,
                status: { label: 'pending' },
              },
            ],
          },
        },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByTestId('supplier-approve-btn-5'));

    await waitFor(() => {
      expect(mockActions.getProjectProcurement).toHaveBeenCalledTimes(1);
    });

    expect(mockBulkUpdateProjectHistory).not.toHaveBeenCalled();
  });

  it('maps multi-level approvals (with authority/self-approval flags) into the requested approver tooltip', () => {
    const mockData = [
      {
        id: 20,
        subcontractor_id: 20,
        name: 'Multi Level Sub',
        status: { label: 'Pending' },
        isLevel: true,
        approvals: {
          level1: {
            level: 1,
            status: 'in_progress',
            rule: 'all',
            approvers: [
              {
                id: 501,
                user: { display_name: 'John Doe', email: 'john@test.com' },
                status: { label: 'Pending' },
                is_satisfied_by_higher_authority: true,
                is_satisfied_by_self_approved: false,
                is_level_satisfied_by_higher_authority: true,
                is_level_satisfied_by_self_approved: false,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
              },
            ],
          },
        },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('maps single-level approvals (with authority/self-approval flags) into the requested approver tooltip', () => {
    const mockData = [
      {
        id: 21,
        subcontractor_id: 21,
        name: 'Single Level Sub',
        status: { label: 'Pending' },
        approvals: [
          {
            id: 601,
            user: { display_name: 'Jane Smith', email: 'jane@test.com' },
            status: { label: 'Pending' },
            is_satisfied_by_higher_authority: false,
            is_satisfied_by_self_approved: true,
            is_level_satisfied_by_higher_authority: false,
            is_level_satisfied_by_self_approved: true,
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-02T00:00:00Z',
          },
        ],
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows bulk approve/reject buttons and bulk-approves when all selected rows are pending for the current approver', async () => {
    const mockData = [
      {
        id: 1,
        subcontractor_id: 1,
        name: 'Pending One',
        status: { label: 'Pending' },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [
              { id: 11, approver_user_id: 1, status: { label: 'pending' } },
            ],
          },
        },
      },
      {
        id: 2,
        subcontractor_id: 2,
        name: 'Pending Two',
        status: { label: 'Pending' },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [
              { id: 12, approver_user_id: 1, status: { label: 'pending' } },
            ],
          },
        },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByTestId('supplier-select-all-checkbox'));

    const [approveButton] = screen.getAllByText('Approve');
    expect(approveButton).not.toBeDisabled();
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(
        mockActions.approveOrRejectShortlistedSubcontractor,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'Approved' }),
        }),
      );
    });
  });

  it('disables bulk approve/reject buttons when the selection mixes draft and pending rows', () => {
    const mockData = [
      {
        id: 1,
        name: 'Draft One',
        status: { label: 'Draft' },
      },
      {
        id: 2,
        name: 'Pending Two',
        status: { label: 'Pending' },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [
              { id: 11, approver_user_id: 1, status: { label: 'pending' } },
            ],
          },
        },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    const checkboxes = screen.getAllByTestId(/^supplier-(select-all-checkbox|checkbox-)/);
    // Select-all only grabs draft/rejection-acknowledged rows, so select the
    // pending row's own checkbox too in order to produce a mixed selection.
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[checkboxes.length - 1]);

    const [headerApproveButton] = screen.getAllByText('Approve');
    const [headerRejectButton] = screen.getAllByText('Reject');
    expect(headerApproveButton).toBeDisabled();
    expect(headerRejectButton).toBeDisabled();
  });

  it('rejects a single subcontractor from the row action and calls approve-or-reject with Rejected status', async () => {
    const mockData = [
      {
        id: 3,
        subcontractor_id: 3,
        name: 'Pending Three',
        status: { label: 'Pending' },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [
              { id: 13, approver_user_id: 1, status: { label: 'pending' } },
            ],
          },
        },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByTestId('supplier-reject-btn-3'));
    fireEvent.click(screen.getByText('submit-reject'));

    await waitFor(() => {
      expect(
        mockActions.approveOrRejectShortlistedSubcontractor,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Rejected',
            comment: 'rejection reason',
          }),
        }),
      );
    });
  });

  it('shows an error snackbar when approve-or-reject fails', async () => {
    const mockData = [
      {
        id: 4,
        subcontractor_id: 4,
        name: 'Pending Four',
        status: { label: 'Pending' },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [
              { id: 14, approver_user_id: 1, status: { label: 'pending' } },
            ],
          },
        },
      },
    ];

    mockUnwrap.mockRejectedValueOnce(new Error('boom'));

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByTestId('supplier-approve-btn-4'));

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith('boom', 'error');
    });
  });

  it('withdraws a pending subcontractor from the menu and refreshes procurement on success', async () => {
    const mockData = [
      {
        id: 8,
        name: 'Pending Sub',
        status: { label: 'Pending' },
        submitted_by: { id: 1 },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByLabelText('more actions'));
    fireEvent.click(await screen.findByText('Withdraw'));

    await waitFor(() => {
      expect(
        mockActions.withdrawShortlistedSubcontractorApproval,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ shortlistedSubcontractorId: 8 }),
      );
    });

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'supplier-withdraw-success',
        'success',
      );
    });
  });

  it('shows an error snackbar when withdrawal fails', async () => {
    const mockData = [
      {
        id: 9,
        name: 'Pending Sub',
        status: { label: 'Pending' },
        submitted_by: { id: 1 },
      },
    ];

    mockUnwrap.mockRejectedValueOnce(new Error('withdraw failed'));

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByLabelText('more actions'));
    fireEvent.click(await screen.findByText('Withdraw'));

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith('withdraw failed', 'error');
    });
  });

  it('fetches logs when view logs is clicked from the menu', async () => {
    const mockData = [
      {
        id: 13,
        name: 'Any Sub',
        status: { label: 'Pending' },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByLabelText('more actions'));
    fireEvent.click(await screen.findByText('view-logs'));

    await waitFor(() => {
      expect(mockActions.getShortlistedSubcontractorLogs).toHaveBeenCalledWith(
        expect.objectContaining({ shortlistedSubcontractorId: 13 }),
      );
    });
  });

  it('shows an error snackbar when fetching logs fails', async () => {
    const mockData = [
      {
        id: 14,
        name: 'Any Sub',
        status: { label: 'Pending' },
      },
    ];

    mockUnwrap.mockRejectedValueOnce(new Error('logs failed'));

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByLabelText('more actions'));
    fireEvent.click(await screen.findByText('view-logs'));

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith('logs failed', 'error');
    });
  });

  it('expands and collapses the approval panel row via the expand icon for a non-draft row', () => {
    const mockData = [
      {
        id: 15,
        subcontractor_id: 15,
        name: 'Approved Sub',
        status: { label: 'Approved' },
        approvals: [
          {
            id: 700,
            user: { display_name: 'Ann Approver', email: 'ann@test.com' },
            status: { label: 'Approved' },
          },
        ],
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    expect(screen.getByTestId('keyboard-arrow-down-icon')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('keyboard-arrow-down-icon'));
    expect(screen.getByTestId('KeyboardArrowUpIcon')).toBeInTheDocument();
  });

  it('hides the expand icon for draft rows', () => {
    const mockData = [
      {
        id: 16,
        name: 'Draft Sub',
        status: { label: 'Draft' },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    expect(
      screen.queryByTestId('keyboard-arrow-down-icon'),
    ).not.toBeInTheDocument();
  });

  it('opens the rejection info popover via the info icon and acknowledges from it', async () => {
    const mockData = [
      {
        id: 17,
        name: 'Rejected Sub',
        status: { label: 'Rejected' },
        submitted_by: { id: 2 },
        isLevel: true,
        approvals: {
          level1: {
            status: 'rejected',
            approvers: [
              {
                status: { label: 'Rejected' },
                comment: 'Level rejection comment',
              },
            ],
          },
        },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByTestId('mui-icon-InfoOutlined'));

    expect(
      await screen.findByText('Level rejection comment'),
    ).toBeInTheDocument();
  });

  it('acknowledges a rejection and refreshes procurement on success', async () => {
    const mockData = [
      {
        id: 18,
        name: 'Rejected Sub',
        status: { label: 'Rejected' },
        approver_notes: 'Missing document',
        submitted_by: { id: 1 },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [{ approver_user_id: 1, status: { label: 'pending' } }],
          },
        },
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByText('Reason'));
    fireEvent.click(await screen.findByText('Acknowledge'));

    await waitFor(() => {
      expect(mockActions.acknowledgeRejection).toHaveBeenCalledWith(
        expect.objectContaining({ shortlistedSubcontractorId: 18 }),
      );
    });

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'rejection-acknowledged-success',
        'success',
      );
    });
  });

  it('shows an error snackbar when acknowledging a rejection fails', async () => {
    const mockData = [
      {
        id: 19,
        name: 'Rejected Sub',
        status: { label: 'Rejected' },
        approver_notes: 'Missing document',
        submitted_by: { id: 1 },
        approvals: {
          level1: {
            status: 'in_progress',
            approvers: [{ approver_user_id: 1, status: { label: 'pending' } }],
          },
        },
      },
    ];

    mockUnwrap.mockRejectedValueOnce(new Error('acknowledge failed'));

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    fireEvent.click(screen.getByText('Reason'));
    fireEvent.click(await screen.findByText('Acknowledge'));

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        'acknowledge failed',
        'error',
      );
    });
  });

  it('treats a flat (non-grouped) approval entry as an approver match for the current user', () => {
    const mockData = [
      {
        id: 20,
        name: 'Flat Approval Sub',
        status: { label: 'Pending' },
        approvals: [{ approver_user_id: 1, status: { label: 'pending' } }],
      },
    ];

    render(
      <ShortlistedSubcontractorsTable data={mockData} {...defaultProps} />,
    );

    expect(screen.getByTestId('supplier-approve-btn-20')).toBeInTheDocument();
  });
});
