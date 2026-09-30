import find from 'lodash/find';

import {
  fetchPackageDependency,
  fetchProject,
  fetchProjectGantt,
  fetchProjectSummary,
  updateTender,
  addProject,
  updateProject,
  fetchTeamApi,
  postMember,
  deleteMember,
  getProjectTenders,
  getProjectMilestones,
  fetchProjectEnquiries,
  updatePackages,
  getDashboardActions,
  removeOrRestoreDashboardAction,
  fetchShortlistedSubcontractors,
  fetchIfsProjects,
  fetchLinkedIfsProject,
} from './asyncThunk';

const fetchProjectPending = (state) => {
  state.loadingStatus = true;
};
const fetchProjectFulfilled = (state, { payload }) => {
  const statusResponse = isNaN(payload) ? payload : null;
  if (
    statusResponse &&
    typeof statusResponse === 'object' &&
    !('error' in statusResponse)
  ) {
    state.data = payload;
  } else {
    const error =
      statusResponse &&
        typeof statusResponse === 'object' &&
        'error' in statusResponse
        ? statusResponse.error
        : payload;
    state.status = `Error loading project (${error})`;
  }
  state.loadingStatus = false;
};
const fetchProjectRejected = (state) => {
  state.status = 'Error loading project';
  state.loadingStatus = false;
};

