import { createAsyncThunk } from '@reduxjs/toolkit';
import { httpHelperV2 } from 'v2/services/httpHelper';

const assignTenderInquiryApprover = createAsyncThunk(
  'tender_inquiry/assignTenderInquiryApprover',
  ({ project_id, did, tenderId, data }) => {
    return httpHelperV2({
      url: `project/${project_id}/tender/${tenderId}/tender_inquiry/${did}/approvals`,
      method: 'POST',
      body: data,
    });
  },
);

const approveRejectInquiry = createAsyncThunk(
  'tender_inquiry/approveRejectInquiry',
  ({ project_id, did, tenderId, approver_id, data }) => {
    return httpHelperV2({
      url: `project/${project_id}/tender/${tenderId}/tender_inquiry/${did}/approval/${approver_id}`,
      method: 'PUT',
      body: data,
    });
  },
);

const acknowledgeRejectionFeedback = createAsyncThunk(
  'tender_inquiry/acknowledgeRejectionFeedback',
  ({ project_id, did }) => {
    return httpHelperV2({
      url: `project/${project_id}/tender_inquiry/${did}`,
      method: 'PATCH',
      body: { status: 'Rejection Acknowledged' },
    });
  },
);

const sendTenderInquiryReminder = createAsyncThunk(
  'tender_inquiry/sendTenderInquiryReminder',
  ({ project_id, tender_id, tender_inquiry_id, approver_id }) => {
    return httpHelperV2({
      url: `project/${project_id}/tender/${tender_id}/tender_inquiry/${tender_inquiry_id}/approvers`,
      method: 'POST',
      body: { data: { approver_id } },
    });
  },
);

const assignedApproversTenderInquiry = createAsyncThunk(
  'tender_inquiry/assignedApproversTenderInquiry',
  ({ project_id, tender_inquiry_id }) => {
    const query = tender_inquiry_id ? `?ti_id=${tender_inquiry_id}` : '';
    return httpHelperV2({
      url: `project/${project_id}/tender_inquiry/assigned-approvers${query}`,
      method: 'GET',
    });
  },
);

const fetchTenderEnquiryLogs = createAsyncThunk(
  'tender_inquiry/fetchTenderEnquiryLogs',
  ({ project_id, tender_inquiry_id }) =>
    httpHelperV2({
      url: `project/${project_id}/tender_inquiry/${tender_inquiry_id}/logs`,
      method: 'GET',
    }),
);

export {
  assignTenderInquiryApprover,
  approveRejectInquiry,
  acknowledgeRejectionFeedback,
  sendTenderInquiryReminder,
  assignedApproversTenderInquiry,
  fetchTenderEnquiryLogs,
};
