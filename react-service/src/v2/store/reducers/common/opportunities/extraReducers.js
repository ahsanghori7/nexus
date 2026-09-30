import { createAsyncThunk } from '@reduxjs/toolkit';
import isArray from 'lodash/isArray';
import { getProjectLogo, prosperViewProject } from 'v2/helpers/url';
import { fetchData } from 'services/helpers';
import { processTenderDates } from 'v2/helpers/date';
import status from 'store/reducers/common/constants';
import i18next from 'v2/helpers/i18n';

const formatCurrency = (value) =>
  String(value ?? '').replaceAll('£', i18next.t('currency'));

const fetchOpportunities = createAsyncThunk(
  'opportunities/fetchOpportunities',
  async () =>
    fetchData('opportunities', false, 'latest').then((result) => result.data)
);

const fetchSingleProject = createAsyncThunk(
  'opportunities/fetchSingleProject',
  async (pid) => fetchData(`project/${pid}`).then((result) => result.data)
);

const updateRegisteredProject = createAsyncThunk(
  'opportunities/updateRegisteredProject',
  async (param) =>
    fetchData(`tender/${param.tid}/register_interest`).then(
      (result) => result.status
    )
);

const fetchOpportunitiesByAccount = createAsyncThunk(
  'opportunities/fetchOpportunitiesByAccount',
  async (id) =>
    fetchData(`account/opportunities/${id}`).then((result) => result.data)
);

export default {
  [fetchOpportunities.pending]: (state) => {
    state.status = 'loading';
  },
  [fetchOpportunities.fulfilled]: (state, { payload }) => {
    state.status = '';

    let hiddenProjects = [];
    if (localStorage.latest && JSON.parse(localStorage.latest).length) {
      hiddenProjects = JSON.parse(localStorage.latest);
    }

    const projects =
      payload && isArray(payload)
        ? payload.map((item) => ({
            id: item.id,
            slug: item.slug,
            start: item.start,
            end: item.end,
            viewProject: prosperViewProject(item.id),
            projectImage: getProjectLogo(item.id),
            projectName: item.project || item.projectName,
            restricted: item.restricted,
            packages: item.packages,
            tenders: item.tenders,
            region: item.region,
            phase: item.phase,
            type: item.type,
          }))
        : [];
    state.projects = projects;

    state.latest = projects.filter((p) => !hiddenProjects.includes(p.id));
  },
  [fetchOpportunities.rejected]: (state) => {
    state.status = 'error';
    state.latest = [];
  },
  [fetchSingleProject.pending]: (state) => {
    state.statusProject = 'Loading';
  },
  [fetchSingleProject.fulfilled]: (state, { payload }) => {
    const project = payload && isArray(payload) ? payload[0] : null;
    if (project) {
      const DATE_FORMAT = 'YYYY-MM-DD';
      const packages = project.tenders // make sure packages are defined
        ? processTenderDates(project.tenders, DATE_FORMAT) // make sure packages are defined
        : [];
      project.packages = packages.map((pack) => ({
        ...pack,
        size: formatCurrency(pack.size),
      }));
      project.tenders = project.tenders.map((tender) => ({
        ...tender,
        size: formatCurrency(tender.size),
      }));
    }
    state.project = project;
    state.statusProject = '';
  },
  [fetchSingleProject.rejected]: (state) => {
    state.statusProject = 'Error';
  },

  [updateRegisteredProject.pending]: (state) => {
    state.statusProject = 'Loading';
  },
  [updateRegisteredProject.fulfilled]: (state, { payload, meta }) => {
    const statusPayload = payload;
    const { arg } = meta;
    const { tid } = arg;
    if (statusPayload) {
      const { project } = state;
      const registerArray = [...project.packages].map((pack) => {
        if (pack.id === tid) {
          return { ...pack, registered: true };
        }
        return pack;
      });
      state.project.packages = registerArray;
    }
    state.statusProject = '';
  },
  [updateRegisteredProject.rejected]: (state) => {
    state.statusProject = 'Error';
  },
  [fetchOpportunitiesByAccount.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading opportunities',
      type: status.LOADING_STATUS,
    };
  },
  [fetchOpportunitiesByAccount.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
    state.list = payload.map((i) => ({
      ...i,
      project_package: `${i.project}/${i.package}`,
    }));
  },
  [fetchOpportunitiesByAccount.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'Error fetchOpportunities',
      type: status.FAILURE_STATUS,
    };
  },
};
export {
  fetchOpportunities,
  fetchSingleProject,
  updateRegisteredProject,
  fetchOpportunitiesByAccount,
};
