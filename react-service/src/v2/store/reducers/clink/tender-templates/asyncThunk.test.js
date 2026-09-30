const mockRelay = {
  get: jest.fn(),
  post: jest.fn(),
};

jest.mock('@reduxjs/toolkit', () => ({
  createAsyncThunk: jest.fn((_, payloadCreator) => payloadCreator),
}));

jest.mock('v2/services/relay', () => {
  return jest.fn(() => mockRelay);
});

const {
  fetchTenderTemplates,
  createTenderTemplate,
  deleteTenderTemplate,
} = require('v2/store/reducers/clink/tender-templates/asyncThunk');

describe('tender templates async thunks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRelay.get.mockResolvedValue({ status: 200, json: jest.fn(() => Promise.resolve([{ id: 1 }])) });
    mockRelay.post.mockResolvedValue({ status: 200, json: jest.fn(() => Promise.resolve({ ok: true })) });
  });

  it('fetches templates with optional filters', async () => {
    const templates = await fetchTenderTemplates({ pid: 1, tid: 2, status: 'draft' });
    expect(mockRelay.get).toHaveBeenCalledWith('', expect.objectContaining({ method: 'fetchAll', pid: 1, tid: 2, status: 'draft' }));
    expect(await templates).toEqual([{ id: 1 }]);

    mockRelay.get.mockResolvedValueOnce({ status: 404 });
    const status = await fetchTenderTemplates({ pid: 1 });
    expect(status).toBe(404);
  });

  it('creates and deletes templates via relay', async () => {
    const created = await createTenderTemplate({ pid: 1, tid: 2, did: 3 });
    expect(mockRelay.post).toHaveBeenCalledWith({}, '', expect.objectContaining({ method: 'create', pid: 1, tid: 2, did: 3 }));
    expect(await created).toEqual({ ok: true });

    mockRelay.post.mockResolvedValueOnce({ status: 200, json: jest.fn(() => Promise.resolve({ removed: true })) });
    const removed = await deleteTenderTemplate({ pid: 1, tid: 2, did: 3 });
    expect(mockRelay.post).toHaveBeenCalledWith({}, '', expect.objectContaining({ method: 'remove', pid: 1, tid: 2, did: 3 }));
    expect(await removed).toEqual({ removed: true });

    mockRelay.post.mockRejectedValueOnce({ status: 500 });
    const failed = await deleteTenderTemplate({ pid: 1, tid: 2, did: 3 });
    expect(failed).toBe(500);
  });
});
