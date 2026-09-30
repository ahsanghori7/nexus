import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import * as ReactRedux from 'react-redux';
import configureStore from 'redux-mock-store';
import { useContext } from 'hooks/context';
import flag from 'v2/helpers/flags';

const { Provider } = ReactRedux;

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: { t: jest.fn((key) => key) },
}));

jest.mock('v2/helpers/flags', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ tenderId: '456' }),
}));

jest.mock('./ProgressBar', () => () => <div data-testid="progress-bar-mock" />);
jest.mock('./SendButton', () => ({ children }) => <button type="button">{children}</button>);

let rejectedOrdersPanelProps;
jest.mock('./RejectedOrdersPanel', () => (props) => {
  rejectedOrdersPanelProps = props;
  return <div data-testid="rejected-orders-panel-mock" />;
});
jest.mock('v2/apps/shared/components/demo-button', () => () => null);
jest.mock('v2/apps/shared/components/approver-modal/approverModal', () => () => null);
jest.mock('v2/apps/clink/pages/tender-inquiry/RejectionFeedbackCard', () => () => null);

let rejectModalProps;
jest.mock('./RejectModal', () => (props) => {
  rejectModalProps = props;
  return props.open ? <div data-testid="reject-modal-mock" /> : null;
});

// eslint-disable-next-line import/first
import Header from './index';

describe('Header (Document Creator) - Tender Enquiry approve/reject', () => {
  const mockStore = configureStore([]);
  const store = mockStore({
    project: { data: { id: 1, slug: 'test-project' } },
  });

  let mockDispatch;
  let mockActions;

  const renderHeader = (props = {}) => {
    return render(
      <Provider store={store}>
        <Header
          actionButtons
          showForm
          canSend
          docType="tender"
          did="789"
          info={{ user: { id: 10 } }}
          approversList={[{ id: 1 }]}
          assignedApprovers={[]}
          assignedApproversRaw={null}
          meta={{}}
          handleApprovalRequest={jest.fn()}
          handleApproveOrRejectOrder={jest.fn()}
          handleRejectionAcknowledge={jest.fn()}
          initPage={jest.fn()}
          {...props}
        />
      </Provider>,
    );
  };

  beforeEach(() => {
    rejectModalProps = undefined;
    rejectedOrdersPanelProps = undefined;
    flag.mockReturnValue(true);

    mockDispatch = jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue({ success: true }),
    }));

    mockActions = {
      approveRejectInquiry: jest.fn((payload) => ({
        type: 'mock/approveRejectInquiry',
        payload,
      })),
      assignTenderInquiryApprover: jest.fn(() => ({
        type: 'mock/assignTenderInquiryApprover',
      })),
      acknowledgeRejectionFeedback: jest.fn(() => ({
        type: 'mock/acknowledgeRejectionFeedback',
      })),
    };

    useContext.mockReturnValue({ actions: mockActions });

    jest.spyOn(ReactRedux, 'useDispatch').mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not show the Approve/Reject buttons when there is no matching pending approver on the active level', () => {
    renderHeader({
      assignedApprovers: [
        { id: 5, user_id: 10, status: { label: 'Pending' }, levelStatus: 'rejected' },
      ],
    });

    expect(
      screen.queryByTestId('document-creator-approve-order-btn'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('document-creator-reject-order-btn'),
    ).not.toBeInTheDocument();
  });

  it('shows separate Approve and Reject buttons when the current user has a pending approval on the in_progress level', () => {
    renderHeader({
      assignedApprovers: [
        { id: 5, user_id: 10, status: { label: 'Pending' }, levelStatus: 'in_progress' },
        { id: 6, user_id: 99, status: { label: 'Rejected' }, levelStatus: 'completed' },
      ],
    });

    expect(
      screen.getByTestId('document-creator-approve-order-btn'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('document-creator-reject-order-btn'),
    ).toBeInTheDocument();
  });

  it('clicking Approve submits the decision directly, using the matched approver record\'s own id, without opening a dialog', async () => {
    renderHeader({
      assignedApprovers: [
        { id: 5, user_id: 10, status: { label: 'Pending' }, levelStatus: 'in_progress' },
        { id: 6, user_id: 99, status: { label: 'Rejected' }, levelStatus: 'completed' },
      ],
    });

    fireEvent.click(screen.getByTestId('document-creator-approve-order-btn'));

    await waitFor(() =>
      expect(mockActions.approveRejectInquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          approver_id: 5,
          data: expect.objectContaining({ status: 'Approved' }),
        }),
      ),
    );

    expect(screen.queryByTestId('reject-modal-mock')).not.toBeInTheDocument();
  });

  it('clicking Reject opens the RejectModal, and confirming submits the rejection with the matched approver\'s own id', async () => {
    renderHeader({
      assignedApprovers: [
        { id: 5, user_id: 10, status: { label: 'Pending' }, levelStatus: 'in_progress' },
        { id: 6, user_id: 99, status: { label: 'Rejected' }, levelStatus: 'completed' },
      ],
    });

    fireEvent.click(screen.getByTestId('document-creator-reject-order-btn'));

    expect(screen.getByTestId('reject-modal-mock')).toBeInTheDocument();
    expect(rejectModalProps).toBeDefined();
    expect(rejectModalProps.docType).toBe('tender');

    await rejectModalProps.onReject('needs rework');

    await waitFor(() =>
      expect(mockActions.approveRejectInquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          approver_id: 5,
          data: expect.objectContaining({
            status: 'Rejected',
            comment: 'needs rework',
          }),
        }),
      ),
    );
  });

  it('uses tender-specific copy for the RejectModal fields when docType is tender', () => {
    renderHeader();

    expect(rejectModalProps.fields).toEqual(
      expect.objectContaining({ title: 'reject_tender_title' }),
    );
  });

  it('shows an error snackbar and resets the loading state when the approve/reject dispatch rejects', async () => {
    mockDispatch.mockReturnValueOnce({
      unwrap: jest.fn().mockRejectedValue(new Error('network error')),
    });

    renderHeader({
      assignedApprovers: [
        { id: 5, user_id: 10, status: { label: 'Pending' }, levelStatus: 'in_progress' },
      ],
    });

    fireEvent.click(screen.getByTestId('document-creator-approve-order-btn'));

    expect(
      await screen.findByText('Something went wrong ! Please try again.'),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByTestId('document-creator-approve-order-btn')).not.toBeDisabled(),
    );
  });

  it('wires the RejectedOrdersPanel to docType, and acknowledging a tender rejection reloads the page and marks it acknowledged', async () => {
    const handleRejectionAcknowledge = jest.fn().mockResolvedValue({ success: true });
    const initPage = jest.fn();

    renderHeader({
      handleRejectionAcknowledge,
      initPage,
      assignedApprovers: [
        {
          id: 1,
          user_id: 99,
          requester_user_id: 10,
          status: { label: 'Rejected' },
          comment: 'not good enough',
          updated_at: '2024-01-01',
        },
      ],
    });

    expect(screen.getByTestId('rejected-orders-panel-mock')).toBeInTheDocument();
    expect(rejectedOrdersPanelProps.docType).toBe('tender');

    await act(async () => {
      await rejectedOrdersPanelProps.onAcknowledge();
    });

    expect(handleRejectionAcknowledge).toHaveBeenCalledWith('789');
    expect(initPage).toHaveBeenCalled();
    expect(
      await screen.findByText('rejection-acknowledged-success'),
    ).toBeInTheDocument();
  });
});

