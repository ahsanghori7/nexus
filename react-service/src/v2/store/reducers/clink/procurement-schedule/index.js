import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
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
  approveOrRejectShortlistedSubcontractor,
  getShortlistedSubcontractorLogs,
  withdrawShortlistedSubcontractorApproval,
  acknowledgeRejection,
  sendShortlistedSubcontractorReminder,
  exportProcurementSchedule,
} from './extraReducers';

const initialState = {
  interests: [],
  packages: [],
  submittingProcurement: true,
  errorProcurement: false,
  submittingInterest: true,
  submittingChain: true,
  errorInterest: false,
  enquiryProOnLoad: {},
  approvers: [],
  fetchingApprovers: false,
  deletingShortlisted: false,
  requestingApproval: false,
  approvingOrRejecting: false,
  fetchingLogs: false,
  withdrawingApproval: false,
  acknowledgingRejection: false,
};

const procurementScheduleSlice = createSlice({
  name: 'procurementSchedule',
  initialState,
  reducers: {
    openEnquiryPro: (state, action) => {
      const { payload } = action;
      state.enquiryProOnLoad = payload;
    },
    restartProcurement: (state) => {
      state.interests = [];
      state.packages = [];
    },
    resetApprovers: (state) => {
      state.approvers = [];
      state.fetchingApprovers = false;
    },
  },
  extraReducers,
});

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
export const { openEnquiryPro, restartProcurement, resetApprovers } =
  procurementScheduleSlice.actions;
export default procurementScheduleSlice.reducer;
