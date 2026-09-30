import {
  fetchPrequalification,
  patchCompanyInformation,
  fetchPrequalificationSections,
  patchTurnover,
  postPrequalFile,
  resendReferences,
  postReferences,
  patchOrganization,
  postOrganization,
  deletePrequalificationSection,
  deletePrequalificationReference,
  patchOrganizationV2,
  getPrequalification,
  getPrequalificationSections,
  requestDocument,
  deleteTeamMember,
  getPrequalificationStatuses,
} from './asyncThunk';
import { initPreqState, changeLoading } from './common';

export default {
  [fetchPrequalification.pending]: (state) => {
    changeLoading(state, 'info', 'Loading prequal info');
  },
  [fetchPrequalification.fulfilled]: (state, { payload, meta }) => {
    initPreqState(state, payload, meta.arg);
    changeLoading(state);
  },
  [fetchPrequalification.rejected]: (state) => {
    changeLoading(state, 'error', 'Error fetching prequalification data');
  },
  [patchCompanyInformation.pending]: (state) => {
    changeLoading(state, 'info', 'Updating company information');
  },
  [patchCompanyInformation.fulfilled]: (state) => {
    changeLoading(state);
  },
  [patchCompanyInformation.rejected]: (state) => {
    changeLoading(state, 'error', 'Error updating company information');
  },
  [patchTurnover.pending]: (state) => {
    changeLoading(state, 'info', 'Updating turnover information');
  },
  [patchTurnover.fulfilled]: (state) => {
    changeLoading(state);
  },
  [patchTurnover.rejected]: (state) => {
    changeLoading(state, 'error', 'Error updating turnover information');
  },
  [postPrequalFile.pending]: (state) => {
    changeLoading(state, 'info', 'Updating prequal file');
  },
  [postPrequalFile.fulfilled]: (state) => {
    changeLoading(state);
  },
  [postPrequalFile.rejected]: (state) => {
    changeLoading(state, 'error', 'Error posting prequal file');
  },
  [resendReferences.pending]: (state) => {
    changeLoading(state, 'info', 'Resend reference');
  },
  [resendReferences.fulfilled]: (state) => {
    changeLoading(state);
  },
  [resendReferences.rejected]: (state) => {
    changeLoading(state, 'error', 'Error resend reference');
  },
  [postReferences.pending]: (state) => {
    changeLoading(state, 'info', 'Updating references information');
  },
  [postReferences.fulfilled]: (state) => {
    changeLoading(state);
  },
  [postReferences.rejected]: (state) => {
    changeLoading(state, 'error', 'Error posting references info');
  },
  [patchOrganization.pending]: (state) => {
    changeLoading(state, 'info', 'Updating organization information');
  },
  [patchOrganization.fulfilled]: (state) => {
    changeLoading(state);
  },
  [patchOrganization.rejected]: (state) => {
    changeLoading(state, 'error', 'Error posting organization info');
  },
  [postOrganization.pending]: (state) => {
    changeLoading(state, 'info', 'Updating organization information');
  },
  [postOrganization.fulfilled]: (state, { payload, meta }) => {
    if (payload && payload.id) {
      const { arg } = meta;
      const { picture, ...rest } = arg;
      const newOrganization = [...state.organisation];
      newOrganization.push({
        ...rest,
        title: arg.role,
        name: `${rest.firstname} ${rest.lastname}`,
        id: payload.id,
      });
      state.organisation = newOrganization;
    }
    changeLoading(state);
  },
  [postOrganization.rejected]: (state) => {
    changeLoading(state, 'error', 'Error posting organization info');
  },
  [patchOrganizationV2.pending]: (state) => {
    changeLoading(state, 'info', 'Patching organization information');
  },
  [patchOrganizationV2.fulfilled]: (state, { payload, meta }) => {
    if (payload && (payload.id || payload.success)) {
      const { arg } = meta;
      const newOrganization = [...state.organisation];
      state.organisation = newOrganization.map((m) => {
        if (arg.id === m.id) {
          return {
            ...arg,
            title: arg.role,
            name: `${arg.firstname} ${arg.lastname}`,
          };
        }
        return m;
      });
      changeLoading(state);
    }
  },
  [patchOrganizationV2.rejected]: (state) => {
    changeLoading(state, 'error', 'Error patching organization info');
  },
  [deletePrequalificationSection.pending]: (state) => {
    changeLoading(state, 'info', 'Deleting prequalification');
  },
  [deletePrequalificationSection.fulfilled]: (state) => {
    changeLoading(state);
  },
  [deletePrequalificationSection.rejected]: (state) => {
    changeLoading(state, 'error', 'Error deleting prequalification');
  },
  [deleteTeamMember.pending]: () => {},
  [deleteTeamMember.fulfilled]: () => {},
  [deleteTeamMember.rejected]: () => {},
  [deletePrequalificationReference.pending]: (state) => {
    changeLoading(state, 'info', 'Deleting prequalification reference');
  },
  [deletePrequalificationReference.fulfilled]: (state) => {
    changeLoading(state);
  },
  [deletePrequalificationReference.rejected]: (state) => {
    changeLoading(state, 'error', 'Error deleting prequalification reference');
  },
  [getPrequalification.pending]: (state) => {
    changeLoading(state, 'info', 'Loading prequal info');
  },
  [getPrequalification.fulfilled]: (state, { payload, meta }) => {
    const documents = state ? { ...state.documents } ?? {} : {};
    initPreqState(state, payload, meta.arg, documents);
    changeLoading(state);
  },
  [getPrequalification.rejected]: (state) => {
    changeLoading(state, 'error', 'Error fetching prequalification data');
  },
  [getPrequalificationSections.pending]: (state) => {
    changeLoading(state, 'info', 'Loading prequalification sections');
  },
  [getPrequalificationSections.fulfilled]: (state, { payload }) => {
    if (payload) {
      const documents = {};
      Object.values(payload).forEach((item) => {
        documents[item.uid] = {
          id: item.id,
          label: item.label,
          value: item.uid,
          options: item.documents,
        };
      });
      state.documents = documents;
    }
    changeLoading(state, 'error', 'Error loading prequalification sections');
  },
  [getPrequalificationSections.rejected]: (state) => {
    changeLoading(state, 'error', 'Error loading prequalification sections');
  },
  [requestDocument.pending]: () => {},
  [requestDocument.fulfilled]: (state, { meta }) => {
    const { arg } = meta;
    const { data, type } = arg;
    state[type] = state[type].map((i) => ({
      ...i,
      request: i.label === data.label || i.request,
    }));
  },
  [requestDocument.rejected]: () => {},
  [fetchPrequalificationSections.pending]: (state) => {
    changeLoading(state, 'info', 'Loading prequalification sections');
  },
  [fetchPrequalificationSections.fulfilled]: (state, { payload }) => {
    if (payload && payload.length) {
      const documents = {};
      if (payload && payload.length) {
        payload.forEach((item) => {
          documents[item.uid] = {
            id: item.id,
            label: item.label,
            value: item.uid,
            options: item.documents,
          };
        });
      }
      state.documents = documents;
    }
    changeLoading(state);
  },
  [fetchPrequalificationSections.rejected]: (state) => {
    changeLoading(state, 'error', 'Error loading prequalification sections');
  },
  [getPrequalificationStatuses.pending]: (state) => {
    changeLoading(state, 'info', 'Loading prequalification sections');
  },
  [getPrequalificationStatuses.fulfilled]: (state, { payload }) => {
    state.statuses = payload.data;
    changeLoading(state);
  },
  [getPrequalificationStatuses.rejected]: (state) => {
    changeLoading(state, 'error', 'Error loading prequalification sections');
  },
};

export {
  requestDocument,
  fetchPrequalification,
  patchCompanyInformation,
  fetchPrequalificationSections,
  patchTurnover,
  postPrequalFile,
  resendReferences,
  postReferences,
  patchOrganization,
  postOrganization,
  deletePrequalificationSection,
  deletePrequalificationReference,
  patchOrganizationV2,
  getPrequalification,
  getPrequalificationSections,
  deleteTeamMember,
  getPrequalificationStatuses,
};
