import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BulkRequestSupplierApproval from './BulkRequestSupplierApproval';

const mockUnwrap = jest.fn().mockResolvedValue({ suppliers: 3, packages: 2 });
const mockActions = {
  requestBulkShortlistApproval: jest.fn((args) => ({
    type: 'requestBulkShortlistApproval',
    ...args,
  })),
  fetchShortlistedSubcontractors: jest.fn((pid) => ({
    type: 'fetchShortlistedSubcontractors',
    pid,
  })),
};

const mockShowSnackbar = jest.fn();

let mockShortlistedSubcontractors = {};

jest.mock('hooks/context', () => ({
  useContext: () => ({ actions: mockActions }),
}));

jest.mock('react-redux', () => ({
  connect: (mapStateToProps) => (component) => {
    return (props) =>
      component({
        ...props,
        // eslint-disable-next-line no-use-before-define
        ...mapStateToProps({
          project: {
            shortlistedSubcontractors: mockShortlistedSubcontractors,
          },
        }),
      });
  },
}));

jest.mock('v2/hooks/useSnackbar', () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar }),
}));

const translations = {
  'bulk-request-supplier-approval': 'Bulk Request Supplier Approval',
  'bulk-request-approval': 'Bulk Request Approval',
  'bulk-request-approval-question':
    'Submit all suppliers in a draft status for approval?',
  'no-go-back': 'No, go back',
  yes: 'Yes',
  'bulk-approval-request-success': 'Approval request sent',
  'bulk-approval-request-error': 'Could not send the bulk approval request',
};

jest.mock('i18next', () => ({
  t: (key, opts) =>
    key === 'bulk-request-approval-detail'
      ? `This will send ${opts.suppliers} suppliers across ${opts.packages} work packages to your selected approvers.`
      : translations[key] || key,
}));

// Exposes a submit trigger so the test can drive onSubmit without the real modal.
jest.mock(
  'v2/apps/shared/components/approver-modal/approverModal',
  () =>
    function MockApproverModal({ open, onSubmit }) {
      if (!open) return null;
      return (
        <button
          type="button"
          data-testid="mock-approver-submit"
          onClick={() =>
            onSubmit({
              selectedApprovers: [{ user_id: 7, approval_level_id: 2 }],
            }).catch(() => {})
          }
        >
          submit
        </button>
      );
    },
);

describe('BulkRequestSupplierApproval', () => {
  const dispatch = jest.fn(() => ({ unwrap: mockUnwrap }));

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnwrap.mockResolvedValue({ suppliers: 3, packages: 2 });
    mockShortlistedSubcontractors = {};
  });

  it('is disabled when there are no draft suppliers', () => {
    mockShortlistedSubcontractors = {
      10: [{ id: 1, status: { label: 'Approved' } }],
      11: [{ id: 2, status: { label: 'Pending' } }],
    };

    render(<BulkRequestSupplierApproval projectId={5} dispatch={dispatch} />);

    expect(
      screen.getByTestId('bulk-request-supplier-approval-btn'),
    ).toBeDisabled();
  });

  it('counts drafts and rejection acknowledged across every package', () => {
    mockShortlistedSubcontractors = {
      10: [
        { id: 1, status: { label: 'Draft' } },
        { id: 2, status: { label: 'Approved' } },
      ],
      11: [
        { id: 3, status: { label: 'Rejection Acknowledged' } },
        { id: 4, status: null },
      ],
    };

    render(<BulkRequestSupplierApproval projectId={5} dispatch={dispatch} />);

    expect(
      screen.getByTestId('bulk-request-supplier-approval-btn'),
    ).not.toBeDisabled();
  });

  it('asks for confirmation before opening the approver modal', () => {
    mockShortlistedSubcontractors = {
      10: [
        { id: 1, status: { label: 'Draft' } },
        { id: 2, status: { label: 'Draft' } },
      ],
      11: [{ id: 3, status: { label: 'Draft' } }],
      12: [{ id: 4, status: { label: 'Approved' } }],
    };

    render(<BulkRequestSupplierApproval projectId={5} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId('bulk-request-supplier-approval-btn'));

    // Confirmation first — the approver modal must not be reachable yet.
    expect(screen.getByTestId('bulk-request-confirm-dialog')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-approver-submit')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Submit all suppliers in a draft status for approval?',
      ),
    ).toBeInTheDocument();
    // 3 drafts across 2 packages; the approved-only package is not counted.
    expect(
      screen.getByText(
        'This will send 3 suppliers across 2 work packages to your selected approvers.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('bulk-request-confirm-accept'));
    expect(screen.getByTestId('mock-approver-submit')).toBeInTheDocument();
  });

  it('closes without opening the approver modal on "No, go back"', () => {
    mockShortlistedSubcontractors = {
      10: [{ id: 1, status: { label: 'Draft' } }],
    };

    render(<BulkRequestSupplierApproval projectId={5} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId('bulk-request-supplier-approval-btn'));
    fireEvent.click(screen.getByTestId('bulk-request-confirm-cancel'));

    expect(screen.queryByTestId('mock-approver-submit')).not.toBeInTheDocument();
    expect(mockActions.requestBulkShortlistApproval).not.toHaveBeenCalled();
  });

  it('submits the selected approvers to the project-level thunk', async () => {
    mockShortlistedSubcontractors = {
      10: [{ id: 1, status: { label: 'Draft' } }],
    };

    render(<BulkRequestSupplierApproval projectId={5} dispatch={dispatch} />);

    fireEvent.click(screen.getByTestId('bulk-request-supplier-approval-btn'));
    fireEvent.click(screen.getByTestId('bulk-request-confirm-accept'));
    fireEvent.click(screen.getByTestId('mock-approver-submit'));

    await waitFor(() => {
      expect(mockActions.requestBulkShortlistApproval).toHaveBeenCalledWith({
        projectId: 5,
        selectedApprovers: [{ user_id: 7, approval_level_id: 2 }],
      });
    });

    await waitFor(() => {
      expect(mockActions.fetchShortlistedSubcontractors).toHaveBeenCalledWith(
        5,
      );
    });
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      'Approval request sent',
      'success',
    );
  });

  it('surfaces an error snackbar when the request fails', async () => {
    mockShortlistedSubcontractors = {
      10: [{ id: 1, status: { label: 'Draft' } }],
    };
    mockUnwrap.mockRejectedValue(new Error('boom'));

    render(<BulkRequestSupplierApproval projectId={5} dispatch={dispatch} />);

    fireEvent.click(screen.getByTestId('bulk-request-supplier-approval-btn'));
    fireEvent.click(screen.getByTestId('bulk-request-confirm-accept'));
    fireEvent.click(screen.getByTestId('mock-approver-submit'));

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith('boom', 'error');
    });
    expect(mockActions.fetchShortlistedSubcontractors).not.toHaveBeenCalled();
  });
});
