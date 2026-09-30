import isEmpty from 'lodash/isEmpty';
import { getProjectProcurement, fetchApproversWithLevels, fetchApproversShortlistedSubs, sendShortlistedSubcontractorReminder, getProjectInterests, getProjectProcurementOverviewV2, startMilestone, completeMilestone, addToShortlistSubcontractors, fetchShortlistApprovers, deleteShortlistedSubcontractor, requestBulkShortlistApproval, getShortlistedSubcontractorLogs, approveOrRejectShortlistedSubcontractor, withdrawShortlistedSubcontractorApproval, acknowledgeRejection, exportProcurementSchedule } from './asyncThunk';

// A package row is only shown once it has a valid start date, a service, and
// at least one trade package attached — see start_on_site/service_label/packages.
const isDisplayablePackage = (item) =>
  (!isEmpty(item?.start_on_site) || !isEmpty(item?.tender_return)) &&
  !isEmpty(item?.service_label) &&
  !isEmpty(item?.packages);

const toDisplayablePackages = (payload) =>
  (typeof payload === 'object' ? Object.values(payload) : payload).filter(
    isDisplayablePackage,
  );

export default {
  [getProjectProcurement.pending]: (state) => {
    state.submittingProcurement = true;
    state.errorProcurement = false;
  },
  [getProjectProcurement.fulfilled]: (state, { payload }) => {
    state.packages = toDisplayablePackages(payload)
    state.submittingProcurement = false;
    state.errorProcurement = false;
  },
  [getProjectProcurement.rejected]: (state) => {
    state.submittingProcurement = false;
    state.errorProcurement = true;
  },
  [getProjectInterests.pending]: (state) => {
    state.submittingInterest = true;
    state.errorInterest = false;
  },
  [getProjectInterests.fulfilled]: (state, { payload }) => {
    state.interests =
      typeof payload === 'object' ? Object.values(payload) : payload;
    state.submittingInterest = false;
    state.errorInterest = false;
  },
  [getProjectInterests.rejected]: (state) => {
    state.submittingInterest = false;
    state.errorInterest = true;
  },
  [getProjectProcurementOverviewV2.pending]: (state) => {
    state.submittingProcurement = true;
    state.errorProcurement = false;
  },
  [getProjectProcurementOverviewV2.fulfilled]: (state, { payload }) => {
    state.packages = toDisplayablePackages(payload)
    state.submittingProcurement = false;
    state.errorProcurement = false;
  },
  [getProjectProcurementOverviewV2.rejected]: (state) => {
    state.submittingProcurement = false;
    state.errorProcurement = true;
  },

  [completeMilestone.pending]: () => {},
  [completeMilestone.fulfilled]: (state, { payload, meta }) => {
    state.submittingMilestone = false;
    state.errorMilestone = false;

    const milestones = payload?.data?.milestones;
    const packageMilestoneId = meta?.arg?.package_milestone_id;

    if (milestones && packageMilestoneId) {
      state.packages = state.packages.map((pkg) => {
        const hasMilestone =
          pkg.milestones?.current?.id === Number(packageMilestoneId);
        if (hasMilestone) {
          return {
            ...pkg,
            milestones,
          };
        }
        return pkg;
      });
    }
  },
  [completeMilestone.rejected]: () => {},
  [addToShortlistSubcontractors.pending]: () => {},
  [addToShortlistSubcontractors.fulfilled]: (state, { payload }) => {
    state.shortlistResponse = payload;
  },
  [addToShortlistSubcontractors.rejected]: () => {},
  [fetchShortlistApprovers.pending]: (state) => {
    state.fetchingApprovers = true;
    state.approvers = [];
  },
  [fetchShortlistApprovers.fulfilled]: (state, { payload }) => {
    state.approvers = payload;
    state.fetchingApprovers = false;
  },
  [fetchShortlistApprovers.rejected]: (state) => {
    state.fetchingApprovers = false;
    state.approvers = [];
  },
  [fetchApproversWithLevels.pending]: (state) => {
    state.fetchingApprovers = true;
    state.approvers = [];
  },
  [fetchApproversWithLevels.fulfilled]: (state, { payload }) => {
    state.approvers = payload;
    state.fetchingApprovers = false;
  },
  [fetchApproversWithLevels.rejected]: (state) => {
    state.fetchingApprovers = false;
    state.approvers = [];
  },
  [fetchApproversShortlistedSubs.pending]: (state) => {
    state.fetchingApprovers = true;
    state.approvers = [];
  },
  [fetchApproversShortlistedSubs.fulfilled]: (state, { payload }) => {
    state.approvers = payload;
    state.fetchingApprovers = false;
  },
  [fetchApproversShortlistedSubs.rejected]: (state) => {
    state.fetchingApprovers = false;
    state.approvers = [];
  },
  [deleteShortlistedSubcontractor.pending]: (state) => {
    state.deletingShortlisted = true;
  },
  [deleteShortlistedSubcontractor.fulfilled]: (state) => {
    state.deletingShortlisted = false;
  },
  [deleteShortlistedSubcontractor.rejected]: (state) => {
    state.deletingShortlisted = false;
  },
  [requestBulkShortlistApproval.pending]: (state) => {
    state.requestingApproval = true;
  },
  [requestBulkShortlistApproval.fulfilled]: (state) => {
    state.requestingApproval = false;
  },
  [requestBulkShortlistApproval.rejected]: (state) => {
    state.requestingApproval = false;
  },
  [approveOrRejectShortlistedSubcontractor.pending]: (state) => {
    state.approvingOrRejecting = true;
  },
  [approveOrRejectShortlistedSubcontractor.fulfilled]: (state) => {
    state.approvingOrRejecting = false;
  },
  [approveOrRejectShortlistedSubcontractor.rejected]: (state) => {
    state.approvingOrRejecting = false;
  },
  [getShortlistedSubcontractorLogs.pending]: (state) => {
    state.fetchingLogs = true;
  },
  [getShortlistedSubcontractorLogs.fulfilled]: (state) => {
    state.fetchingLogs = false;
  },
  [getShortlistedSubcontractorLogs.rejected]: (state) => {
    state.fetchingLogs = false;
  },
  [withdrawShortlistedSubcontractorApproval.pending]: (state) => {
    state.withdrawingApproval = true;
  },
  [withdrawShortlistedSubcontractorApproval.fulfilled]: (state) => {
    state.withdrawingApproval = false;
  },
  [withdrawShortlistedSubcontractorApproval.rejected]: (state) => {
    state.withdrawingApproval = false;
  },
  [acknowledgeRejection.pending]: (state) => {
    state.acknowledgingRejection = true;
  },
  [acknowledgeRejection.fulfilled]: (state) => {
    state.acknowledgingRejection = false;
  },
  [acknowledgeRejection.rejected]: (state) => {
    state.acknowledgingRejection = false;
  },
  [sendShortlistedSubcontractorReminder.pending]: () => {},
  [sendShortlistedSubcontractorReminder.fulfilled]: () => {},
  [sendShortlistedSubcontractorReminder.rejected]: () => {},
  [exportProcurementSchedule.pending]: (state) => { state.isExporting = true; },
  [exportProcurementSchedule.fulfilled]: (state) => { state.isExporting = false; },
  [exportProcurementSchedule.rejected]: (state) => { state.isExporting = false; },
};

export { getProjectProcurement, fetchApproversWithLevels, fetchApproversShortlistedSubs, getProjectInterests, getProjectProcurementOverviewV2, startMilestone, completeMilestone, addToShortlistSubcontractors, fetchShortlistApprovers, deleteShortlistedSubcontractor, requestBulkShortlistApproval, getShortlistedSubcontractorLogs, approveOrRejectShortlistedSubcontractor, withdrawShortlistedSubcontractorApproval, acknowledgeRejection, sendShortlistedSubcontractorReminder, exportProcurementSchedule };
