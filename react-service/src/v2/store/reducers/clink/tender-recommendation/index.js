import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
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
} from './extraReducers';

const initialState = {
  recommendations: [],
  tenderRecommendationForm: [],
  tenderRecommendationById: [],
  pricingSummary: [],
  tenderRecommendationLogs: {},
  openLogModal: false,
  recommendationsLoading: false,
};

const tenderRecommendationSlice = createSlice({
  name: 'tenderRecommendation',
  initialState,
  extraReducers,
});


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
export default tenderRecommendationSlice.reducer;
