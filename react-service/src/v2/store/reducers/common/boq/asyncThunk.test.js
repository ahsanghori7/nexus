const mockHttpRequest = jest.fn();
const mockHttpHelperV2 = jest.fn();
const mockRelay = {
  get: jest.fn(),
  post: jest.fn(),
};

jest.mock('@reduxjs/toolkit', () => ({
  createAsyncThunk: jest.fn((_, payloadCreator) => payloadCreator),
}));

jest.mock('v2/services/httpHelper', () => ({
  __esModule: true,
  default: (...args) => mockHttpRequest(...args),
  httpHelperV2: (...args) => mockHttpHelperV2(...args),
}));

jest.mock('v2/services/relay', () => {
  return jest.fn(() => mockRelay);
});

const {
  fetchOrderTemplates,
  fetchBoQList,
  fetchBoQQuotes,
  fetchBoQByTenderId,
  fetchUnits,
  fetchProjectStatuses,
  createEntity,
  updateEntity,
  publishBoQ,
  republishBoQ,
  quoteItems,
  quoteItemsDocs,
  publishQuote,
  republishQuote,
  changeCompliance,
  fetchQuoteHistory,
} = require('v2/store/reducers/common/boq/asyncThunk');

describe('boq async thunks', () => {
  const thunkApi = { rejectWithValue: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    thunkApi.rejectWithValue.mockReset();
    mockHttpRequest.mockResolvedValue({ data: [] });
    mockHttpHelperV2.mockResolvedValue({ status: 'PENDING' });
    mockRelay.get.mockResolvedValue({ status: 200, json: jest.fn(() => Promise.resolve([{ id: 1 }])) });
    mockRelay.post.mockResolvedValue({ status: 200, json: jest.fn(() => Promise.resolve({ toggled: true })) });
  });

  it('fetches order templates via relay and handles errors', async () => {
    const templates = await fetchOrderTemplates(undefined, thunkApi);
    expect(mockRelay.get).toHaveBeenCalledWith('', { action: 'template', method: 'fetchAll', type: 'orders' });
    expect(await templates).toEqual([{ id: 1 }]);

    mockRelay.get.mockResolvedValueOnce({ status: 500 });
    thunkApi.rejectWithValue.mockReturnValueOnce('rejected');
    const failed = await fetchOrderTemplates(undefined, thunkApi);
    expect(thunkApi.rejectWithValue).toHaveBeenCalledWith(500);
    expect(failed).toBe('rejected');
  });

  it('fetches BoQ endpoints', async () => {
    await fetchBoQList('slug-123', thunkApi);
    expect(mockHttpHelperV2).toHaveBeenCalledWith({ url: 'project/slug-123/boq' });

    await fetchBoQList({ slug: 'slug-456', releaseBusyForPackageId: 9 }, thunkApi);
    expect(mockHttpHelperV2).toHaveBeenCalledWith({ url: 'project/slug-456/boq' });

    await fetchBoQQuotes(10, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/10/quote' });

    await fetchBoQByTenderId({ projectSlug: 'slug', tid: 5 }, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'project/slug/5/boq' });

    await fetchUnits(undefined, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/units' });

    await fetchProjectStatuses(undefined, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/project_statuses' });
  });

  it('creates and updates entities', async () => {
    await createEntity(undefined, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/entity', method: 'POST' });

    await updateEntity({ id: 2, data: { name: 'Entity' } }, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/entity/2', method: 'PATCH', body: { name: 'Entity' } });
  });

  it('publishes, republish boqs and quotes', async () => {
    await publishBoQ({ id: 3, status: 'published' }, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/publish/3', method: 'PATCH', body: { status: 'published' } });

    await republishBoQ({ id: 4, reason: 'update' }, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/republish_boq/4', method: 'POST', body: { reason: 'update' } });

    await publishQuote({ boq_id: 5, sid: 6, reason: 'approve' }, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/5/quote/6/publish', method: 'PATCH', body: { reason: 'approve' } });

    await republishQuote({ boq_id: 5, sid: 6, reason: 'revise' }, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/5/quote/6/republish', method: 'PATCH', body: { reason: 'revise' } });
  });

  it('quotes items and documents', async () => {
    await quoteItems({ boq_id: 7, sid: 8, body: { value: 1 } }, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/7/quote/8', method: 'POST', body: { value: 1 }, isFormData: true });

    await quoteItemsDocs({ boq_id: 7, sid: 8, body: { file: 'blob' } }, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/7/quote/8/document', method: 'POST', body: { file: 'blob' }, isFormData: true });
  });

  it('changes compliance using relay', async () => {
    const result = await changeCompliance({ toggle: true, pid: 1, id: 2 }, thunkApi);
    expect(mockRelay.post).toHaveBeenCalledWith({ toggle: true }, '', {
      action: 'transaction',
      method: 'toggledCompliant',
      pid: 1,
      id: 2,
    });
    expect(await result).toEqual({ toggled: true });
  });

  it('fetches quote history and handles rejection', async () => {
    await fetchQuoteHistory({ boqId: 9 }, thunkApi);
    expect(mockHttpRequest).toHaveBeenCalledWith({ url: 'boq/9/quote_history' });

    mockHttpHelperV2.mockRejectedValueOnce(new Error('network'));
    await fetchBoQList('slug-error', thunkApi);
    expect(thunkApi.rejectWithValue).toHaveBeenCalledWith({
      message: 'network',
      status: undefined,
    });
  });
});
