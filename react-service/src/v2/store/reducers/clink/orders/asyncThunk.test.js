const mockRelay = {
  get: jest.fn(),
  deleter: jest.fn(),
};

jest.mock('@reduxjs/toolkit', () => ({
  createAsyncThunk: jest.fn((_, payloadCreator) => payloadCreator),
}));

jest.mock('v2/services/relay', () => {
  return jest.fn(() => mockRelay);
});

const mockPatchData = jest.fn();
const mockPostData = jest.fn();

jest.mock('services/clinkHelpers', () => ({
  patchData: (...args) => mockPatchData(...args),
  postData: (...args) => mockPostData(...args),
}));

jest.mock('v2/helpers/flags', () => jest.fn(() => false));

const {
  fetchOrders,
  deleteOrder,
  withdrawSentOrder,
  markAsSignOrder,
  sendApprovalReminder,
} = require('v2/store/reducers/clink/orders/asyncThunk');

const response = (status, payload) => ({
  status,
  json: jest.fn(() => Promise.resolve(payload)),
});

describe('orders async thunks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRelay.get.mockResolvedValue(response(200, [{ id: 1 }]));
    mockRelay.deleter.mockResolvedValue(response(200, { removed: true }));
    mockPatchData.mockResolvedValue(response(200, { ok: true }));
    mockPostData.mockResolvedValue(response(200, { acknowledged: true }));
  });

  it('fetchOrders returns list on success and propagates status on failure', async () => {
    const list = await fetchOrders('PID');
    expect(list).toEqual([{ id: 1 }]);

    mockRelay.get.mockResolvedValueOnce({ status: 500 });
    const failed = await fetchOrders('PID');
    expect(failed).toBe(500);
  });

  it('deleteOrder invokes deleter and handles catch', async () => {
    const payload = { qid: 1, tid: 2, pid: 3 };
    const result = await deleteOrder(payload);
    expect(mockRelay.deleter).toHaveBeenCalledWith('', {
      action: 'order',
      method: 'remove',
      ...payload,
    });
    expect(result).toEqual({ removed: true });

    mockRelay.deleter.mockRejectedValueOnce({ status: 409 });
    const rejected = await deleteOrder(payload);
    expect(rejected).toBe(409);
  });

  it('withdrawSentOrder patches withdrawal and handles rejection', async () => {
    const args = { pid: 1, id: 2, tid: 3 };
    const result = await withdrawSentOrder(args);
    expect(mockPatchData).toHaveBeenCalledWith('transaction', 'withdrawOrder', {}, args);
    expect(result).toEqual({ ok: true });

    mockPatchData.mockRejectedValueOnce({ status: 422 });
    const rejected = await withdrawSentOrder(args);
    expect(rejected).toBe(422);
  });

  it('markAsSignOrder updates signed status', async () => {
    const args = { pid: 1, id: 2, tid: 3 };
    const result = await markAsSignOrder(args);
    expect(mockPatchData).toHaveBeenCalledWith('transaction', 'markAsSigned', {}, args);
    expect(result).toEqual({ ok: true });
  });

  it('sendApprovalReminder posts reminder data and handles errors', async () => {
    const result = await sendApprovalReminder({ approver_id: 9, did: 'D1' });
    expect(mockPostData).toHaveBeenCalledWith('order', 'approvalReminder', { data: { approver_id: 9 } }, { did: 'D1' });
    expect(result).toEqual({ acknowledged: true });

    mockPostData.mockRejectedValueOnce({ status: 408 });
    const rejected = await sendApprovalReminder({ approver_id: 9, did: 'D1' });
    expect(rejected).toBe(408);
  });
});
