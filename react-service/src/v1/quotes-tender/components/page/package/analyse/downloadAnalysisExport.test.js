import downloadAnalysisExport from './downloadAnalysisExport';

jest.mock('js-cookie', () => ({ get: () => 'test-token' }));
jest.mock('v2/store/reducers/clink/analyse-quote', () => ({
  QUOTE_LEVELING: 'tender_levelling',
}));
jest.mock('./buildAnalysisExportUrl', () => jest.fn(() => 'ai/quote_analysis/export/123/csv'));
jest.mock('v2/store/reducers/clink/analyse-quote/httpErrors', () => ({
  resolveAnalysisErrorMessage: (payload, error, fallback) =>
    payload?.error?.message || error || fallback,
}));

global.API = { RELAY_URL: 'https://relay.test/', TOKEN_NAME: 'token' };

const mockBlob = new Blob(['data']);

const mockFetchOk = (contentDisposition) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    headers: {
      get: (name) =>
        name.toLowerCase() === 'content-disposition' ? contentDisposition : null,
    },
    blob: () => Promise.resolve(mockBlob),
  });
};

beforeEach(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock');
  global.URL.revokeObjectURL = jest.fn();
  document.body.appendChild = jest.fn();
  document.body.removeChild = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('downloadAnalysisExport', () => {
  it('rejects when packageId is missing', async () => {
    await expect(downloadAnalysisExport(null, 'csv')).rejects.toThrow('Package ID is required');
  });

  it('uses filename from Content-Disposition header when present', async () => {
    mockFetchOk('attachment; filename="comparison_analysis-Project_A-20260605.xlsx"');
    const link = { click: jest.fn() };
    jest.spyOn(document, 'createElement').mockReturnValue(link);

    await downloadAnalysisExport(123, 'csv', 'tender_levelling');

    expect(link.download).toBe('comparison_analysis-Project_A-20260605.xlsx');
  });

  it('uses unquoted tender levelling filename from Content-Disposition', async () => {
    mockFetchOk(
      'attachment; filename=tender_levelling-Joffs_Project-3d_Laser_Scanning_Survey-20260625.xlsx',
    );
    const link = { click: jest.fn(), download: '' };
    jest.spyOn(document, 'createElement').mockReturnValue(link);

    await downloadAnalysisExport(44410, 'csv', 'tender_levelling');

    expect(link.download).toBe(
      'tender_levelling-Joffs_Project-3d_Laser_Scanning_Survey-20260625.xlsx',
    );
  });

  it('uses X-Export-Filename when Content-Disposition is not exposed to fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name) => {
          const key = name.toLowerCase();
          if (key === 'x-export-filename') {
            return 'tender_levelling-Joffs_Project-3d_Laser_Scanning_Survey-20260625.xlsx';
          }
          return null;
        },
      },
      blob: () => Promise.resolve(mockBlob),
    });
    const link = { click: jest.fn(), download: '' };
    jest.spyOn(document, 'createElement').mockReturnValue(link);

    await downloadAnalysisExport(43380, 'csv', 'tender_levelling');

    expect(link.download).toBe(
      'tender_levelling-Joffs_Project-3d_Laser_Scanning_Survey-20260625.xlsx',
    );
  });

  it('falls back to .xlsx for quote levelling when header is absent', async () => {
    mockFetchOk(null);
    const link = { click: jest.fn() };
    jest.spyOn(document, 'createElement').mockReturnValue(link);

    await downloadAnalysisExport(123, 'csv', 'tender_levelling');

    expect(link.download).toBe('quote_levelling-123.xlsx');
  });

  it('falls back to .docx for tender analysis when header is absent', async () => {
    mockFetchOk(null);
    const link = { click: jest.fn() };
    jest.spyOn(document, 'createElement').mockReturnValue(link);

    await downloadAnalysisExport(123, 'docx');

    expect(link.download).toBe('analysis-123.docx');
  });

  it('falls back to .docx for tender analysis when format is not provided', async () => {
    mockFetchOk(null);
    const link = { click: jest.fn() };
    jest.spyOn(document, 'createElement').mockReturnValue(link);

    await downloadAnalysisExport(123);

    expect(link.download).toBe('analysis-123.docx');
  });

  it('falls back to status text when error response is not JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('invalid json')),
    });

    await expect(downloadAnalysisExport(123, 'csv', 'tender_levelling')).rejects.toThrow(
      'Internal Server Error',
    );
  });

  it('rejects with API error message when response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () =>
        Promise.resolve({
          error: { message: 'Analysis exists but has no results yet' },
        }),
    });

    await expect(downloadAnalysisExport(123, 'csv', 'tender_levelling')).rejects.toThrow(
      'Analysis exists but has no results yet',
    );
  });
});
