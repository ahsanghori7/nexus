const mockHttpV2 = jest.fn();

jest.mock('@reduxjs/toolkit', () => ({
  createAsyncThunk: jest.fn((_, payloadCreator) => payloadCreator),
}));

jest.mock('v2/services/httpHelper', () => ({
  __esModule: true,
  httpHelperV2: (...args) => mockHttpV2(...args),
}));

const {
  assignTenderInquiryApprover,
  approveRejectInquiry,
  acknowledgeRejectionFeedback,
  sendTenderInquiryReminder,
  assignedApproversTenderInquiry,
} = require('v2/store/reducers/clink/tender-inquiry/asyncThunk');

describe('tender inquiry async thunks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assignTenderInquiryApprover', () => {
    it('should assign tender inquiry approver with correct parameters', async () => {
      const mockResponse = { success: true, message: 'Approver assigned successfully' };
      mockHttpV2.mockResolvedValueOnce(mockResponse);

      const payload = { user_ids: [1] };
      const result = await assignTenderInquiryApprover({
        project_id: 23757,
        did: 8,
        tenderId: 100,
        data: payload,
      });

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/23757/tender/100/tender_inquiry/8/approvals',
        method: 'POST',
        body: payload,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle multiple user IDs', async () => {
      const mockResponse = { success: true };
      mockHttpV2.mockResolvedValueOnce(mockResponse);

      const payload = { user_ids: [1, 2, 3] };
      const result = await assignTenderInquiryApprover({
        project_id: 100,
        did: 50,
        tenderId: 200,
        data: payload,
      });

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/100/tender/200/tender_inquiry/50/approvals',
        method: 'POST',
        body: payload,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      mockHttpV2.mockRejectedValueOnce(mockError);

      try {
        await assignTenderInquiryApprover({
          project_id: 1,
          did: 2,
          tenderId: 3,
          data: { user_ids: [1] },
        });
        // Should not reach here
        throw new Error('Expected assignTenderInquiryApprover to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe('Network error');
      }

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/1/tender/3/tender_inquiry/2/approvals',
        method: 'POST',
        body: { user_ids: [1] },
      });
    });

    it('should handle 400 Bad Request errors', async () => {
      const mockError = {
        message: 'Invalid user ID',
        status: 400,
        response: { data: { message: 'Invalid user ID' } },
      };
      mockHttpV2.mockRejectedValueOnce(mockError);

      try {
        await assignTenderInquiryApprover({
          project_id: 999,
          did: 888,
          data: { user_ids: [-1] },
        });
        throw new Error('Expected assignTenderInquiryApprover to throw');
      } catch (e) {
        expect(e.message).toBe('Invalid user ID');
        expect(e.status).toBe(400);
      }
    });

    it('should handle 404 Not Found errors', async () => {
      const mockError = {
        message: 'Tender inquiry not found',
        status: 404,
        response: { data: { message: 'Tender inquiry not found' } },
      };
      mockHttpV2.mockRejectedValueOnce(mockError);

      try {
        await assignTenderInquiryApprover({
          project_id: 999,
          did: 999,
          data: { user_ids: [1] },
        });
        throw new Error('Expected assignTenderInquiryApprover to throw');
      } catch (e) {
        expect(e.message).toBe('Tender inquiry not found');
        expect(e.status).toBe(404);
      }
    });

    it('should call httpHelperV2 exactly once per invocation', async () => {
      mockHttpV2.mockResolvedValueOnce({ success: true });

      await assignTenderInquiryApprover({
        project_id: 10,
        did: 20,
        tenderId: 30,
        data: { user_ids: [5] },
      });

      expect(mockHttpV2).toHaveBeenCalledTimes(1);
    });
  });

  describe('acknowledgeRejectionFeedback', () => {
    it('acknowledges a rejection with the correct url, method, and status body', async () => {
      const mockResponse = { success: true };
      mockHttpV2.mockResolvedValueOnce(mockResponse);

      const result = await acknowledgeRejectionFeedback({
        project_id: 23869,
        did: 75289,
      });

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/23869/tender_inquiry/75289',
        method: 'PATCH',
        body: { status: 'Rejection Acknowledged' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('propagates errors from the API', async () => {
      const mockError = new Error('Network error');
      mockHttpV2.mockRejectedValueOnce(mockError);

      await expect(
        acknowledgeRejectionFeedback({ project_id: 1, did: 2 }),
      ).rejects.toThrow('Network error');
    });
  });

  describe('approveRejectInquiry', () => {
    it('should approve tender inquiry with correct parameters', async () => {
      const mockResponse = { success: true, message: 'Tender inquiry approved' };
      mockHttpV2.mockResolvedValueOnce(mockResponse);

      const payload = { status: 'Approved' };
      const result = await approveRejectInquiry({
        project_id: 23757,
        did: 8,
        tenderId: 100,
        approver_id: 5,
        data: payload,
      });

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/23757/tender/100/tender_inquiry/8/approval/5',
        method: 'PUT',
        body: payload,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should reject tender inquiry with feedback', async () => {
      const mockResponse = { success: true, message: 'Tender inquiry rejected' };
      mockHttpV2.mockResolvedValueOnce(mockResponse);

      const payload = { status: 'Rejected', feedback: 'Does not meet requirements' };
      const result = await approveRejectInquiry({
        project_id: 100,
        did: 50,
        tenderId: 200,
        approver_id: 10,
        data: payload,
      });

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/100/tender/200/tender_inquiry/50/approval/10',
        method: 'PUT',
        body: payload,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Unauthorized');
      mockHttpV2.mockRejectedValueOnce(mockError);

      try {
        await approveRejectInquiry({
          project_id: 1,
          did: 2,
          tenderId: 3,
          approver_id: 4,
          data: { status: 'Approved' },
        });
        throw new Error('Expected approveRejectInquiry to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe('Unauthorized');
      }

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/1/tender/3/tender_inquiry/2/approval/4',
        method: 'PUT',
        body: { status: 'Approved' },
      });
    });

    it('should handle 404 Not Found errors', async () => {
      const mockError = {
        message: 'Approver not found',
        status: 404,
        response: { data: { message: 'Approver not found' } },
      };
      mockHttpV2.mockRejectedValueOnce(mockError);

      try {
        await approveRejectInquiry({
          project_id: 999,
          did: 888,
          tenderId: 777,
          approver_id: 666,
          data: { status: 'Approved' },
        });
        throw new Error('Expected approveRejectInquiry to throw');
      } catch (e) {
        expect(e.message).toBe('Approver not found');
        expect(e.status).toBe(404);
      }
    });

    it('should call httpHelperV2 exactly once per invocation', async () => {
      mockHttpV2.mockResolvedValueOnce({ success: true });

      await approveRejectInquiry({
        project_id: 10,
        did: 20,
        tenderId: 30,
        approver_id: 40,
        data: { status: 'Approved' },
      });

      expect(mockHttpV2).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendTenderInquiryReminder', () => {
    it('should send tender inquiry reminder with correct parameters', async () => {
      const mockResponse = { success: true, message: 'Reminder sent successfully' };
      mockHttpV2.mockResolvedValueOnce(mockResponse);

      const result = await sendTenderInquiryReminder({
        project_id: 23869,
        tender_id: 43634,
        tender_inquiry_id: 75296,
        approver_id: 456,
      });

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/23869/tender/43634/tender_inquiry/75296/approvers',
        method: 'POST',
        body: { data: { approver_id: 456 } },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle successful reminder send', async () => {
      const mockResponse = { success: true, message: 'Reminder sent to approvers' };
      mockHttpV2.mockResolvedValueOnce(mockResponse);

      const result = await sendTenderInquiryReminder({
        project_id: 100,
        tender_id: 200,
        tender_inquiry_id: 300,
        approver_id: 456,
      });

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/100/tender/200/tender_inquiry/300/approvers',
        method: 'POST',
        body: { data: { approver_id: 456 } },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Failed to send reminder');
      mockHttpV2.mockRejectedValueOnce(mockError);

      try {
        await sendTenderInquiryReminder({
          project_id: 1,
          tender_id: 2,
          tender_inquiry_id: 3,
          approver_id: 456,
        });
        // Should not reach here
        throw new Error('Expected sendTenderInquiryReminder to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe('Failed to send reminder');
      }

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/1/tender/2/tender_inquiry/3/approvers',
        method: 'POST',
        body: { data: { approver_id: 456 } },
      });
    });

    it('should handle 404 Not Found errors', async () => {
      const mockError = {
        message: 'Tender inquiry not found',
        status: 404,
        response: { data: { message: 'Tender inquiry not found' } },
      };
      mockHttpV2.mockRejectedValueOnce(mockError);

      try {
        await sendTenderInquiryReminder({
          project_id: 999,
          tender_id: 888,
          tender_inquiry_id: 777,
        });
        throw new Error('Expected sendTenderInquiryReminder to throw');
      } catch (e) {
        expect(e.message).toBe('Tender inquiry not found');
        expect(e.status).toBe(404);
      }
    });

    it('should handle 400 Bad Request errors', async () => {
      const mockError = {
        message: 'No approvers assigned',
        status: 400,
        response: { data: { message: 'No approvers assigned' } },
      };
      mockHttpV2.mockRejectedValueOnce(mockError);

      try {
        await sendTenderInquiryReminder({
          project_id: 100,
          tender_id: 200,
          tender_inquiry_id: 300,
        });
        throw new Error('Expected sendTenderInquiryReminder to throw');
      } catch (e) {
        expect(e.message).toBe('No approvers assigned');
        expect(e.status).toBe(400);
      }
    });

    it('should handle 401 Unauthorized errors', async () => {
      const mockError = {
        message: 'Unauthorized',
        status: 401,
        response: { data: { message: 'Unauthorized' } },
      };
      mockHttpV2.mockRejectedValueOnce(mockError);

      try {
        await sendTenderInquiryReminder({
          project_id: 10,
          tender_id: 20,
          tender_inquiry_id: 30,
        });
        throw new Error('Expected sendTenderInquiryReminder to throw');
      } catch (e) {
        expect(e.message).toBe('Unauthorized');
        expect(e.status).toBe(401);
      }
    });

    it('should call httpHelperV2 exactly once per invocation', async () => {
      mockHttpV2.mockResolvedValueOnce({ success: true });

      await sendTenderInquiryReminder({
        project_id: 10,
        tender_id: 20,
        tender_inquiry_id: 30,
      });

      expect(mockHttpV2).toHaveBeenCalledTimes(1);
    });

    it('should send reminder with different project IDs', async () => {
      const mockResponse = { success: true };
      mockHttpV2.mockResolvedValueOnce(mockResponse);

      await sendTenderInquiryReminder({
        project_id: 12345,
        tender_id: 67890,
        tender_inquiry_id: 11111,
        approver_id: 456,
      });

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/12345/tender/67890/tender_inquiry/11111/approvers',
        method: 'POST',
        body: { data: { approver_id: 456 } },
      });
      expect(mockHttpV2).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      mockHttpV2.mockRejectedValueOnce(networkError);

      try {
        await sendTenderInquiryReminder({
          project_id: 1,
          tender_id: 2,
          tender_inquiry_id: 3,
        });
        throw new Error('Expected sendTenderInquiryReminder to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe('Network request failed');
      }
    });
  });

  describe('assignedApproversTenderInquiry', () => {
    it('should fetch all assigned approvers for a project when tender_inquiry_id is omitted', async () => {
      const mockResponse = { 75324: { isLevel: true, approvals: [] } };
      mockHttpV2.mockResolvedValueOnce(mockResponse);

      const result = await assignedApproversTenderInquiry({
        project_id: 23869,
      });

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/23869/tender_inquiry/assigned-approvers',
        method: 'GET',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should append ti_id as a query param when tender_inquiry_id is provided', async () => {
      const mockResponse = { 75289: { isLevel: false, approvals: [] } };
      mockHttpV2.mockResolvedValueOnce(mockResponse);

      const result = await assignedApproversTenderInquiry({
        project_id: 23869,
        tender_inquiry_id: 75289,
      });

      expect(mockHttpV2).toHaveBeenCalledWith({
        url: 'project/23869/tender_inquiry/assigned-approvers?ti_id=75289',
        method: 'GET',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      mockHttpV2.mockRejectedValueOnce(mockError);

      try {
        await assignedApproversTenderInquiry({ project_id: 999 });
        throw new Error('Expected assignedApproversTenderInquiry to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe('Network error');
      }
    });

    it('should call httpHelperV2 exactly once per invocation', async () => {
      mockHttpV2.mockResolvedValueOnce({});

      await assignedApproversTenderInquiry({ project_id: 10 });

      expect(mockHttpV2).toHaveBeenCalledTimes(1);
    });
  });
});

