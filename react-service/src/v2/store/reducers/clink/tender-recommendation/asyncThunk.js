import { createAsyncThunk } from '@reduxjs/toolkit';
import httpHelper, { httpHelperV2 } from 'v2/services/httpHelper';

const getTenderRecommendations = createAsyncThunk(
  'tender_recommendation/get',
  async ({ project_id }) => {
    const response = await httpHelper({
      url: `project/${project_id}/tender_recommendation`,
      method: 'GET',
    });
    return response?.data;
  },
);
const createTenderRecommendationForm = createAsyncThunk(
  'tender_recommendation/createTenderRecommendationForm',
  async ({ project_id, data }, { rejectWithValue }) => {
    const response = await httpHelper({
      url: `project/${project_id}/tender_recommendation/create`,
      method: 'POST',
      body: data,
    });

    if (!response?.id) {
      return rejectWithValue(response?.message || response);
    }

    return response;
  },
);
const getTenderRecommendationById = createAsyncThunk(
  'tender_recommendation/getTenderRecommendationById',
  async ({ project_id, tid }) => {
    const response = await httpHelper({
      url: `project/${project_id}/tender_recommendation/${tid}`,
      method: 'GET',
    });
    return response?.data;
  },
);
// Update Individual section data
const updateTenderRecommendationById = createAsyncThunk(
  'tender_recommendation/updateTenderRecommendationById',
  async ({ project_id, tid, data }) => {
    const response = await httpHelper({
      url: `project/${project_id}/tender_recommendation/${tid}`,
      method: 'PATCH',
      body: data,
    });
    return response;
  },
);
// Update entire sections data

const saveAsDraftTenderRecommendationById = createAsyncThunk(
  'tender_recommendation/saveAsDraftTenderRecommendationById',
  async ({ project_id, tid, data }, thunkAPI) => {
    try {
      return await httpHelper({
        url: `project/${project_id}/tender_recommendation/${tid}/save_as_draft`,
        method: 'PATCH',
        body: data,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message,
        status: error.status,
        response: error.response,
      });
    }
  },
);

const getTenderRecommendationPricingSummary = createAsyncThunk(
  'tender_recommendation/getPricingSummary',
  async ({ project_id, package_id }) => {
    const response = await httpHelper({
      url: `project/${project_id}/package/${package_id}/quotes`,
      method: 'GET',
    });
    return response?.data;
  },
);
const updateTenderRecommendationPricingSummary = createAsyncThunk(
  'tender_recommendation/updatePricingSummary',
  async ({ project_id, package_id, transaction_id, data }) => {
    const response = await httpHelper({
      url: `project/${project_id}/package/${package_id}/quote/${transaction_id}`,
      method: 'PATCH',
      body: data,
    });
    return response;
  },
);

const getTenderRecommendationApprovers = createAsyncThunk(
  'tender_recommendation/getTenderRecommendationApprovers',
  ({ project_id, tid }) => {
    return httpHelper({
      url: `project/${project_id}/tender_recommendation/${tid}/approvers`,
      method: 'GET',
    });
  },
);

const assignTenderRecommendationApprover = createAsyncThunk(
  'tender_recommendation/assignTenderRecommendationApprover',
  ({ project_id, tid, data }) => {
    return httpHelperV2({
      url: `project/${project_id}/tender_recommendation/${tid}/approvals`,
      method: 'POST',
      body: data,
    });
  },
);

const withDrawTenderRecommendation = createAsyncThunk(
  'tender_recommendation/withDrawTenderRecommendation',
  ({ project_id, tid }) => {
    return httpHelperV2({
      url: `project/${project_id}/tender_recommendation/${tid}/approvals/withdraw`,
      method: 'DELETE',
    });
  },
);

const sendTrApprovalReminder = createAsyncThunk(
  'tender_recommendation/sendTrApprovalReminder',
  ({ project_id, tid, approval_id }) => {
    return httpHelperV2({
      url: `project/${project_id}/tender_recommendation/${tid}/approvals/${approval_id}/reminder`,
      method: 'POST',
    });
  },
);

const getAuditLogsTenderRecommendationById = createAsyncThunk(
  'tender_recommendation/getAuditLogsTenderRecommendationById',
  async ({ project_id, tender_recommendation_id }) => {
    const response = await httpHelperV2({
      url: `project/${project_id}/tender_recommendation/${tender_recommendation_id}/logs`,
      method: 'GET',
    });
    return response?.logs;
  },
);


const approveOrRejectTenderRecommendation = createAsyncThunk(
  'tender_recommendation/approveOrRejectTenderRecommendation',
  async ({ project_id, tender_recommendation_id, approver_id, data }, thunkAPI) => {
    try {
      return await httpHelperV2({
        url: `project/${project_id}/tender_recommendation/${tender_recommendation_id}/approval/${approver_id}`,
        method: 'PUT',
        body: data,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error?.message || 'Failed to process approval',
      });
    }
  },
);


const uploadTenderRecommendationAttachments = createAsyncThunk(
  'tender_recommendation/uploadAttachments',
   async ({ project_id, tid, trid, formData }) => {
      const response = await httpHelperV2({
        url: `project/${project_id}/tender/${tid}/tender_recommendation/${trid}/upload_attachments`,
        method: 'POST',
        body: formData,
        isFormData: true,
      });
      return response;
  },
);

const getTenderRecommendationAttachments = createAsyncThunk(
  'tender_recommendation/getAttachments',
  async ({ project_id, tid, trid }) => {
    console.log('[project_id, tid, trid]', project_id, tid, trid);
    const response = await httpHelperV2({
      url: `project/${project_id}/tender/${tid}/tender_recommendation/${trid}/attachments`,
      method: 'GET',
    });
    return response;
  },
);

const deleteTenderRecommendationAttachment = createAsyncThunk(
  'tender_recommendation/deleteAttachment',
  async ({ project_id, tid, trid, attachment_id }) => {
    const response = await httpHelperV2({
      url: `project/${project_id}/tender/${tid}/tender_recommendation/${trid}/attachments/${attachment_id}`,
      method: 'DELETE',
    });
    return response;
  },
);

export {
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
  uploadTenderRecommendationAttachments,
  getTenderRecommendationAttachments,
  deleteTenderRecommendationAttachment,
};
