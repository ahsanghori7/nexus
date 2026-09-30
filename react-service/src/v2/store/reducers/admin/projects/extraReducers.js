import { createAsyncThunk } from '@reduxjs/toolkit';
import capitalize from 'lodash/capitalize';
import Relay from 'v2/services/relay';
import { fetchData } from 'services/helpers';
import status from 'store/reducers/common/constants';

const relay = new Relay('project');
const fetchProjects = createAsyncThunk('projects/fetchProjects', async (term) =>
  relay
    .get('', term ? { query: term } : false)
    .then((result) => result.json())
    .then((result) => result.data)
);

const fetchStatusList = createAsyncThunk('projects/fetchStatusList', async () =>
  fetchData('project/constants').then((result) => result.data.project.status)
);

const changeStatus = createAsyncThunk(
  'projects/changeStatus',
  async ({ project, status: statusProject }) => {
    const { id } = project;
    const { id: idStatus } = statusProject;
    return relay.patch({ data: { status: idStatus } }, id);
  }
);

export default {
  [fetchProjects.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading ',
      type: status.LOADING_STATUS,
    };
  },
  [fetchProjects.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: 'IDLE ',
      type: status.IDLE_STATUS,
    };
    const list = payload && payload.length ? payload : [];
    // TODO: Check unit-no column
    // TODO: Check approx-cost column
    state.list = list.map((project) => ({
      ...project,
      project: project.name,
      location: project.region,
      'unit-no': 'n/a',
      'created-by':
        project.author_name && project.author_name !== ''
          ? project.author_name
          : 'No User Data',
      'approx-cost': 'n/a',
      'published-date': project.created_at,
    }));
  },
  [fetchProjects.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE',
      type: status.FAILURE_STATUS,
    };
    state.list = [];
  },
  [fetchStatusList.pending]: () => {},
  [fetchStatusList.fulfilled]: (state, { payload }) => {
    const statusList = payload && payload.length ? payload : [];
    state.statusList = statusList.map((statusOption, index) => ({
      id: index,
      label: capitalize(statusOption),
    }));
  },
  [fetchStatusList.rejected]: (state) => {
    state.statusList = [];
  },
  [changeStatus.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Updating status',
      type: status.LOADING_STATUS,
    };
  },
  [changeStatus.fulfilled]: (state, { meta }) => {
    const { arg } = meta;
    const { project, status: statusProject } = arg;
    const list = state && state.list && state.list.length ? state.list : [];
    state.list = list.map((p) =>
      p.id === project.id
        ? {
            ...p,
            status: statusProject.label.toLowerCase(),
          }
        : p
    );
    state.status = {
      severity: false,
      message: 'IDLE ',
      type: status.IDLE_STATUS,
    };
  },
  [changeStatus.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Updating status',
      type: status.FAILURE_STATUS,
    };
  },
};
export { fetchProjects, fetchStatusList, changeStatus };
