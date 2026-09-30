const mockRelayInstance = {
  get: jest.fn(),
  post: jest.fn(),
  postForm: jest.fn(),
  patch: jest.fn(),
};

jest.mock('@reduxjs/toolkit', () => ({
  createAsyncThunk: jest.fn((_, payloadCreator) => payloadCreator),
}));

jest.mock('v2/services/relay', () => {
  return jest.fn(() => mockRelayInstance);
});

jest.mock('moment', () => () => ({
  format: () => '2024-01-01',
}));

const {
  fetchQuoteFiles,
  fetchQuoteDocuments,
  fetchQuotes,
  postQuote,
  editQuote,
  toggleCompliant,
  deleteQuote,
  withdrawAward,
  award,
  toggledSelected,
  updateProjectTender,
} = require('v2/store/reducers/clink/quotes-tender/asyncThunk');

const createResponse = (status, payload) => ({
  status,
  json: jest.fn(() => payload),
});

describe('quotes tender async thunks', () => {
  const thunkApi = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchQuotes forwards payload when request succeeds', async () => {
    const payload = [{ id: 1 }];
    mockRelayInstance.get.mockResolvedValueOnce(createResponse(200, payload));

    const result = await fetchQuotes('pid-123', thunkApi);

    expect(mockRelayInstance.get).toHaveBeenCalledWith('', {
      action: 'transaction',
      method: 'getQuotes',
      pid: 'pid-123',
    });
    expect(result).toEqual(payload);
  });

  it('fetchQuotes returns status code when request fails', async () => {
    mockRelayInstance.get.mockResolvedValueOnce({ status: 500 });

    const result = await fetchQuotes('pid-500', thunkApi);
    expect(result).toBe(500);
  });

  it('fetchQuotes surfaces relay error status when request rejects', async () => {
    mockRelayInstance.get.mockRejectedValueOnce({ status: 401 });

    const result = await fetchQuotes('pid-reject', thunkApi);
    expect(result).toBe(401);
  });

  it('fetchQuoteFiles propagates error status when relay throws', async () => {
    mockRelayInstance.get.mockRejectedValueOnce({ status: 404 });

    const result = await fetchQuoteFiles('pid-missing', thunkApi);
    expect(result).toBe(404);
  });

  it('fetchQuoteDocuments forwards payload when request succeeds', async () => {
    const payload = {
      1: { 10: { count: 1, documents: [{ id: 5, name: 'quote.pdf' }] } },
    };
    mockRelayInstance.get.mockResolvedValueOnce(createResponse(200, payload));

    const result = await fetchQuoteDocuments('pid-123', thunkApi);

    expect(mockRelayInstance.get).toHaveBeenCalledWith('', {
      action: 'transaction',
      method: 'getQuoteDocuments',
      pid: 'pid-123',
    });
    expect(result).toEqual(payload);
  });

  it('fetchQuoteDocuments propagates error status when relay throws', async () => {
    mockRelayInstance.get.mockRejectedValueOnce({ status: 404 });

    const result = await fetchQuoteDocuments('pid-missing', thunkApi);
    expect(result).toBe(404);
  });

  it('postQuote uploads form data and returns JSON payload', async () => {
    const payload = { saved: true };
    mockRelayInstance.postForm.mockResolvedValueOnce(createResponse(200, payload));

    const data = { file: 'data' };
    const result = await postQuote({ data, pid: 'pid', tid: 'tid' }, thunkApi);

    expect(mockRelayInstance.postForm).toHaveBeenCalledWith(data, '', {
      action: 'transaction',
      method: 'addQuote',
      pid: 'pid',
      tid: 'tid',
    });
    expect(result).toEqual(payload);
  });

  it('editQuote patches quote payload', async () => {
    mockRelayInstance.patch.mockResolvedValueOnce({ status: 204 });

    const result = await editQuote(
      { order: { id: 1 }, pid: 'pid', tid: 'tid' },
      thunkApi,
    );

    expect(mockRelayInstance.patch).toHaveBeenCalledWith(
      { id: 1 },
      '',
      expect.objectContaining({
        action: 'transaction',
        method: 'updateQuote',
        pid: 'pid',
        tid: 'tid',
      }),
    );
    expect(result).toBe(204);
  });

  it('toggleCompliant posts compliance change', async () => {
    mockRelayInstance.post.mockResolvedValueOnce(createResponse(200, { ok: true }));

    const result = await toggleCompliant(
      { data: { compliant: true }, pid: 'pid', id: 'quote-id' },
      thunkApi,
    );

    expect(mockRelayInstance.post).toHaveBeenCalledWith(
      { compliant: true },
      '',
      expect.objectContaining({
        method: 'toggledCompliant',
        pid: 'pid',
        id: 'quote-id',
      }),
    );
    expect(result).toEqual({ ok: true });
  });

  it('deleteQuote sends post request without payload', async () => {
    mockRelayInstance.post.mockResolvedValueOnce({ status: 204 });

    const result = await deleteQuote({ pid: 'pid', tid: 'tid' }, thunkApi);

    expect(mockRelayInstance.post).toHaveBeenCalledWith(
      {},
      '',
      expect.objectContaining({
        method: 'deleteQuote',
        pid: 'pid',
        tid: 'tid',
      }),
    );
    expect(result).toBe(204);
  });

  it('withdrawAward posts withdraw request', async () => {
    mockRelayInstance.post.mockResolvedValueOnce({ status: 202 });

    const result = await withdrawAward(
      { pid: 'pid', tid: 'tid', id: 'award-id' },
      thunkApi,
    );

    expect(mockRelayInstance.post).toHaveBeenCalledWith(
      {},
      '',
      expect.objectContaining({
        method: 'withdrawAward',
        pid: 'pid',
        tid: 'tid',
        id: 'award-id',
      }),
    );
    expect(result).toBe(202);
  });

  it('award patches quote with award payload', async () => {
    const payload = { awarded: true };
    mockRelayInstance.patch.mockResolvedValueOnce(createResponse(200, payload));

    const args = {
      data: { awarded: true },
      pid: 'pid',
      tid: 'tid',
      sid: 'sid',
      id: 'quote-id',
    };
    const result = await award(args, thunkApi);

    expect(mockRelayInstance.patch).toHaveBeenCalledWith(
      { awarded: true },
      '',
      expect.objectContaining({
        method: 'award',
        pid: 'pid',
        tid: 'tid',
        sid: 'sid',
        id: 'quote-id',
      }),
    );
    expect(result).toEqual(payload);
  });

  it('toggledSelected posts selection payload', async () => {
    mockRelayInstance.post.mockResolvedValueOnce({ status: 201 });

    const result = await toggledSelected(
      { data: { selected: true }, pid: 'pid', id: 'item-id' },
      thunkApi,
    );

    expect(mockRelayInstance.post).toHaveBeenCalledWith(
      { selected: true },
      '',
      expect.objectContaining({
        method: 'toggledSelected',
        pid: 'pid',
        id: 'item-id',
      }),
    );
    expect(result).toBe(201);
  });

  it('updateProjectTender merges budget_updated_at timestamp', async () => {
    const payload = { ok: true };
    mockRelayInstance.patch.mockResolvedValueOnce(createResponse(200, payload));

    const args = { data: { total: 100 }, tid: 'tid', id: 'project-id' };
    const result = await updateProjectTender(args, thunkApi);

    expect(mockRelayInstance.patch).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 100,
        budget_updated_at: '2024-01-01',
      }),
      '',
      expect.objectContaining({
        action: 'project',
        method: 'updateProjectTender',
        tid: 'tid',
        id: 'project-id',
      }),
    );
    expect(result).toEqual(payload);
  });

  it('handles rejections across various relay methods', async () => {
    mockRelayInstance.postForm.mockRejectedValueOnce({ status: 415 });
    mockRelayInstance.patch.mockRejectedValueOnce({ status: 409 });
    mockRelayInstance.post.mockRejectedValueOnce({ status: 418 });

    const postResult = await postQuote({ data: {}, pid: 'pid', tid: 'tid' }, thunkApi);
    const patchResult = await editQuote({ order: {}, pid: 'pid', tid: 'tid' }, thunkApi);
    const postToggle = await toggleCompliant({ data: {}, pid: 'pid', id: 'id' }, thunkApi);

    expect(postResult).toBe(415);
    expect(patchResult).toBe(409);
    expect(postToggle).toBe(418);
  });
});
