const mockRelay = {
  get: jest.fn(),
  deleter: jest.fn(),
};
const mockPostData = jest.fn();
const mockPatchData = jest.fn();

jest.mock('@reduxjs/toolkit', () => ({
  createAsyncThunk: jest.fn((_, payloadCreator) => payloadCreator),
}));

jest.mock('v2/services/relay', () => {
  return jest.fn(() => mockRelay);
});

jest.mock('services/clinkHelpers', () => ({
  postData: (...args) => mockPostData(...args),
  patchData: (...args) => mockPatchData(...args),
}));

const {
  fetchInstructions,
  fetchInstruction,
  fetchType,
  fetchStatus,
  fetchSubcontractors,
  deleteInstruction,
  fetchForecastList,
  createInstruction,
  updateInstruction,
} = require('v2/store/reducers/clink/instructions/asyncThunk');

describe('instructions async thunks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRelay.get.mockResolvedValue({ status: 200, json: jest.fn(() => Promise.resolve({ ok: true })) });
    mockRelay.deleter.mockResolvedValue({ status: 200, json: jest.fn(() => Promise.resolve({ removed: true })) });
    mockPostData.mockResolvedValue({ status: 200, json: jest.fn(() => Promise.resolve({ created: true })) });
    mockPatchData.mockResolvedValue({ status: 200, json: jest.fn(() => Promise.resolve({ updated: true })) });
  });

  it('fetches instructions list and single instruction', async () => {
    const list = await fetchInstructions({ pid: 1, method: 'fetch' });
    expect(await list).toEqual({ ok: true });
    expect(mockRelay.get).toHaveBeenCalledWith('', { action: 'project_management', method: 'fetch', pid: 1 });

    const single = await fetchInstruction({ id: 9 });
    expect(await single).toEqual({ ok: true });
    expect(mockRelay.get).toHaveBeenLastCalledWith('', { action: 'project_management', method: 'getInstruction', id: 9 });
  });

  it('fetches types, status and subcontractors', async () => {
    await fetchType(undefined, {});
    expect(mockRelay.get).toHaveBeenCalledWith('', { action: 'project_management', method: 'getType' });

    await fetchStatus(undefined, {});
    expect(mockRelay.get).toHaveBeenCalledWith('', { action: 'project_management', method: 'getStatus' });

    await fetchSubcontractors(10);
    expect(mockRelay.get).toHaveBeenCalledWith('', { action: 'project_management', method: 'getSubcontractors', pid: 10 });
  });

  it('creates and updates instructions', async () => {
    const created = await createInstruction({ data: { title: 'Instruction' } });
    expect(await created).toEqual({ created: true });
    expect(mockPostData).toHaveBeenCalledWith('project_management', 'createInstruction', { title: 'Instruction' });

    const updated = await updateInstruction({ id: 5, instruction: { title: 'Updated' } });
    expect(await updated).toEqual({ updated: true });
    expect(mockPatchData).toHaveBeenCalledWith('project_management', 'updateInstruction', { title: 'Updated' }, { id: 5 });
  });

  it('deletes instructions and fetches forecasts', async () => {
    const removed = await deleteInstruction(7);
    expect(await removed).toEqual({ removed: true });
    expect(mockRelay.deleter).toHaveBeenCalledWith('', { action: 'project_management', method: 'deleteInstruction', id: 7 });

    await fetchForecastList(12);
    expect(mockRelay.get).toHaveBeenCalledWith('', { action: 'project_management', method: 'listForecast', pid: 12 });
  });

  it('propagates errors from relay calls', async () => {
    mockRelay.get.mockRejectedValueOnce({ status: 500 });
    const failed = await fetchInstructions({ pid: 1, method: 'fetch' });
    expect(failed).toBe(500);
  });
});
