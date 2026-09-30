const mockFetchData = jest.fn();
const mockPatchData = jest.fn();
const mockPostData = jest.fn();
const mockPostFormData = jest.fn();
const mockDeleteData = jest.fn();
const mockGetData = jest.fn();
const mockPostDataV1 = jest.fn();
const mockHttpRequest = jest.fn();

jest.mock('@reduxjs/toolkit', () => ({
  createAsyncThunk: jest.fn((_, payloadCreator) => payloadCreator),
}));

jest.mock('services/helpers', () => ({
  fetchData: (...args) => mockFetchData(...args),
  patchData: (...args) => mockPatchData(...args),
  postData: (...args) => mockPostData(...args),
  postFormData: (...args) => mockPostFormData(...args),
  deleteData: (...args) => mockDeleteData(...args),
}));

jest.mock('services/clinkHelpers', () => ({
  fetchData: (...args) => mockGetData(...args),
  postData: (...args) => mockPostDataV1(...args),
}));

jest.mock('v2/services/httpHelper', () => ({
  __esModule: true,
  default: (...args) => mockHttpRequest(...args),
}));

const {
  fetchPrequalification,
  fetchPrequalificationSections,
  patchCompanyInformation,
  postPrequalFile,
  patchTurnover,
  postReferences,
  resendReferences,
  patchOrganization,
  postOrganization,
  patchOrganizationV2,
  deleteTeamMember,
  deletePrequalificationSection,
  deletePrequalificationReference,
  getPrequalification,
  getPrequalificationSections,
  requestDocument,
  getPrequalificationStatuses,
} = require('v2/store/reducers/common/prequalification_v2/asyncThunk');

const resolveJson = (payload) => ({ json: jest.fn(() => Promise.resolve(payload)) });

describe('prequalification v2 async thunks', () => {
  const thunkApi = { rejectWithValue: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchData.mockResolvedValue({ data: { ok: true } });
    mockPatchData.mockResolvedValue(resolveJson({ patched: true }));
    mockPostData.mockResolvedValue(resolveJson({ posted: true }));
    mockPostFormData.mockResolvedValue(resolveJson({ uploaded: true }));
    mockDeleteData.mockResolvedValue(resolveJson({ deleted: true }));
    mockGetData.mockResolvedValue({ data: { list: [] } });
    mockPostDataV1.mockResolvedValue(resolveJson({ requested: true }));
    mockHttpRequest.mockResolvedValue({ sections: [] });
  });

  it('fetches prequalification data and sections', async () => {
    const record = await fetchPrequalification('AID-1', thunkApi);
    expect(mockFetchData).toHaveBeenCalledWith('prequalification', {}, 'AID-1');
    expect(record).toEqual({ ok: true });

    const sections = await fetchPrequalificationSections(undefined, thunkApi);
    expect(mockFetchData).toHaveBeenCalledWith('user', {}, 'default_certificates');
    expect(sections).toEqual({ ok: true });
  });

  it('patches company information and turnover', async () => {
    const company = await patchCompanyInformation({ aid: 'A1', name: 'Company' }, thunkApi);
    expect(mockPatchData).toHaveBeenCalledWith('prequalification', { name: 'Company' }, 'A1/company_profile');
    expect(company).toEqual({ patched: true });

    const turnover = await patchTurnover({ aid: 'A2', amount: 1000 }, thunkApi);
    expect(mockPatchData).toHaveBeenCalledWith('prequalification', { amount: 1000 }, 'A2/turnover');
    expect(turnover).toEqual({ patched: true });
  });

  it('uploads certificates and references', async () => {
    const file = await postPrequalFile({ aid: 'A3', section: 'insurance', label: 'Insurance', file: 'blob' }, thunkApi);
    expect(file).toEqual({ uploaded: true });

    const references = await postReferences({ aid: 'A4', name: 'Ref' }, thunkApi);
    expect(references).toEqual({ uploaded: true });

    const resend = await resendReferences({ aid: 'A5', id: 10 }, thunkApi);
    expect(mockPostData).toHaveBeenCalledWith('prequalification', {}, 'A5/reference/10/resend');
    expect(resend).toEqual({ posted: true });
  });

  it('manages organisation members and deletions', async () => {
    const organisation = await patchOrganization({ aid: 'A6', name: 'Org' }, thunkApi);
    expect(organisation).toEqual({ patched: true });

    mockPostData.mockResolvedValueOnce(resolveJson({ data: { invited: true } }));
    const invite = await postOrganization({ aid: 'A7', email: 'user@biz.com' }, thunkApi);
    expect(invite).toEqual({ invited: true });

    const update = await patchOrganizationV2({ aid: 'A8', id: 2, name: 'Updated' }, thunkApi);
    expect(update).toEqual({ patched: true });

    const removed = await deleteTeamMember({ aid: 'A9', id: 3 }, thunkApi);
    expect(removed).toEqual({ deleted: true });
  });

  it('deletes prequalification sections and references', async () => {
    const section = await deletePrequalificationSection({ aid: 'A10', id: 11 }, thunkApi);
    expect(section).toEqual({ deleted: true });

    const reference = await deletePrequalificationReference({ aid: 'A12', id: 13 }, thunkApi);
    expect(reference).toEqual({ deleted: true });
  });

  it('retrieves prequalification metadata and statuses', async () => {
    const prequal = await getPrequalification(20, thunkApi);
    expect(mockGetData).toHaveBeenCalledWith('prequalification', 'getPrequalification', { subcontractor: 20 });
    expect(prequal).toEqual({ list: [] });

    const defaultCerts = await getPrequalificationSections(undefined, thunkApi);
    expect(mockGetData).toHaveBeenCalledWith('prequalification', 'getDefaultCertificates');
    expect(defaultCerts).toEqual({ list: [] });

    const statuses = await getPrequalificationStatuses(undefined, thunkApi);
    expect(statuses).toEqual({ sections: [] });
  });

  it('requests documents and handles fetch failures', async () => {
    const doc = await requestDocument({ aid: 'A13', type: 'insurance', data: { label: 'Policy', request_type: 'upload' } }, thunkApi);
    expect(doc).toEqual({ requested: true });

    mockFetchData.mockRejectedValueOnce(new Error('network'));
    await fetchPrequalification('AID-error', thunkApi);
    expect(thunkApi.rejectWithValue).toHaveBeenCalledWith('network');
  });
});
