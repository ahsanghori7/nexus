const mockHttpHelperV2 = jest.fn();

jest.mock('@reduxjs/toolkit', () => ({
  createAsyncThunk: jest.fn((_, payloadCreator) => payloadCreator),
}));

jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: (...args) => mockHttpHelperV2(...args),
}));

const {
  getDocumentSnapshot,
  downloadAllDocuments,
  downloadSingleDocument,
} = require('./asyncThunk');

describe('Download Manager AsyncThunks', () => {
  const thunkAPI = { rejectWithValue: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    thunkAPI.rejectWithValue.mockReset();
    mockHttpHelperV2.mockResolvedValue({ data: {} });
  });

  describe('getDocumentSnapshot', () => {
    it('should fetch document snapshot successfully with token', async () => {
      const mockResponse = {
        data: {
          id: 1,
          snapshot: 'snapshot_data',
          documents: [],
        },
      };

      mockHttpHelperV2.mockResolvedValue(mockResponse);

      const result = await getDocumentSnapshot({
        document_id: 123,
        token: 'test-token',
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'document/123/snapshot',
        method: 'GET',
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch document snapshot successfully without token', async () => {
      const mockResponse = {
        data: {
          id: 1,
          snapshot: 'snapshot_data',
          documents: [],
        },
      };

      mockHttpHelperV2.mockResolvedValue(mockResponse);

      const result = await getDocumentSnapshot({
        document_id: 123,
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'document/123/snapshot',
        method: 'GET',
        headers: {},
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle error when fetching document snapshot', async () => {
      const mockError = {
        message: 'Network error',
        status: 500,
      };

      mockHttpHelperV2.mockRejectedValue(mockError);

      try {
        await getDocumentSnapshot({
          document_id: 123,
          token: 'test-token',
        }, thunkAPI);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('downloadAllDocuments', () => {
    it('should download all documents successfully', async () => {
      const mockResponse = {
        success: true,
        downloadUrl: 'http://example.com/download',
      };

      mockHttpHelperV2.mockResolvedValue(mockResponse);

      const result = await downloadAllDocuments({
        document_id: 456,
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'document/456/snapshot/download-all',
        method: 'GET',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle error when downloading all documents', async () => {
      const mockError = {
        message: 'Download failed',
        status: 500,
        response: { data: 'Error details' },
      };

      mockHttpHelperV2.mockRejectedValue(mockError);
      thunkAPI.rejectWithValue.mockReturnValue('rejected');

      const result = await downloadAllDocuments({
        document_id: 456,
      }, thunkAPI);

      expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith({
        message: mockError.message,
        status: mockError.status,
        response: mockError.response,
      });
      expect(result).toBe('rejected');
    });

    it('should handle error without response', async () => {
      const mockError = {
        message: 'Network error',
        status: 0,
      };

      mockHttpHelperV2.mockRejectedValue(mockError);
      thunkAPI.rejectWithValue.mockReturnValue('rejected');

      const result = await downloadAllDocuments({
        document_id: 456,
      }, thunkAPI);

      expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith({
        message: mockError.message,
        status: mockError.status,
        response: undefined,
      });
      expect(result).toBe('rejected');
    });
  });

  describe('downloadSingleDocument', () => {
    it('should download single document successfully', async () => {
      const mockResponse = {
        success: true,
        downloadUrl: 'http://example.com/download/doc',
      };

      mockHttpHelperV2.mockResolvedValue(mockResponse);

      const result = await downloadSingleDocument({
        document_id: 789,
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'document/download/789',
        method: 'GET',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle error when downloading single document', async () => {
      const mockError = {
        message: 'Document not found',
        status: 404,
        response: { data: 'Not found' },
      };

      mockHttpHelperV2.mockRejectedValue(mockError);
      thunkAPI.rejectWithValue.mockReturnValue('rejected');

      const result = await downloadSingleDocument({
        document_id: 789,
      }, thunkAPI);

      expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith({
        message: mockError.message,
        status: mockError.status,
        response: mockError.response,
      });
      expect(result).toBe('rejected');
    });

    it('should handle network error', async () => {
      const mockError = {
        message: 'Connection timeout',
        status: 0,
      };

      mockHttpHelperV2.mockRejectedValue(mockError);
      thunkAPI.rejectWithValue.mockReturnValue('rejected');

      const result = await downloadSingleDocument({
        document_id: 789,
      }, thunkAPI);

      expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith({
        message: mockError.message,
        status: mockError.status,
        response: undefined,
      });
      expect(result).toBe('rejected');
    });
  });
});