export default {
  [fetchProject.pending]: fetchProjectPending,
  [fetchProject.fulfilled]: fetchProjectFulfilled,
  [fetchProject.rejected]: fetchProjectRejected,
  [fetchProjectGantt.pending]: fetchProjectPending,
  [fetchProjectGantt.fulfilled]: fetchProjectFulfilled,
  [fetchProjectGantt.rejected]: fetchProjectRejected,
  [fetchProjectSummary.pending]: (state) => {
    state.loadingSummary = true;
  },
  [fetchProjectSummary.fulfilled]: (state, { payload }) => {
    state.summary = (payload && payload.data) || {};
    state.loadingSummary = false;
  },
  [fetchProjectSummary.rejected]: (state) => {
    state.statusSummary = 'Error loading project summary';
    state.loadingSummary = false;
  },
  [fetchPackageDependency.pending]: (state) => {
    state.status = 'Loading package dependency';
    state.dependencyStatus = true;
  },
  [fetchPackageDependency.fulfilled]: (state, { payload }) => {
    const statusResponse = isNaN(payload) ? payload : null;
    if (statusResponse && !('error' in statusResponse)) {
      state.dependency = payload.data || {};
    } else {
      state.dependencyStatus = false;
    }
    state.status = '';
  },
  [fetchPackageDependency.rejected]: (state) => {
    state.status = 'Error loading package dependency';
    state.dependencyStatus = false;
  },
  [updateTender.pending]: () => { },
  [updateTender.fulfilled]: (state, { meta }) => {
    const { arg } = meta;
    const { data, tid } = arg;
    state.data = {
      ...state.data,
      tender: state.data.tender.map((t) =>
        Number(t.id) === Number(tid) ? { ...t, ...data } : t,
      ),
    };
  },
  [updateTender.rejected]: (state) => {
    state.status = 'Error Updating tender';
  },
  [addProject.pending]: () => { },
  [addProject.fulfilled]: () => { },
  [addProject.rejected]: (state) => {
    state.status = 'Error Adding Project';
  },
  [updateProject.pending]: () => { },
  [updateProject.fulfilled]: (state, payload) => {
    const data = payload?.meta?.arg?.data || {};
    state.data = { ...state.data, ...data };
  },
  [updateProject.rejected]: (state) => {
    state.status = 'Error Updating Project';
  },
  [fetchTeamApi.pending]: (state) => {
    state.status = 'Loading Fetching Team Members';
  },
  [fetchTeamApi.fulfilled]: (state, { payload }) => {
    const data = payload?.data || [];
    state.members = data;
    state.status = '';
  },
  [fetchTeamApi.rejected]: (state) => {
    state.status = 'Error Fetching Team Members';
  },
    [getProjectMilestones.pending]: (state) => {
    state.status = 'Loading Fetching Project Milestones';
  },
  [getProjectMilestones.fulfilled]: (state, { payload }) => {
    const data = payload?.data || [];
    state.milestones = data;
    state.status = '';
  },
  [getProjectMilestones.rejected]: (state) => {
    state.milestones = [];
    state.status = 'Error Fetching Project Milestones';
  },
  [postMember.pending]: (state) => {
    state.status = 'Loading Post Team Member';
  },
  [postMember.fulfilled]: (state, { meta, payload }) => {
    if (
      find(state.members, (o) => String(o.user_id) === String(meta?.arg?.id))
    ) {
      state.members = state.members.map((m) => {
        if (String(m?.user_id) === String(meta?.arg?.id)) {
          return {
            ...meta?.arg,
            user_id: meta?.arg?.id ?? payload?.data?.user_id,
            id: payload?.data?.member_id,
            member: {
              ...meta?.arg,
              position: { id: meta?.arg?.position },
            },
          };
        }
        return m;
      });
    } else {
      state.members = [
        ...state.members,
        {
          ...meta?.arg,
          user_id: meta?.arg?.id ?? payload?.data?.user_id,
          id: payload?.data?.member_id,
          member: {
            ...meta?.arg,
            position: { id: meta?.arg?.position },
          },
        },
      ];
    }
    state.status = '';
  },
  [postMember.rejected]: (state) => {
    state.status = 'Error Post Team Member';
  },
  [deleteMember.pending]: (state) => {
    state.status = 'Loading Delete Team Member';
  },
  [deleteMember.fulfilled]: (state, payload) => {
    state.members = state.members.filter(
      (m) => Number(m.id) !== Number(payload?.meta?.arg?.teamId),
    );
    state.status = '';
  },
  [deleteMember.rejected]: (state) => {
    state.status = 'Error Delete Team Member';
  },
  // TODO: Investigate why this was created
  [getProjectTenders.pending]: () => { },
  [getProjectTenders.fulfilled]: (state, { payload }) => {
    state.tenders = payload;
  },
  [getProjectTenders.rejected]: () => { },
  [updatePackages.pending]: () => { },
  [updatePackages.fulfilled]: (state, { meta }) => {
    const { tid } = meta.arg;
    state.data.tender = state.data.tender.map((tender) => {
      if (Number(tender.id) === Number(tid)) {
        return { ...tender, start_on_site: meta.arg.data.start_on_site };
      }
      return tender;
    });
  },
  [updatePackages.rejected]: () => { },
  [fetchProjectEnquiries.pending]: (state) => {
    state.status = "loading";
  },
  [fetchProjectEnquiries.fulfilled]: (state, { payload }) => {
    state.status = "";
    state.projectEnquiries = payload;
  },
  [fetchProjectEnquiries.rejected]: (state) => {
    state.status = "error";
    state.projectEnquiries = [];
  },
  [updatePackages.rejected]: () => {},

  [getDashboardActions.pending]: () => {},
  [getDashboardActions.fulfilled]: (state, { payload }) => {
    state.dashboardActions = payload.actions;
  },
  [getDashboardActions.rejected]: () => {},
  [fetchShortlistedSubcontractors.pending]: (state) => {
    state.loadingShortlistedSubcontractors = true;
  },
  [fetchShortlistedSubcontractors.fulfilled]: (state, { payload }) => {
    state.shortlistedSubcontractors = payload || {};
    state.loadingShortlistedSubcontractors = false;
  },
  [fetchShortlistedSubcontractors.rejected]: (state) => {
    state.loadingShortlistedSubcontractors = false;
  },
  [fetchIfsProjects.pending]: (state, { meta }) => {
    const page = meta?.arg?.page ?? 1;
    state.ifsProjects.error = null;
    if (page === 1) {
      state.ifsProjects.loading = true;
    } else {
      state.ifsProjects.loadingMore = true;
    }
  },
  [fetchIfsProjects.fulfilled]: (state, { payload, meta }) => {
    const page = meta?.arg?.page ?? 1;
    const search = meta?.arg?.search ?? '';
    const records = payload?.records || [];
    const total = payload?.total ?? 0;

    state.ifsProjects.total = total;
    state.ifsProjects.page = page;
    state.ifsProjects.search = search;
    state.ifsProjects.loading = false;
    state.ifsProjects.loadingMore = false;
    state.ifsProjects.error = null;

    if (page === 1) {
      state.ifsProjects.records = records;
    } else {
      const existingIds = new Set(state.ifsProjects.records.map((r) => r.id));
      state.ifsProjects.records = [
        ...state.ifsProjects.records,
        ...records.filter((r) => !existingIds.has(r.id)),
      ];
    }
  },
  [fetchIfsProjects.rejected]: (state, { payload, error }) => {
    state.ifsProjects.loading = false;
    state.ifsProjects.loadingMore = false;
    state.ifsProjects.error =
      payload?.message || error?.message || 'Failed to load IFS projects';
  },
  [fetchLinkedIfsProject.pending]: (state) => {
    state.linkedIfsProject.loading = true;
    state.linkedIfsProject.error = null;
  },
  [fetchLinkedIfsProject.fulfilled]: (state, { payload }) => {
    state.linkedIfsProject.data = payload;
    state.linkedIfsProject.loading = false;
    state.linkedIfsProject.error = null;
  },
  [fetchLinkedIfsProject.rejected]: (state, { payload, error }) => {
    state.linkedIfsProject.loading = false;
    state.linkedIfsProject.data = null;
    state.linkedIfsProject.error =
      payload?.message || error?.message || 'Failed to load linked IFS project';
  },
};

export {
  fetchProject,
  fetchProjectGantt,
  fetchProjectSummary,
  updateTender,
  fetchPackageDependency,
  addProject,
  updateProject,
  fetchTeamApi,
  postMember,
  deleteMember,
  getProjectTenders,
  getProjectMilestones,
  updatePackages,
  fetchProjectEnquiries,
  getDashboardActions,
  removeOrRestoreDashboardAction,
  fetchShortlistedSubcontractors,
  fetchIfsProjects,
  fetchLinkedIfsProject,
};
