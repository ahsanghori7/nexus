import { createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import { fetchData } from 'v2/services/clinkHelpers';
import { httpHelperV2 } from 'v2/services/httpHelper';
import { projectProcurementMockResponse } from 'v2/assets/mock/supplier.mock';

const USE_MOCK = false;

const getProjectProcurement = createAsyncThunk(
  'project/getProjectProcurement',
  async ({ pid }) => {
    if (USE_MOCK) {
      return projectProcurementMockResponse;
    }
    return fetchData('project', 'getProjectProcurement', {
      pid,
    });
  },
);

const getProjectInterests = createAsyncThunk(
  'project/getProjectInterests',
  async ({ pid }) =>
    fetchData('project', 'getProjectInterests', {
      pid,
    }),
);
const getProjectProcurementOverviewV2 = createAsyncThunk(
  'project/getProjectProcurementOverviewV2',
  ({ project_id }) => {
    return httpHelperV2({
      url: `project/${project_id}/procurement_schedule_overview`,
      method: 'GET',
    });
  },
);

const startMilestone = createAsyncThunk(
  'project/startManualMilestone',
  ({ project_id, package_milestone_id }) => {
    return httpHelperV2({
      url: `project/${project_id}/milestone/${package_milestone_id}/start`,
      method: 'PATCH',
    });
  },
);

const addToShortlistSubcontractors = createAsyncThunk(
  'project/addToShortlistSubcontractors',
  async ({ account_ids, projectId, tenderId }) => {
    return httpHelperV2({
      url: `project/${projectId}/tender/${tenderId}/shortlisted-subcontractors`,
      method: 'POST',
      body: account_ids,
    });
  },
);

const fetchShortlistApprovers = createAsyncThunk(
  'project/fetchShortlistApprovers',
  async ({ projectId }) => {
    return httpHelperV2({
      url: `project/${projectId}/shortlisted-subcontractors/approvers`,
      method: 'GET',
    });
  },
);

const fetchApproversWithLevels = createAsyncThunk(
  'project/fetchApproversWithLevels',
  async ({ account_id, approval_type, id, project_id }) => {
    const idParam =
      approval_type === 'tender_enquiry'
        ? `project_id=${project_id}`
        : `id=${id}`;
    const res = await httpHelperV2({
      url: `account/${account_id}/approvers?approval_type=${approval_type}&${idParam}`,
      method: 'GET',
    });
    return res;
  },
);

const fetchApproversShortlistedSubs = createAsyncThunk(
  'project/fetchApproversShortlistedSubs',
  async ({ account_id, approval_type, pid }) => {
    const res = await httpHelperV2({
      url: `account/${account_id}/approvers?approval_type=${approval_type}&project_id=${pid}`,
      method: 'GET',
    });
    return res;
  },
);
const completeMilestone = createAsyncThunk(
  'project/completeManualMilestone',
  ({ project_id, package_milestone_id, actual_end_date }) => {
    return httpHelperV2({
      url: `project/${project_id}/milestone/${package_milestone_id}/complete`,
      method: 'PATCH',
      body: {
        actual_end_date,
      },
    });
  },
);

const deleteShortlistedSubcontractor = createAsyncThunk(
  'project/deleteShortlistedSubcontractor',
  async ({ projectId, tenderId, shortlistedSubcontractorId }) => {
    return httpHelperV2({
      url: `project/${projectId}/tender/${tenderId}/shortlisted-subcontractors/${shortlistedSubcontractorId}`,
      method: 'DELETE',
    });
  },
);

// Submits every draft supplier across every package on the project in one
// request, so the approver receives a single email rather than one per supplier.
const requestBulkShortlistApproval = createAsyncThunk(
  'project/requestBulkShortlistApproval',
  async ({ projectId, selectedApprovers }) => {
    return httpHelperV2({
      url: `project/${projectId}/shortlisted-subcontractors/approvers`,
      method: 'POST',
      body: {
        approvers: selectedApprovers,
      },
    });
  },
);

const approveOrRejectShortlistedSubcontractor = createAsyncThunk(
  'project/approveOrRejectShortlistedSubcontractor',
  async ({ projectId, tenderId, data }) => {
    return httpHelperV2({
      url: `project/${projectId}/tender/${tenderId}/shortlisted-subcontractors/approval`,
      method: 'PATCH',
      body: {
        approvals: data.approvals,
        status: data.status,
        comment: data.comment || '',
      },
    });
  },
)

const getShortlistedSubcontractorLogs = createAsyncThunk(
  'project/getShortlistedSubcontractorLogs',
  async ({ projectId, tenderId, shortlistedSubcontractorId }) => {
    return httpHelperV2({
      url: `project/${projectId}/tender/${tenderId}/shortlisted-subcontractors/${shortlistedSubcontractorId}/logs`,
      method: 'GET',
    });
  },
);

const withdrawShortlistedSubcontractorApproval = createAsyncThunk(
  'project/withdrawShortlistedSubcontractorApproval',
  async ({ projectId, tenderId, shortlistedSubcontractorId }) => {
    return httpHelperV2({
      url: `project/${projectId}/tender/${tenderId}/shortlisted-subcontractors/${shortlistedSubcontractorId}/withdraw`,
      method: 'DELETE',
    });
  },
);

const acknowledgeRejection = createAsyncThunk(
  'project/acknowledgeRejection',
  async ({ projectId, tenderId, shortlistedSubcontractorId }) => {
    return httpHelperV2({
      url: `project/${projectId}/tender/${tenderId}/shortlisted-subcontractors/${shortlistedSubcontractorId}/acknowledge`,
      method: 'PATCH',
      body: { status: 'Rejection Acknowledged' },
    });
  },
);

const sendShortlistedSubcontractorReminder = createAsyncThunk(
  'project/sendShortlistedSubcontractorReminder',
  async ({ projectId, tenderId, shortlistedSubcontractorId, approverId }) => {
    return httpHelperV2({
      url: `project/${projectId}/tender/${tenderId}/shortlisted-subcontractors/${shortlistedSubcontractorId}/approvals/${approverId}/reminder`,
      method: 'POST',
    });
  },
);

const exportProcurementSchedule = createAsyncThunk(
  'project/exportProcurementSchedule',
  async ({ project_id, project_name }) => {
    const token = Cookies.get(API.TOKEN_NAME);
    const response = await fetch(
      `${API.RELAY_URL}project/${project_id}/procurement_schedule_overview/export`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) throw new Error('Export failed');

    const exportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const safeName = (project_name || `Project ${project_id}`).replace(/[/\\?%*:|"<>]/g, '-');
    const filename = `${safeName} - Procurement Schedule Overview - ${exportDate}.xlsx`;

    const blob = await response.blob();
    return { blob, filename };
  },
);

export {
  getProjectProcurement,
  getProjectInterests,
  getProjectProcurementOverviewV2,
  startMilestone,
  completeMilestone,
  addToShortlistSubcontractors,
  fetchShortlistApprovers,
  fetchApproversWithLevels,
  fetchApproversShortlistedSubs,
  deleteShortlistedSubcontractor,
  requestBulkShortlistApproval,
  getShortlistedSubcontractorLogs,
  approveOrRejectShortlistedSubcontractor,
  withdrawShortlistedSubcontractorApproval,
  acknowledgeRejection,
  sendShortlistedSubcontractorReminder,
  exportProcurementSchedule,
};
