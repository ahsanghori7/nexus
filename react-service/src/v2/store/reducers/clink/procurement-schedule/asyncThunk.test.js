import {
  getProjectProcurement,
  getProjectInterests,
  getProjectProcurementOverviewV2,
  startMilestone,
  completeMilestone,
  addToShortlistSubcontractors,
  fetchShortlistApprovers,
  fetchApproversWithLevels,
  deleteShortlistedSubcontractor,
  requestBulkShortlistApproval,
  getShortlistedSubcontractorLogs,
  approveOrRejectShortlistedSubcontractor,
  withdrawShortlistedSubcontractorApproval,
  acknowledgeRejection,
  exportProcurementSchedule
} from './asyncThunk';
import { fetchData } from 'v2/services/clinkHelpers';
import { httpHelperV2 } from 'v2/services/httpHelper';

jest.mock('v2/services/clinkHelpers', () => ({
  fetchData: jest.fn(),
}));

jest.mock('js-cookie', () => ({ get: jest.fn(() => 'test-token') }));
jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: jest.fn(),
}));

describe('procurement-schedule asyncThunk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjectProcurement', () => {
    it('should create getProjectProcurement with correct type', () => {
      expect(getProjectProcurement.typePrefix).toBe('project/getProjectProcurement');
    });

    it('should call fetchData with correct parameters', async () => {
      const mockData = { packages: [{ id: 1, name: 'Package 1' }] };
      fetchData.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();
      const params = { pid: 123 };

      const result = await getProjectProcurement(params)(dispatch, getState, undefined);

      expect(fetchData).toHaveBeenCalledWith('project', 'getProjectProcurement', {
        pid: 123,
      });
      expect(result.payload).toEqual(mockData);
    });

    it('should handle getProjectProcurement with different pid', async () => {
      const mockData = { packages: [] };
      fetchData.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();
      const params = { pid: 456 };

      const result = await getProjectProcurement(params)(dispatch, getState, undefined);

      expect(fetchData).toHaveBeenCalledWith('project', 'getProjectProcurement', {
        pid: 456,
      });
      expect(result.payload).toEqual(mockData);
    });

    it('should handle getProjectProcurement failure', async () => {
      fetchData.mockRejectedValue(new Error('Network error'));

      const dispatch = jest.fn();
      const getState = jest.fn();
      const params = { pid: 123 };

      const result = await getProjectProcurement(params)(dispatch, getState, undefined);

      expect(result.type).toBe('project/getProjectProcurement/rejected');
      expect(result.error.message).toBe('Network error');
    });
  });

  describe('getProjectInterests', () => {
    it('should create getProjectInterests with correct type', () => {
      expect(getProjectInterests.typePrefix).toBe('project/getProjectInterests');
    });

    it('should call fetchData with correct parameters', async () => {
      const mockData = { interests: [{ id: 1, name: 'Interest 1' }] };
      fetchData.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();
      const params = { pid: 123 };

      const result = await getProjectInterests(params)(dispatch, getState, undefined);

      expect(fetchData).toHaveBeenCalledWith('project', 'getProjectInterests', {
        pid: 123,
      });
      expect(result.payload).toEqual(mockData);
    });

    it('should handle getProjectInterests with different pid', async () => {
      const mockData = { interests: [] };
      fetchData.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();
      const params = { pid: 789 };

      const result = await getProjectInterests(params)(dispatch, getState, undefined);

      expect(fetchData).toHaveBeenCalledWith('project', 'getProjectInterests', {
        pid: 789,
      });
      expect(result.payload).toEqual(mockData);
    });

    it('should handle getProjectInterests failure', async () => {
      fetchData.mockRejectedValue(new Error('API error'));

      const dispatch = jest.fn();
      const getState = jest.fn();
      const params = { pid: 123 };

      const result = await getProjectInterests(params)(dispatch, getState, undefined);

      expect(result.type).toBe('project/getProjectInterests/rejected');
      expect(result.error.message).toBe('API error');
    });
  });

  describe('exportProcurementSchedule', () => {
    const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dispatch = jest.fn();
    const getState = jest.fn();

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should create exportProcurementSchedule with correct type', () => {
      expect(exportProcurementSchedule.typePrefix).toBe('project/exportProcurementSchedule');
    });

    it('should return blob and formatted filename with project name and date', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        headers: { get: jest.fn(() => null) },
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      const result = await exportProcurementSchedule({ project_id: 123, project_name: 'Test Project' })(dispatch, getState, undefined);

      expect(result.payload.filename).toMatch(/^Test Project - Procurement Schedule Overview - \d{1,2} \w+ \d{4}\.xlsx$/);
      expect(result.payload.blob).toBe(mockBlob);
    });

    it('should use fallback project name when project_name is not provided', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        headers: { get: jest.fn(() => null) },
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      const result = await exportProcurementSchedule({ project_id: 123 })(dispatch, getState, undefined);

      expect(result.payload.filename).toMatch(/^Project 123 - Procurement Schedule Overview - \d{1,2} \w+ \d{4}\.xlsx$/);
    });

    it('should reject when response is not ok', async () => {
      global.fetch.mockResolvedValue({ ok: false });

      const result = await exportProcurementSchedule({ project_id: 123 })(dispatch, getState, undefined);

      expect(result.type).toBe('project/exportProcurementSchedule/rejected');
      expect(result.error.message).toBe('Export failed');
    });

    it('should reject on network error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await exportProcurementSchedule({ project_id: 123 })(dispatch, getState, undefined);

      expect(result.type).toBe('project/exportProcurementSchedule/rejected');
      expect(result.error.message).toBe('Network error');
    });

    it('should call fetch with correct URL and auth header', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        headers: { get: jest.fn(() => null) },
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      await exportProcurementSchedule({ project_id: 42 })(dispatch, getState, undefined);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('project/42/procurement_schedule_overview/export'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        }),
      );
    });
  });

  describe('async thunk integration', () => {
    it('should handle both thunks successfully', async () => {
      const procurementData = { packages: [{ id: 1, name: 'Package 1' }] };
      const interestsData = { interests: [{ id: 1, name: 'Interest 1' }] };

      fetchData
        .mockResolvedValueOnce(procurementData)
        .mockResolvedValueOnce(interestsData);

      const dispatch = jest.fn();
      const getState = jest.fn();
      const params = { pid: 123 };

      const procurementResult = await getProjectProcurement(params)(dispatch, getState, undefined);
      const interestsResult = await getProjectInterests(params)(dispatch, getState, undefined);

      expect(procurementResult.payload).toEqual(procurementData);
      expect(interestsResult.payload).toEqual(interestsData);
      expect(fetchData).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success/failure scenarios', async () => {
      const procurementData = { packages: [{ id: 1, name: 'Package 1' }] };

      fetchData
        .mockResolvedValueOnce(procurementData)
        .mockRejectedValueOnce(new Error('Interest fetch failed'));

      const dispatch = jest.fn();
      const getState = jest.fn();
      const params = { pid: 123 };

      const procurementResult = await getProjectProcurement(params)(dispatch, getState, undefined);
      const interestsResult = await getProjectInterests(params)(dispatch, getState, undefined);

      expect(procurementResult.type).toBe('project/getProjectProcurement/fulfilled');
      expect(procurementResult.payload).toEqual(procurementData);

      expect(interestsResult.type).toBe('project/getProjectInterests/rejected');
      expect(interestsResult.error.message).toBe('Interest fetch failed');
    });
  });

  describe('getProjectProcurementOverviewV2', () => {
    it('should fetch procurement overview successfully', async () => {
      const mockData = { overview: 'data' };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await getProjectProcurementOverviewV2({ project_id: 123 })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/procurement_schedule_overview',
        method: 'GET',
      });
      expect(result.payload).toEqual(mockData);
    });
  });

  describe('startMilestone', () => {
    it('should start milestone successfully', async () => {
      const mockData = { success: true };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await startMilestone({
        project_id: 123,
        package_milestone_id: 456,
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/milestone/456/start',
        method: 'PATCH',
      });
      expect(result.payload).toEqual(mockData);
    });
  });

  describe('completeMilestone', () => {
    it('should complete milestone successfully', async () => {
      const mockData = { success: true };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await completeMilestone({
        project_id: 123,
        package_milestone_id: 456,
        actual_end_date: '2024-01-01',
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/milestone/456/complete',
        method: 'PATCH',
        body: {
          actual_end_date: '2024-01-01',
        },
      });
      expect(result.payload).toEqual(mockData);
    });
  });

  describe('addToShortlistSubcontractors', () => {
    it('should add subcontractors to shortlist successfully', async () => {
      const mockData = { success: true };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await addToShortlistSubcontractors({
        account_ids: [1, 2, 3],
        projectId: 123,
        tenderId: 456,
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/tender/456/shortlisted-subcontractors',
        method: 'POST',
        body: [1, 2, 3],
      });
      expect(result.payload).toEqual(mockData);
    });
  });

  describe('fetchShortlistApprovers', () => {
    it('should fetch shortlist approvers successfully', async () => {
      const mockData = { approvers: [] };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await fetchShortlistApprovers({
        projectId: 123,
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/shortlisted-subcontractors/approvers',
        method: 'GET',
      });
      expect(result.payload).toEqual(mockData);
    });
  });

  describe('fetchApproversWithLevels', () => {
    it('should fetch approvers by id when approval_type is order', async () => {
      const mockData = { approvers: [] };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await fetchApproversWithLevels({
        account_id: 123,
        approval_type: 'order',
        id: 456,
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/123/approvers?approval_type=order&id=456',
        method: 'GET',
      });
      expect(result.payload).toEqual(mockData);
    });

    it('should fetch approvers by project_id when approval_type is tender_enquiry', async () => {
      const mockData = { approvers: [] };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await fetchApproversWithLevels({
        account_id: 123,
        approval_type: 'tender_enquiry',
        id: 456,
        project_id: 789,
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'account/123/approvers?approval_type=tender_enquiry&project_id=789',
        method: 'GET',
      });
      expect(result.payload).toEqual(mockData);
    });
  });

  describe('deleteShortlistedSubcontractor', () => {
    it('should delete shortlisted subcontractor successfully', async () => {
      const mockData = { success: true };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await deleteShortlistedSubcontractor({
        projectId: 123,
        tenderId: 456,
        shortlistedSubcontractorId: 789,
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/tender/456/shortlisted-subcontractors/789',
        method: 'DELETE',
      });
      expect(result.payload).toEqual(mockData);
    });
  });

  describe('requestBulkShortlistApproval', () => {
    it('posts to the project-level endpoint without supplier ids', async () => {
      const mockData = { success: true, suppliers: 4, packages: 2 };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await requestBulkShortlistApproval({
        projectId: 123,
        selectedApprovers: [{ user_id: 1, approval_level_id: 2 }],
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/shortlisted-subcontractors/approvers',
        method: 'POST',
        body: {
          approvers: [{ user_id: 1, approval_level_id: 2 }],
        },
      });
      expect(result.payload).toEqual(mockData);
    });
  });

  describe('approveOrRejectShortlistedSubcontractor', () => {
    it('should approve shortlisted subcontractor successfully', async () => {
      const mockData = { success: true };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await approveOrRejectShortlistedSubcontractor({
        projectId: 123,
        tenderId: 456,
        data: { status: 'approved', comment: 'Looks good', approvals: undefined },
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/tender/456/shortlisted-subcontractors/approval',
        method: 'PATCH',
        body: {
          approvals: undefined,
          status: 'approved',
          comment: 'Looks good',
        },
      });
      expect(result.payload).toEqual(mockData);
    });

    it('should handle approval with empty comment', async () => {
      const mockData = { success: true };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await approveOrRejectShortlistedSubcontractor({
        projectId: 123,
        tenderId: 456,
        data: { status: 'rejected', approvals: undefined },
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/tender/456/shortlisted-subcontractors/approval',
        method: 'PATCH',
        body: {
          approvals: undefined,
          status: 'rejected',
          comment: '',
        },
      });
      expect(result.payload).toEqual(mockData);
    });
  });

  describe('getShortlistedSubcontractorLogs', () => {
    it('should get shortlisted subcontractor logs successfully', async () => {
      const mockData = { logs: [] };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await getShortlistedSubcontractorLogs({
        projectId: 123,
        tenderId: 456,
        shortlistedSubcontractorId: 789,
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/tender/456/shortlisted-subcontractors/789/logs',
        method: 'GET',
      });
      expect(result.payload).toEqual(mockData);
    });
  });

  describe('withdrawShortlistedSubcontractorApproval', () => {
    it('should withdraw shortlisted subcontractor approval successfully', async () => {
      const mockData = { success: true };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await withdrawShortlistedSubcontractorApproval({
        projectId: 123,
        tenderId: 456,
        shortlistedSubcontractorId: 789,
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/tender/456/shortlisted-subcontractors/789/withdraw',
        method: 'DELETE',
      });
      expect(result.payload).toEqual(mockData);
    });
  });

  describe('acknowledgeRejection', () => {
    it('should acknowledge rejection successfully', async () => {
      const mockData = { success: true };
      httpHelperV2.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await acknowledgeRejection({
        projectId: 123,
        tenderId: 456,
        shortlistedSubcontractorId: 789,
      })(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'project/123/tender/456/shortlisted-subcontractors/789/acknowledge',
        method: 'PATCH',
        body: { status: 'Rejection Acknowledged' },
      });
      expect(result.payload).toEqual(mockData);
    });
  });
});