const mockRelay = {
  get: jest.fn(),
};

jest.mock('@reduxjs/toolkit', () => ({
  createAsyncThunk: jest.fn((_, payloadCreator) => payloadCreator),
}));

jest.mock('v2/services/relay', () => {
  return jest.fn(() => mockRelay);
});

const mockPatchData = jest.fn();
const mockPostData = jest.fn();

jest.mock('v2/services/clinkHelpers', () => ({
  patchData: (...args) => mockPatchData(...args),
  postData: (...args) => mockPostData(...args),
}));

const mockHttpHelper = jest.fn();

jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: (...args) => mockHttpHelper(...args),
}));

const {
  fetchProject,
  fetchProjectGantt,
  updateTender,
  fetchProjectSummary,
  fetchPackageDependency,
  addProject,
  updateProject,
  fetchTeamApi,
  postMember,
  deleteMember,
  getProjectTenders,
  fetchProjectEnquiries,
  updatePackages,
  getDashboardActions,
  removeOrRestoreDashboardAction,
  fetchIfsProjects,
  fetchLinkedIfsProject,
} = require('v2/store/reducers/clink/project/asyncThunk');

const createRelayResponse = (status, payload) => ({
  status,
  json: jest.fn(() => Promise.resolve(payload)),
});

describe('project async thunks', () => {
  const thunkApi = { rejectWithValue: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRelay.get.mockResolvedValue(createRelayResponse(200, {}));
    mockPatchData.mockResolvedValue(createRelayResponse(200, {}));
    mockPostData.mockResolvedValue(createRelayResponse(200, {}));
    mockHttpHelper.mockResolvedValue({ data: { success: true } });
  });

  it('fetches individual project variants via relay', async () => {
    const payload = { id: 1 };
    mockRelay.get.mockResolvedValueOnce(createRelayResponse(200, payload));
    const project = await fetchProject({ slug: 'slug-1' }, thunkApi);
    expect(project).toEqual(payload);

    mockRelay.get.mockResolvedValueOnce(createRelayResponse(500));
    const gantt = await fetchProjectGantt({ slug: 'slug-1', state: 'active' }, thunkApi);
    expect(gantt).toBe(500);
  });

  it('updates tender via patchData', async () => {
    mockPatchData.mockResolvedValueOnce(createRelayResponse(200, { ok: true }));
    const result = await updateTender({ tid: 'T1', data: { name: 'Tender' } }, thunkApi);
    expect(mockPatchData).toHaveBeenCalledWith('tender', 'update', { name: 'Tender' }, { tid: 'T1' });
    expect(result).toBeUndefined();
  });

  it('fetches summary and dependencies of project', async () => {
    mockRelay.get.mockResolvedValueOnce(createRelayResponse(200, { summary: true }));
    const summary = await fetchProjectSummary('PID-1', thunkApi);
    expect(summary).toEqual({ summary: true });

    mockRelay.get.mockResolvedValueOnce(createRelayResponse(200, { dependency: true }));
    const dependency = await fetchPackageDependency('PID-2', thunkApi);
    expect(dependency).toEqual({ dependency: true });
  });

  it('adds and updates projects handling validation errors', async () => {
    mockPatchData.mockResolvedValueOnce({ json: jest.fn(() => Promise.resolve({ error: 'invalid' })) });
    await addProject({ name: 'Project' }, thunkApi);
    expect(thunkApi.rejectWithValue).toHaveBeenCalledWith('invalid');

    thunkApi.rejectWithValue.mockClear();
    mockPatchData.mockResolvedValueOnce({ json: jest.fn(() => Promise.resolve({ id: 1 })) });
    const updateResult = await updateProject({ data: { id: 1 }, pid: 'PID' }, thunkApi);
    expect(updateResult).toEqual({ id: 1 });
  });

  it('fetches team members via http helper and handles errors', async () => {
    mockHttpHelper.mockResolvedValueOnce({ team: [] });
    const team = await fetchTeamApi('PID', thunkApi);
    expect(mockHttpHelper).toHaveBeenCalledWith({ url: 'project/PID/team', method: 'GET' });
    expect(team).toEqual({ team: [] });

    mockHttpHelper.mockRejectedValueOnce('network-error');
    const rejected = await fetchTeamApi('PID', thunkApi);
    expect(thunkApi.rejectWithValue).toHaveBeenCalledWith('network-error');
    expect(rejected).toBeUndefined();
  });

  it('posts project members and handles failure response', async () => {
    mockHttpHelper.mockResolvedValueOnce({ data: { success: true } });
    const response = await postMember({ pid: 'PID', name: 'Member' }, thunkApi);
    expect(mockHttpHelper).toHaveBeenCalledWith({
      url: 'project/PID/add_team_member',
      method: 'POST',
      body: { name: 'Member' },
    });
    expect(response).toEqual({ data: { success: true } });

    thunkApi.rejectWithValue.mockClear();
    mockHttpHelper.mockResolvedValueOnce({ data: { success: false, error: 'failed' } });
    await postMember({ pid: 'PID', name: 'Member' }, thunkApi);
    expect(thunkApi.rejectWithValue).toHaveBeenCalledWith('failed');
  });

  it('deletes members and returns formatted response', async () => {
    mockHttpHelper.mockResolvedValueOnce({ data: { success: true } });
    const result = await deleteMember({ pid: 'PID', teamId: 3 }, thunkApi);
    expect(mockHttpHelper).toHaveBeenCalledWith({
      url: 'project/PID/team_member/3',
      method: 'DELETE',
    });
    expect(result).toEqual({ data: { success: true } });

    thunkApi.rejectWithValue.mockClear();
    mockHttpHelper.mockResolvedValueOnce({ data: { success: false } });
    await deleteMember({ pid: 'PID', teamId: 0 }, thunkApi);
    expect(thunkApi.rejectWithValue).toHaveBeenCalled();
  });

  it('retrieves project tenders and enquiries', async () => {
    mockRelay.get.mockResolvedValueOnce(createRelayResponse(200, [{ id: 5 }]));
    const tenders = await getProjectTenders(10, thunkApi);
    expect(tenders).toEqual([{ id: 5 }]);

    mockRelay.get.mockResolvedValueOnce(createRelayResponse(200, { tenders: {} }));
    const enquiries = await fetchProjectEnquiries({ pid: 'PID' }, thunkApi);
    expect(enquiries).toEqual({ tenders: {} });
  });

  it('updates packages and dashboard actions', async () => {
    mockPatchData.mockResolvedValueOnce(createRelayResponse(200, { updated: true }));
    const packages = await updatePackages({ tid: 'TID', data: { value: 1 } }, thunkApi);
    expect(packages).toEqual({ updated: true });

    mockRelay.get.mockResolvedValueOnce(createRelayResponse(200, { actions: [] }));
    const actions = await getDashboardActions({ filter: 'all' }, thunkApi);
    expect(actions).toEqual({ actions: [] });
  });

  it('removes or restores dashboard actions', async () => {
    mockPostData.mockResolvedValueOnce(createRelayResponse(200, { success: true }));
    const result = await removeOrRestoreDashboardAction({ approver_id: 1, is_read: true }, thunkApi);
    expect(mockPostData).toHaveBeenCalledWith('project', 'updateActions', { approver_id: 1, is_read: true });
    expect(result).toEqual({ success: true });
  });

  it('fetches IFS projects via http helper and handles errors', async () => {
    mockHttpHelper.mockResolvedValueOnce({
      data: {
        records: [{ id: 7, project_code: 'MCL-0042' }],
        total: 1,
      },
    });
    const result = await fetchIfsProjects(
      { search: 'depot', page: 1, per_page: 15 },
      thunkApi,
    );
    expect(mockHttpHelper).toHaveBeenCalledWith({
      url: 'project/ifs-projects?search=depot&page=1&per_page=15',
      method: 'GET',
    });
    expect(result).toEqual({
      records: [{ id: 7, project_code: 'MCL-0042' }],
      total: 1,
    });

    thunkApi.rejectWithValue.mockClear();
    mockHttpHelper.mockRejectedValueOnce('network-error');
    await fetchIfsProjects({ search: '', page: 1 }, thunkApi);
    expect(thunkApi.rejectWithValue).toHaveBeenCalledWith('network-error');
  });

  it('uses default IFS query params when args are empty and falls back when data is missing', async () => {
    mockHttpHelper.mockResolvedValueOnce({});
    const emptyResult = await fetchIfsProjects(undefined, thunkApi);
    expect(mockHttpHelper).toHaveBeenCalledWith({
      url: 'project/ifs-projects?search=&page=1&per_page=15',
      method: 'GET',
    });
    expect(emptyResult).toEqual({ records: [], total: 0 });

    mockHttpHelper.mockResolvedValueOnce({ data: null });
    const nullData = await fetchIfsProjects({}, thunkApi);
    expect(nullData).toEqual({ records: [], total: 0 });
  });

  it('fetches linked IFS project and treats 404 as no link', async () => {
    mockHttpHelper.mockResolvedValueOnce({
      data: {
        id: 7,
        external_id: 'IFS-PRJ-0042',
        project_code: 'MCL-0042',
      },
    });
    const result = await fetchLinkedIfsProject(123, thunkApi);
    expect(mockHttpHelper).toHaveBeenCalledWith({
      url: 'project/123/ifs-project',
      method: 'GET',
    });
    expect(result).toEqual({
      id: 7,
      external_id: 'IFS-PRJ-0042',
      project_code: 'MCL-0042',
    });

    mockHttpHelper.mockRejectedValueOnce({ status: 404 });
    const missing = await fetchLinkedIfsProject(456, thunkApi);
    expect(missing).toBeNull();

    thunkApi.rejectWithValue.mockClear();
    mockHttpHelper.mockRejectedValueOnce({ status: 500 });
    await fetchLinkedIfsProject(789, thunkApi);
    expect(thunkApi.rejectWithValue).toHaveBeenCalledWith({ status: 500 });
  });
});
