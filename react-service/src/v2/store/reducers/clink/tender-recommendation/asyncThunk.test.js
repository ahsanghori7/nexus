const mockHttpHelper = jest.fn();
const mockHttpHelperV2 = jest.fn();

jest.mock('@reduxjs/toolkit', () => ({
  createAsyncThunk: jest.fn((_, payloadCreator) => payloadCreator),
}));

jest.mock('v2/services/httpHelper', () => ({
  __esModule: true,
  default: (...args) => mockHttpHelper(...args),
  httpHelperV2: (...args) => mockHttpHelperV2(...args),
}));

const {
  uploadTenderRecommendationAttachments,
  getTenderRecommendationAttachments,
  deleteTenderRecommendationAttachment,
  getTenderRecommendations,
  createTenderRecommendationForm,
  getTenderRecommendationById,
  updateTenderRecommendationById,
  saveAsDraftTenderRecommendationById,
  getTenderRecommendationPricingSummary,
  updateTenderRecommendationPricingSummary,
  getTenderRecommendationApprovers,
  assignTenderRecommendationApprover,
  withDrawTenderRecommendation,
  sendTrApprovalReminder,
  approveOrRejectTenderRecommendation,
  getAuditLogsTenderRecommendationById,
} = require('./asyncThunk');

describe('Tender Recommendation AsyncThunks', () => {
  const thunkAPI = { rejectWithValue: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    thunkAPI.rejectWithValue.mockReset();
    mockHttpHelper.mockResolvedValue({ data: {} });
    mockHttpHelperV2.mockResolvedValue({ data: {} });
  });

  describe('getTenderRecommendations', () => {
    it('should fetch tender recommendations successfully', async () => {
      const mockResponse = { data: [{ id: 1 }, { id: 2 }] };
      mockHttpHelper.mockResolvedValue(mockResponse);

      const result = await getTenderRecommendations({ project_id: 100 }, thunkAPI);

      expect(mockHttpHelper).toHaveBeenCalledWith({
        url: 'project/100/tender_recommendation',
        method: 'GET',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createTenderRecommendationForm', () => {
    it('should create tender recommendation form successfully', async () => {
      const mockResponse = { id: 1, title: 'New Recommendation' };
      mockHttpHelper.mockResolvedValue(mockResponse);

      const result = await createTenderRecommendationForm({
        project_id: 100,
        data: { title: 'New' },
      }, thunkAPI);

      expect(mockHttpHelper).toHaveBeenCalledWith({
        url: 'project/100/tender_recommendation/create',
        method: 'POST',
        body: { title: 'New' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should reject when response has no id', async () => {
      const mockResponse = { message: 'Error creating recommendation' };
      mockHttpHelper.mockResolvedValue(mockResponse);
      thunkAPI.rejectWithValue.mockReturnValue('rejected');

      const result = await createTenderRecommendationForm({
        project_id: 100,
        data: {},
      }, thunkAPI);

      expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith(mockResponse.message);
      expect(result).toBe('rejected');
    });
  });

  describe('getTenderRecommendationById', () => {
    it('should fetch tender recommendation by id successfully', async () => {
      const mockResponse = { data: { id: 1, title: 'Recommendation 1' } };
      mockHttpHelper.mockResolvedValue(mockResponse);

      const result = await getTenderRecommendationById({ project_id: 100, tid: 1 }, thunkAPI);

      expect(mockHttpHelper).toHaveBeenCalledWith({
        url: 'project/100/tender_recommendation/1',
        method: 'GET',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateTenderRecommendationById', () => {
    it('should update tender recommendation by id successfully', async () => {
      const mockResponse = { id: 1, title: 'Updated' };
      mockHttpHelper.mockResolvedValue(mockResponse);

      const result = await updateTenderRecommendationById({
        project_id: 100,
        tid: 1,
        data: { title: 'Updated' },
      }, thunkAPI);

      expect(mockHttpHelper).toHaveBeenCalledWith({
        url: 'project/100/tender_recommendation/1',
        method: 'PATCH',
        body: { title: 'Updated' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('saveAsDraftTenderRecommendationById', () => {
    it('should save tender recommendation as draft successfully', async () => {
      const mockResponse = { id: 1, status: 'draft' };
      mockHttpHelper.mockResolvedValue(mockResponse);

      const result = await saveAsDraftTenderRecommendationById({
        project_id: 100,
        tid: 1,
        data: { title: 'Draft' },
      }, thunkAPI);

      expect(mockHttpHelper).toHaveBeenCalledWith({
        url: 'project/100/tender_recommendation/1/save_as_draft',
        method: 'PATCH',
        body: { title: 'Draft' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle save draft error', async () => {
      const mockError = {
        message: 'Server error',
        status: 500,
        response: { data: 'Error' },
      };
      mockHttpHelper.mockRejectedValue(mockError);
      thunkAPI.rejectWithValue.mockReturnValue('rejected');

      const result = await saveAsDraftTenderRecommendationById({
        project_id: 100,
        tid: 1,
        data: {},
      }, thunkAPI);

      expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith({
        message: mockError.message,
        status: mockError.status,
        response: mockError.response,
      });
      expect(result).toBe('rejected');
    });
  });

  describe('getTenderRecommendationPricingSummary', () => {
    it('should fetch pricing summary successfully', async () => {
      const mockResponse = { data: { total: 10000 } };
      mockHttpHelper.mockResolvedValue(mockResponse);

      const result = await getTenderRecommendationPricingSummary({
        project_id: 100,
        package_id: 10,
      }, thunkAPI);

      expect(mockHttpHelper).toHaveBeenCalledWith({
        url: 'project/100/package/10/quotes',
        method: 'GET',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateTenderRecommendationPricingSummary', () => {
    it('should update pricing summary successfully', async () => {
      const mockResponse = { success: true };
      mockHttpHelper.mockResolvedValue(mockResponse);

      const result = await updateTenderRecommendationPricingSummary({
        project_id: 100,
        package_id: 10,
        transaction_id: 5,
        data: { amount: 5000 },
      }, thunkAPI);

      expect(mockHttpHelper).toHaveBeenCalledWith({
        url: 'project/100/package/10/quote/5',
        method: 'PATCH',
        body: { amount: 5000 },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTenderRecommendationApprovers', () => {
    it('should fetch approvers successfully', async () => {
      const mockResponse = [{ id: 1 }, { id: 2 }];
      mockHttpHelper.mockResolvedValue(mockResponse);

      const result = await getTenderRecommendationApprovers({
        project_id: 100,
        tid: 1,
      }, thunkAPI);

      expect(mockHttpHelper).toHaveBeenCalledWith({
        url: 'project/100/tender_recommendation/1/approvers',
        method: 'GET',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('assignTenderRecommendationApprover', () => {
    it('should assign approver successfully', async () => {
      const mockResponse = { success: true };
      mockHttpHelperV2.mockResolvedValue(mockResponse);

      const result = await assignTenderRecommendationApprover({
        project_id: 100,
        tid: 1,
        data: { approver_id: 5 },
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'project/100/tender_recommendation/1/approvals',
        method: 'POST',
        body: { approver_id: 5 },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('withDrawTenderRecommendation', () => {
    it('should withdraw tender recommendation successfully', async () => {
      const mockResponse = { success: true };
      mockHttpHelperV2.mockResolvedValue(mockResponse);

      const result = await withDrawTenderRecommendation({
        project_id: 100,
        tid: 1,
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'project/100/tender_recommendation/1/approvals/withdraw',
        method: 'DELETE',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendTrApprovalReminder', () => {
    it('should send approval reminder successfully', async () => {
      const mockResponse = { success: true };
      mockHttpHelperV2.mockResolvedValue(mockResponse);

      const result = await sendTrApprovalReminder({
        project_id: 100,
        tid: 1,
        approval_id: 5,
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'project/100/tender_recommendation/1/approvals/5/reminder',
        method: 'POST',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAuditLogsTenderRecommendationById', () => {
    it('should fetch audit logs successfully', async () => {
      const mockResponse = { logs: [{ id: 1 }, { id: 2 }] };
      mockHttpHelperV2.mockResolvedValue(mockResponse);

      const result = await getAuditLogsTenderRecommendationById({
        project_id: 100,
        tender_recommendation_id: 1,
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'project/100/tender_recommendation/1/logs',
        method: 'GET',
      });
      expect(result).toEqual(mockResponse.logs);
    });
  });

  describe('approveOrRejectTenderRecommendation', () => {
    it('should approve or reject tender recommendation successfully', async () => {
      const mockResponse = { success: true };
      mockHttpHelperV2.mockResolvedValue(mockResponse);

      const result = await approveOrRejectTenderRecommendation({
        project_id: 100,
        tender_recommendation_id: 1,
        approver_id: 5,
        data: { status: 'approved' },
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'project/100/tender_recommendation/1/approval/5',
        method: 'PUT',
        body: { status: 'approved' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('uploadTenderRecommendationAttachments', () => {
    it('should upload attachments successfully', async () => {
      const mockResponse = { success: true };
      mockHttpHelperV2.mockResolvedValue(mockResponse);

      const result = await uploadTenderRecommendationAttachments({
        project_id: 100,
        tid: 10,
        trid: 1,
        formData: {},
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'project/100/tender/10/tender_recommendation/1/upload_attachments',
        method: 'POST',
        body: {},
        isFormData: true,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTenderRecommendationAttachments', () => {
    it('should fetch attachments successfully', async () => {
      const mockAttachments = [{ id: 1 }, { id: 2 }];
      mockHttpHelperV2.mockResolvedValue(mockAttachments);

      const result = await getTenderRecommendationAttachments({
        project_id: 100,
        tid: 10,
        trid: 1,
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'project/100/tender/10/tender_recommendation/1/attachments',
        method: 'GET',
      });
      expect(result).toEqual(mockAttachments);
    });
  });

  describe('deleteTenderRecommendationAttachment', () => {
    it('should delete attachment successfully', async () => {
      const mockResponse = { success: true };
      mockHttpHelperV2.mockResolvedValue(mockResponse);

      const result = await deleteTenderRecommendationAttachment({
        project_id: 100,
        tid: 1,
        trid: 10,
        attachment_id: 5,
      }, thunkAPI);

      expect(mockHttpHelperV2).toHaveBeenCalledWith({
        url: 'project/100/tender/1/tender_recommendation/10/attachments/5',
        method: 'DELETE',
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
