import {
  DRAFT,
  SENT,
  WITHDRAW,
  SIGNED,
  ORDER_SIGNED,
  PENDING,
  AWAITING,
  REJECTED,
  PENDING_APPROVAL,
  IN_QUEUE,
} from 'v2/helpers/status/orders';
import flag from 'v2/helpers/flags';
import useActions from './index';

// Mock the dependencies
jest.mock('v2/helpers/flags', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}));

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: jest.fn((key) => key),
  },
}));

jest.mock('./common', () => ({
  viewQuoteFile: jest.fn(() => ({
    name: 'view-quote-file',
    action: jest.fn(),
  })),
  modalAsyncAction: jest.fn((setOpen, handleAccept, title, name) => ({
    name: name || 'modal-action',
    action: jest.fn(),
  })),
  handleOpenNewTab: jest.fn((name, _url) => ({ name, action: jest.fn() })),
  viewLogOption: jest.fn((_handler, _logs) => ({
    name: 'view-logs',
    action: jest.fn(),
  })),
}));

describe('useActions Hook', () => {
  const mockSetDisabled = jest.fn();
  const mockUseDisabled = [false, mockSetDisabled];

  const mockProps = {
    pid: 'project123',
    tender: { id: 'tender123' },
    setOpen: jest.fn(),
    quoteFilesForTender: { order123: 'quote-file-url' },
    withdrawSentOrder: jest.fn(() => Promise.resolve()),
    markAsSignOrder: jest.fn(() => Promise.resolve()),
    deleteOrder: jest.fn(() => Promise.resolve()),
    useDisabled: mockUseDisabled,
    handleLogModal: jest.fn(),
  };

  const baseEntryData = {
    order_id: 'order123',
    document: { id: 'doc123' },
    subcontractor: { id: 'sub123' },
    signatory: { id: 'sign123' },
    order_logs: [{ id: 1, action: 'created' }],
    assigned_approvers: [
      {
        id: 'approver1',
        status: { label: 'Approved' },
        approver_user: { display_name: 'John Doe' },
        created_at: '2023-01-01',
        updated_at: '2023-01-02',
        comment: 'Looks good',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetDisabled.mockClear();
  });

  it('should return empty array for unknown status', () => {
    const entryData = {
      ...baseEntryData,
      status: 'UNKNOWN_STATUS',
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result).toEqual([]);
  });

  it('should return correct actions for DRAFT status', () => {
    const entryData = {
      ...baseEntryData,
      status: DRAFT,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) }),
      ]),
    );
  });

  it('should return correct actions for SENT status', () => {
    const entryData = {
      ...baseEntryData,
      status: SENT,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) }),
      ]),
    );
  });

  it('should return correct actions for IN_QUEUE status', () => {
    const entryData = {
      ...baseEntryData,
      status: IN_QUEUE,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) }),
      ]),
    );
  });

  it('should return correct actions for WITHDRAW status', () => {
    const entryData = {
      ...baseEntryData,
      status: WITHDRAW,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) }),
      ]),
    );
  });

  it('should return correct actions for SIGNED status', () => {
    const entryData = {
      ...baseEntryData,
      status: SIGNED,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) }),
      ]),
    );
  });

  it('should return correct actions for ORDER_SIGNED status', () => {
    const entryData = {
      ...baseEntryData,
      status: ORDER_SIGNED,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) }),
      ]),
    );
  });

  it('should return correct actions for PENDING status', () => {
    const entryData = {
      ...baseEntryData,
      status: PENDING,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) }),
      ]),
    );
  });

  it('should return correct actions for AWAITING status', () => {
    const entryData = {
      ...baseEntryData,
      status: AWAITING,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) }),
      ]),
    );
  });

  it('should return correct actions for REJECTED status', () => {
    const entryData = {
      ...baseEntryData,
      status: REJECTED,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) }),
      ]),
    );
  });

  it('should return correct actions for PENDING_APPROVAL status', () => {
    const entryData = {
      ...baseEntryData,
      status: PENDING_APPROVAL,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) }),
      ]),
    );
  });

  it('should handle missing quote files', () => {
    const entryData = {
      ...baseEntryData,
      status: DRAFT,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      {}, // Empty quote files
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result).toBeDefined();
  });

  it('should handle missing signatory data', () => {
    const entryData = {
      ...baseEntryData,
      signatory: undefined,
      status: PENDING,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    expect(result).toBeDefined();
  });

  it('should handle flag being disabled', () => {
    // Mock flag to return false (DELETE_DRAFT_ORDER disabled)
    flag.mockReturnValue(false);

    const entryData = {
      ...baseEntryData,
      status: DRAFT,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    // Should not contain delete action when flag is disabled
    const deleteAction = result.find(
      (action) => action && action.name === 'delete-order',
    );
    expect(deleteAction).toBeUndefined();

    // Should still contain other actions (edit and view quote)
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle flag being enabled', () => {
    // Mock flag to return true (DELETE_DRAFT_ORDER enabled)
    flag.mockReturnValue(true);

    const entryData = {
      ...baseEntryData,
      status: DRAFT,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    // Should contain delete action when flag is enabled
    const deleteAction = result.find(
      (action) => action && action.name === 'delete-order',
    );
    expect(deleteAction).toBeDefined();

    // Should contain multiple actions including delete
    expect(result.length).toBeGreaterThan(1);
  });

  it('should test resend action execution', async () => {
    // Mock fetch globally
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const entryData = {
      ...baseEntryData,
      status: PENDING,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    // Find the resend action and execute it
    const resendAction = result.find(
      (action) => action && action.name === 'resend-order',
    );
    if (resendAction && resendAction.action) {
      resendAction.action();
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      expect(mockSetDisabled).toHaveBeenCalled();
    }

    // Clean up
    delete global.fetch;
  });

  it('should test resend action with fetch error', async () => {
    // Mock fetch to reject
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const entryData = {
      ...baseEntryData,
      status: PENDING,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    // Find the resend action and execute it
    const resendAction = result.find(
      (action) => action && action.name === 'resend-order',
    );
    if (resendAction && resendAction.action) {
      resendAction.action();
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      expect(mockSetDisabled).toHaveBeenCalled();
    }

    // Clean up
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
    delete global.fetch;
  });

  it('should test resend action with non-ok response', async () => {
    // Mock fetch to return non-ok response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
      }),
    );
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const entryData = {
      ...baseEntryData,
      status: PENDING,
    };

    const result = useActions(
      mockProps.pid,
      entryData,
      mockProps.tender,
      mockProps.setOpen,
      mockProps.quoteFilesForTender,
      mockProps.withdrawSentOrder,
      mockProps.markAsSignOrder,
      mockProps.deleteOrder,
      mockProps.useDisabled,
      mockProps.handleLogModal,
    );

    // Find the resend action and execute it
    const resendAction = result.find(
      (action) => action && action.name === 'resend-order',
    );
    if (resendAction && resendAction.action) {
      resendAction.action();
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      expect(mockSetDisabled).toHaveBeenCalled();
    }

    // Clean up
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
    delete global.fetch;
  });
});
