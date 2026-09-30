const mockPostFormData = jest.fn();
const mockDeleteData = jest.fn();

jest.mock('@reduxjs/toolkit', () => ({
  createAsyncThunk: jest.fn((_, payloadCreator) => payloadCreator),
}));

jest.mock('services/clinkHelpers', () => ({
  postFormData: (...args) => mockPostFormData(...args),
  deleteData: (...args) => mockDeleteData(...args),
}));

const { addDocument, removeDocument } = require('v2/store/reducers/clink/instructions/documents/asyncThunk');

describe('instruction documents async thunks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostFormData.mockResolvedValue({ status: 200, json: jest.fn(() => Promise.resolve({ uploaded: true })) });
    mockDeleteData.mockResolvedValue({ status: 200, json: jest.fn(() => Promise.resolve({ removed: true })) });
  });

  it('adds documents and propagates error status', async () => {
    const added = await addDocument({ id: 5, data: 'file' });
    expect(mockPostFormData).toHaveBeenCalledWith('project_management', 'addInstructionDocuments', { document: 'file' }, { id: 5 });
    expect(await added).toEqual({ uploaded: true });

    mockPostFormData.mockRejectedValueOnce({ status: 500 });
    const failed = await addDocument({ id: 5, data: 'file' });
    expect(failed).toBe(500);
  });

  it('removes documents and returns payload', async () => {
    const removed = await removeDocument(10);
    expect(mockDeleteData).toHaveBeenCalledWith('document', 'remove', { did: 10 });
    expect(await removed).toEqual({ removed: true });
  });
});
