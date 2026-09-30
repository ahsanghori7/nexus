import { createAsyncThunk } from '@reduxjs/toolkit';
import Relay from 'v2/services/relay';
import { postData, patchData } from 'v2/services/clinkHelpers';
import { httpHelperV2 } from 'v2/services/httpHelper';

const relay = new Relay('relay', '', '');

const getProject = (method) =>
  createAsyncThunk(`project/${method}`, async ({ slug, state = null, isFileManager = null }) =>
    relay
      .get('', {
        action: 'project',
        method,
        slug,
        ...((state && { state }) || {}),
        ...((isFileManager && { isFileManager }) || {}),
      })
      .then((result) =>
        result.status === 200 ? result.json() : result.status,
      ),
  );
const fetchProject = getProject('getOne');
const fetchProjectGantt = getProject('getOneGantt');

const updateTender = createAsyncThunk(
  'project/updateTender',
  async ({ tid, data }) => {
    patchData('tender', 'update', data, { tid }).then((result) =>
      result.status === 200 ? result.json() : result.status,
    );
  },
);

const fetchProjectSummary = createAsyncThunk(
  'project/fetchProjectSummary',
  async (pid) =>
    relay
      .get('', { action: 'tender', method: 'projectSummary', pid })
      .then((result) =>
        result.status === 200 ? result.json() : result.status,
      ),
);

const fetchPackageDependency = createAsyncThunk(
  'project/fetchPackageDependency',
  async (pid) =>
    relay
      .get('', { action: 'project', method: 'getPackageDependency', pid })
      .then((result) =>
        result.status === 200 ? result.json() : result.status,
      ),
);

const addProject = createAsyncThunk('project/add', async (data, thunkAPI) =>
  patchData('project', 'addProject', data)
    .then((result) => result.json())
    .then((result) => {
      if (result?.error) {
        return thunkAPI.rejectWithValue(result.error);
      }
      return result;
    }),
);

const updateProject = createAsyncThunk(
  'project/update',
  async ({ data, pid }, thunkAPI) =>
    patchData('project', 'updateProject', data, { pid })
      .then((result) => result.json())
      .then((result) => {
        if (result?.error) {
          return thunkAPI.rejectWithValue(result.error);
        }
        return result;
      }),
);

const fetchTeamApi = createAsyncThunk(
  'project/fetchTeamApi',
  async (pid, thunkAPI) => {
    try {
      return await httpHelperV2({
        url: `project/${pid}/team`,
        method: 'GET',
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

const getProjectMilestones = createAsyncThunk(
  'project/getProjectMilestones',
  async (pid) => {
    try {
      return await httpHelperV2({
        url: `project/${pid}/package-milestones`,
        method: 'GET',
      });
    } catch {
      return { data: [] };
    }
  },
);

const postMember = createAsyncThunk(
  'project/postMemberApi',
  async ({ pid, ...data }, thunkAPI) => {
    try {
      const result = await httpHelperV2({
        url: `project/${pid}/add_team_member`,
        method: 'POST',
        body: data,
      });
      if (!result?.data?.success) {
        return thunkAPI.rejectWithValue(
          result?.data?.error || 'Error updating Team Details',
        );
      }
      return result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

const deleteMember = createAsyncThunk(
  'project/deleteMember',
  async ({ pid, teamId }, thunkAPI) => {
    try {
      const result = await httpHelperV2({
        url: `project/${pid}/team_member/${teamId || 0}`,
        method: 'DELETE',
      });
      if (!result?.data?.success) {
        return thunkAPI.rejectWithValue(
          result?.data?.error || 'Error deleting Team Member',
        );
      }
      return result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

const getProjectTenders = createAsyncThunk(
  'project/getProjectTenders',
  async (id) =>
    relay
      .get('', { action: 'project', method: 'getProjectTenders', id })
      .then((result) =>
        result.status === 200 ? result.json() : result.status,
      ),
);

const fetchProjectEnquiries = createAsyncThunk(
  "enquiries/fetchProjectEnquiries",
  async ({ pid }) =>
    relay
      .get("", { action: "project", method: "getEnquiries", pid })
      .then((result) =>
        result.status === 200 ? result.json() : result.status
      )
);

const getDashboardActions = createAsyncThunk(
  'project/getDashboardActions',
  async (args = {}) =>
    relay
      .get('', {
        action: 'project',
        method: 'getActions',
        ...((args?.filter && { filter: args.filter }) || {}),
      })
      .then((result) =>
        result.status === 200 ? result.json() : result.status,
      ),
);

const updatePackages = createAsyncThunk(
  'tender/updatePackages',
  async ({ tid, data }) =>
    patchData('tender', 'updatePackages', data, { tid }).then((result) =>
      result.status === 200 ? result.json() : result.status,
    ),
);

const removeOrRestoreDashboardAction = createAsyncThunk(
  'project/removeOrRestoreDashboardAction',
  async ({ approver_id, is_read }) =>
    postData('project', 'updateActions', { approver_id, is_read }).then(
      (result) => (result.status === 200 ? result.json() : result.status),
    ),
);

const fetchShortlistedSubcontractors = createAsyncThunk(
  'project/fetchShortlistedSubcontractors',
  async (pid, thunkAPI) => {
    try {
      return await httpHelperV2({
        url: `project/${pid}/shortlisted-subcontractors`,
        method: 'GET',
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

const fetchIfsProjects = createAsyncThunk(
  'project/fetchIfsProjects',
  async (args, thunkAPI) => {
    const { search = '', page = 1, per_page = 15 } = args || {};
    try {
      const params = new URLSearchParams({
        search: String(search ?? ''),
        page: String(page),
        per_page: String(per_page),
      });
      const result = await httpHelperV2({
        url: `project/ifs-projects?${params.toString()}`,
        method: 'GET',
      });
      return result?.data ?? { records: [], total: 0 };
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

const fetchLinkedIfsProject = createAsyncThunk(
  'project/fetchLinkedIfsProject',
  async (projectId, thunkAPI) => {
    if (!projectId) {
      return null;
    }
    try {
      const result = await httpHelperV2({
        url: `project/${projectId}/ifs-project`,
        method: 'GET',
      });
      const data = result?.data;
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return null;
      }
      return data;
    } catch (error) {
      const status = error?.status ?? error?.response?.status;
      if (status === 404) {
        return null;
      }
      return thunkAPI.rejectWithValue(error);
    }
  },
);

export {
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
};