describe('Header (Document Creator) - Order approve/reject', () => {
  const mockStore = configureStore([]);
  const store = mockStore({
    project: { data: { id: 1, slug: 'test-project' } },
  });

  let mockDispatch;
  let mockActions;

  const renderHeader = (props = {}) => {
    return render(
      <Provider store={store}>
        <Header
          actionButtons
          showForm
          canSend
          docType="order"
          did="789"
          info={{ user: { id: 10 } }}
          approversList={[{ id: 1 }]}
          assignedApprovers={[]}
          assignedApproversRaw={null}
          meta={{}}
          handleApprovalRequest={jest.fn()}
          handleApproveOrRejectOrder={jest.fn()}
          handleRejectionAcknowledge={jest.fn()}
          initPage={jest.fn()}
          {...props}
        />
      </Provider>,
    );
  };

  const pendingApprover = {
    id: 7,
    approver_user_id: 10,
    status: { label: 'Pending' },
    level: 1,
  };

  beforeEach(() => {
    rejectModalProps = undefined;
    flag.mockReturnValue(true);

    mockDispatch = jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue({ success: true }),
    }));

    mockActions = {
      approveRejectInquiry: jest.fn(() => ({
        type: 'mock/approveRejectInquiry',
      })),
      assignTenderInquiryApprover: jest.fn(() => ({
        type: 'mock/assignTenderInquiryApprover',
      })),
      acknowledgeRejectionFeedback: jest.fn(() => ({
        type: 'mock/acknowledgeRejectionFeedback',
      })),
    };

    useContext.mockReturnValue({ actions: mockActions });

    jest.spyOn(ReactRedux, 'useDispatch').mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('clicking Approve calls handleApproveOrRejectOrder with the matched approver id, not the tender action', async () => {
    const handleApproveOrRejectOrder = jest.fn().mockResolvedValue({});
    renderHeader({
      assignedApprovers: [pendingApprover],
      handleApproveOrRejectOrder,
    });

    fireEvent.click(screen.getByTestId('document-creator-approve-order-btn'));

    await waitFor(() =>
      expect(handleApproveOrRejectOrder).toHaveBeenCalledWith(7, 'Approved'),
    );
    expect(mockActions.approveRejectInquiry).not.toHaveBeenCalled();
  });

  it('wires the RejectModal with docType "order", the matched approver, and handleApproveOrRejectOrder as onReject', () => {
    const handleApproveOrRejectOrder = jest.fn();
    renderHeader({
      assignedApprovers: [pendingApprover],
      handleApproveOrRejectOrder,
    });

    fireEvent.click(screen.getByTestId('document-creator-reject-order-btn'));

    expect(screen.getByTestId('reject-modal-mock')).toBeInTheDocument();
    expect(rejectModalProps.docType).toBe('order');
    expect(rejectModalProps.approverInfo).toEqual(
      expect.objectContaining({ id: 7 }),
    );
    expect(rejectModalProps.onReject).toBe(handleApproveOrRejectOrder);
  });

  it('uses order-specific copy for the RejectModal fields when docType is order', () => {
    renderHeader({ assignedApprovers: [pendingApprover] });

    expect(rejectModalProps.fields).toEqual(
      expect.objectContaining({ title: 'reject_order_title' }),
    );
  });
});
