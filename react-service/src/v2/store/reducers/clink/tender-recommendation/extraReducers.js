import {
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
} from './asyncThunk';

export default {
  [getTenderRecommendations.pending]: (state) => {
    state.recommendationsLoading = true;
  },
  [getTenderRecommendations.fulfilled]: (state, { payload }) => {
    state.recommendations = payload;
    state.recommendationsLoading = false;
  },
  [getTenderRecommendations.rejected]: (state) => {
    state.recommendationsLoading = false;
  },
  [createTenderRecommendationForm.pending]: () => {},
  [createTenderRecommendationForm.fulfilled]: (state, { payload }) => {
    state.tenderRecommendationForm = payload;
  },
  [createTenderRecommendationForm.rejected]: () => {},
  [getTenderRecommendationById.pending]: () => {},
  [getTenderRecommendationById.fulfilled]: (state, { payload }) => {
    state.tenderRecommendationById = payload;
  },
  [getTenderRecommendationById.rejected]: () => {},
  [getTenderRecommendationPricingSummary.pending]: () => {},
  [getTenderRecommendationPricingSummary.fulfilled]: (state, { payload }) => {
    state.pricingSummary = payload;
  },
  [getTenderRecommendationPricingSummary.rejected]: () => {},

  [updateTenderRecommendationById.pending]: () => {},
  [updateTenderRecommendationById.fulfilled]: (state, { payload, meta }) => {
    state.tenderRecommendationById = {
      ...state.tenderRecommendationById,
      ...(meta?.arg?.data || {}),
      ...(payload || {}),
    };
  },
  [updateTenderRecommendationById.rejected]: () => {},
  [saveAsDraftTenderRecommendationById.pending]: () => {},
  [saveAsDraftTenderRecommendationById.fulfilled]: () => {},
  [saveAsDraftTenderRecommendationById.rejected]: () => {},
  [updateTenderRecommendationPricingSummary.pending]: () => {},
  [updateTenderRecommendationPricingSummary.fulfilled]: (state, { meta }) => {
    if (state.pricingSummary && Array.isArray(state.pricingSummary)) {
      state.pricingSummary = state.pricingSummary.map((item) => {
        if (item.transaction_id === meta.arg.transaction_id) {
          return {
            ...item,
            forecast: meta.arg.data.forecast,
          };
        }
        return item;
      });
    }
  },
  [updateTenderRecommendationPricingSummary.rejected]: () => {},
  [getAuditLogsTenderRecommendationById.rejected]: () => {},
  [getAuditLogsTenderRecommendationById.pending]: () => {},
  [getAuditLogsTenderRecommendationById.fulfilled]: (state, { payload }) => {
    state.tenderRecommendationLogs = payload;
    state.openLogModal = true;
  },
};

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
