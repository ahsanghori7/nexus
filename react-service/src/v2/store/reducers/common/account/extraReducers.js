import { createAsyncThunk } from '@reduxjs/toolkit';
import i18next from 'v2/helpers/i18n';
import startCase from 'lodash/startCase';
import {
  postData,
  patchData,
  fetchData,
  deleteData,
} from 'v2/services/helpers';
import status from 'store/reducers/common/constants';
import { httpHelperV2 } from 'v2/services/httpHelper';

const CLINK_RESOURCE = 'relay';
const CLINK_PARAMS = { action: 'account' };
const fetchTeam = createAsyncThunk('account/fetchTeam', async () =>
  fetchData(
    CLINK_RESOURCE,
    { ...CLINK_PARAMS, method: 'team' },
    '',
    '',
    '',
  ).then((result) => result.team),
);

const sendInvite = createAsyncThunk('account/inviteTeamMember', async (data) =>
  postData(
    CLINK_RESOURCE,
    data,
    '',
    { ...CLINK_PARAMS, method: 'teamInvite' },
    '',
    '',
    '',
  ).then((result) => result.json()),
);

const removeMemberTeam = createAsyncThunk(
  'account/removeMemberTeam',
  async (id) =>
    deleteData(
      CLINK_RESOURCE,
      { user_id: id },
      '',
      { ...CLINK_PARAMS, method: 'teamMemberRemove' },
      '',
      '',
      '',
    ).then((result) => result.json()),
);

const changeRole = createAsyncThunk(
  'account/changeRole',
  async ({ id, role }) =>
    patchData(
      CLINK_RESOURCE,
      { user_id: Number(id), role: role.id },
      '',
      { ...CLINK_PARAMS, method: 'teamChangeRole' },
      '',
      '',
      '',
    ).then((result) => result.json()),
);

const fetchAccounts = createAsyncThunk(
  'account/fetchAccounts',
  async (params) => {
    const { page, ...rest } = params;
    const { limit, ...args } = rest;
    return fetchData('account', limit > 0 ? rest : args, 'list').then(
      (result) => ({ ...result, ...params }),
    );
  },
);

const toggleStatus = createAsyncThunk('account/toggleStatus', async (account) =>
  patchData(
    'account',
    { status: account.status === i18next.t('active') ? 0 : 1 },
    `toggle_status/${account.id}`,
  ).then((result) => result.json()),
);

const fetchCompany = createAsyncThunk(
  'account/fetchCompany',
  async ({ id, pid }) =>
    fetchData(`account/${id}/company/${pid}`).then((result) => result.data),
);

const checkCompany = createAsyncThunk(
  'account/checkCompany',
  async ({ accountId, companyName }) => {
    return fetchData(`account/${accountId}/supply-chain/check-company`, {
      name: companyName,
    });
  },
);

const fetchGroups = createAsyncThunk('account/fetchGroups', async (accountId) => {
  return httpHelperV2({
    url: `account/${accountId}/groups`,
    method: 'GET',
  });
});

const addToSupplyChain = createAsyncThunk(
  'account/addToSupplyChain',
  async ({ accountId, data }) => {
    return postData(`account/${accountId}/supply-chain`, data);
  },
);

const upgradeProsperPro = createAsyncThunk(
  'account/upgradeProsperPro',
  async () =>
    postData('account', null, `prosper_pro_upgrade`).then(
      (result) => result.status,
    ),
);

const distance = createAsyncThunk('account/distance/projects', async (data) =>
  postData('account', data, 'distance/projects')
    .then((result) => result.json())
    .then((result) => result.data),
);

const toggleFirstPQQSend = createAsyncThunk(
  'account/toggleFirstPQQSend',
  async (account) =>
    patchData(
      'account',
      {
        first_pqq_sent:
          account.first_pqq_sent.toLowerCase() === i18next.t('true') ? 0 : 1,
      },
      `toggle_first_pqq_sent/${account.id}`,
    ).then((result) => result.json()),
);

const fetchApprovalThresholds = createAsyncThunk(
  'account/fetchApprovalThresholds',
  async () =>
    fetchData(
      CLINK_RESOURCE,
      { ...CLINK_PARAMS, method: 'getThresholds' },
      '',
      '',
      '',
    ).then((result) => result.thresholds),
);

const updateApprovalThresholds = createAsyncThunk(
  'account/updateApprovalThresholds',
  async (thresholds) =>
    postData(
      CLINK_RESOURCE,
      { data: thresholds },
      '',
      { ...CLINK_PARAMS, method: 'createThreshold' },
      '',
      '',
      '',
    ).then((result) => result.json()),
);
const updateMemberPermissions = createAsyncThunk(
  'account/updatePermissionThreshold',
  async (payload) => {
    return postData(
      'relay',
      payload,
      '',
      { action: 'account', method: 'updatePermissionThreshold' },
      '',
      '',
      '',
    ).then((res) => res.json());
  },
);

const userRoles = createAsyncThunk('account/roles', async (id) => {
  return httpHelperV2({
    url: `account/${id}/roles`,
    method: 'GET',
  });
});

export default {
  [fetchTeam.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading members',
      type: status.LOADING_STATUS,
    };
    state.team = {};
  },
  [fetchTeam.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
    state.team =
      (payload && {
        ...payload,
        user_role: payload.user_role,
        owner_id: payload.owner_id,
        members: payload.members.map((member) => {
          return {
            ...member,
            role: member.role,
          };
        }),
      }) ||
      {};
  },
  [fetchTeam.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Loading members',
      type: status.FAILURE_STATUS,
    };
    state.team = [];
  },
  [sendInvite.pending]: (state) => {
    state.inviteError = '';
  },
  [sendInvite.fulfilled]: (state) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [sendInvite.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Sending team member invite',
      type: status.FAILURE_STATUS,
    };
  },
  [removeMemberTeam.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Removing member',
      type: status.LOADING_STATUS,
    };
  },
  [removeMemberTeam.fulfilled]: (state, { payload, meta }) => {
    const { success: successResponse } = payload;
    if (successResponse) {
      const { arg: id } = meta;
      state.team = {
        ...state.team,
        members:
          state.team && state.team.members
            ? state.team.members.filter(
                (member) => Number(member.user_id) !== Number(id),
              )
            : [],
      };
    }
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [removeMemberTeam.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Removing member',
      type: status.FAILURE_STATUS,
    };
  },
  [changeRole.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Changing role',
      type: status.LOADING_STATUS,
    };
  },
  [changeRole.fulfilled]: (state, { payload, meta }) => {
    const { success: successResponse } = payload;
    if (successResponse) {
      const { arg } = meta;
      const { id, role } = arg;
      const fullRole = state.roles?.find((r) => r.id === String(role.id));

      state.team = {
        ...state.team,
        members:
          state.team && state.team.members
            ? state.team.members.map((member) =>
                Number(member.user_id) === Number(id)
                  ? {
                      ...member,
                      role: fullRole
                        ? {
                            id: fullRole.user_type_id,
                            label: fullRole.label,
                            level: fullRole.level,
                            value: fullRole.value,
                            user_type_id: fullRole.user_type_id,
                          }
                        : member.role,
                      roles: fullRole
                        ? [
                            {
                              id: fullRole.id,
                              label: fullRole.label,
                            },
                          ]
                        : member.roles,
                    }
                  : member,
              )
            : [],
      };
      state.status = {
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      };
    }
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [changeRole.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Changing role',
      type: status.FAILURE_STATUS,
    };
  },
  [fetchAccounts.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading accounts',
      type: status.LOADING_STATUS,
    };
    state.list = [];
  },
  [fetchAccounts.fulfilled]: (state, { meta, payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };

    const { arg } = meta;
    const { filtered } = arg;

    const accounts =
      payload && payload.data
        ? payload.data.map((a) => ({
            ...a,
            company: a.name,
            status: a.status ? i18next.t('active') : i18next.t('disabled'),
            'registration-date': a.created_at,
            first_pqq_sent: startCase(String(a.first_pqq_sent)),
          }))
        : [];
    // To trick pagination component, we add the number of
    // offset object behind the current page
    let mockAccountList = [...new Array(payload.offset).keys()];
    mockAccountList = mockAccountList.map((id) => ({ id: `mock-id-${id}` }));
    state.list = [...mockAccountList, ...accounts];
    state.listCount = (payload && payload.info && payload.info.count) || 0;

    if (filtered && filtered.length) {
      // listCount is not used here, so we don't need to update it
      const list = [...state.list];
      const filteredIds = filtered.map((i) => Number(i.account_id));
      state.list = list.filter((i) => !filteredIds.includes(i.id));
    }
  },
  [fetchAccounts.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'Error loading accounts',
      type: status.FAILURE_STATUS,
    };
    state.list = [];
    state.listCount = 0;
  },
  [toggleStatus.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Updating status',
      type: status.LOADING_STATUS,
    };
  },
  [toggleStatus.fulfilled]: (state, { meta, payload }) => {
    const { arg: account } = meta;
    const { success: successResponse } = payload;
    if (successResponse) {
      const list = state && state.list && state.list.length ? state.list : [];
      state.list = list.map((a) =>
        a.id === account.id
          ? {
              ...a,
              status:
                account.status === i18next.t('disabled')
                  ? i18next.t('active')
                  : i18next.t('disabled'),
            }
          : a,
      );
    }
    state.status = {
      severity: false,
      message: 'IDLE ',
      type: status.IDLE_STATUS,
    };
  },
  [toggleStatus.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Updating status',
      type: status.FAILURE_STATUS,
    };
  },
  [fetchCompany.pending]: () => {},
  [fetchCompany.fulfilled]: (state, { payload }) => {
    state.account = payload;
  },
  [fetchCompany.rejected]: () => {},
  [fetchGroups.pending]: () => {},
  [fetchGroups.fulfilled]: (state, { payload }) => {
    state.groups = payload.groups || [];
  },
  [fetchGroups.rejected]: () => {},
  [upgradeProsperPro.pending]: () => {},
  [upgradeProsperPro.fulfilled]: () => {},
  [upgradeProsperPro.rejected]: () => {},
  [distance.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Retrieving distance data',
      type: status.LOADING_STATUS,
    };
  },
  [distance.fulfilled]: (state, { payload }) => {
    if (payload.success && payload.distance && payload.distance.length) {
      state.distance = [...state.distance, ...payload.distance];
    }
  },
  [distance.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Retrieving distance data',
      type: status.FAILURE_STATUS,
    };
  },
  [toggleFirstPQQSend.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Updating First PQQ sent property',
      type: status.LOADING_STATUS,
    };
  },
  [toggleFirstPQQSend.fulfilled]: (state, { meta, payload }) => {
    const { arg: account } = meta;
    const { success: successResponse } = payload;
    if (successResponse) {
      const list = state && state.list && state.list.length ? state.list : [];
      state.list = list.map((a) =>
        a.id === account.id
          ? {
              ...a,
              first_pqq_sent:
                account.first_pqq_sent.toLowerCase() === i18next.t('false')
                  ? startCase(i18next.t('true'))
                  : startCase(i18next.t('false')),
            }
          : a,
      );
    }
    state.status = {
      severity: false,
      message: 'IDLE ',
      type: status.IDLE_STATUS,
    };
  },
  [toggleFirstPQQSend.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Updating First PQQ sent property',
      type: status.FAILURE_STATUS,
    };
  },
  [fetchApprovalThresholds.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading approval thresholds',
      type: status.LOADING_STATUS,
    };
  },
  [fetchApprovalThresholds.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
    state.approvalThresholds = payload;
  },
  [fetchApprovalThresholds.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Loading approval thresholds',
      type: status.FAILURE_STATUS,
    };
    state.approvalThresholds = [];
  },
  [updateApprovalThresholds.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Updating approval thresholds',
      type: status.LOADING_STATUS,
    };
  },
  [updateApprovalThresholds.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
    state.approvalThresholds = payload.thresholds;
  },
  [updateApprovalThresholds.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Updating approval thresholds',
      type: status.FAILURE_STATUS,
    };
  },
  [updateMemberPermissions.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Updating member permissions locally...',
      type: status.LOADING_STATUS,
    };
  },
  [updateMemberPermissions.fulfilled]: (state, { payload }) => {
    const { user_id, permissions } = payload;
    if (state.team?.members?.length) {
      state.team.members = state.team.members.map((member) =>
        Number(member.user_id) === Number(user_id)
          ? { ...member, permissions }
          : member,
      );
    }

    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [updateMemberPermissions.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILED updating member permissions locally',
      type: status.FAILURE_STATUS,
    };
  },
  [userRoles.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Getting roles locally...',
      type: status.LOADING_STATUS,
    };
    state.roles = [];
  },
  [userRoles.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
    state.roles = payload?.roles;
  },
  [userRoles.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILED to getting roles locally',
      type: status.FAILURE_STATUS,
    };
    state.roles = [];
  },
};

export {
  fetchTeam,
  sendInvite,
  removeMemberTeam,
  changeRole,
  fetchAccounts,
  toggleStatus,
  fetchCompany,
  checkCompany,
  fetchGroups,
  addToSupplyChain,
  upgradeProsperPro,
  distance,
  toggleFirstPQQSend,
  fetchApprovalThresholds,
  updateApprovalThresholds,
  updateMemberPermissions,
  userRoles,
};
