import extraReducers, {
  fetchTeam,
  sendInvite,
  removeMemberTeam,
  changeRole,
  fetchAccounts,
  toggleStatus,
  fetchCompany,
  upgradeProsperPro,
  distance,
  toggleFirstPQQSend,
} from './extraReducers';
import status from 'store/reducers/common/constants';

jest.mock('v2/services/helpers', () => ({
  postData: jest.fn(),
  patchData: jest.fn(),
  fetchData: jest.fn(),
  deleteData: jest.fn(),
}));

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    if (key === 'active') return 'active';
    if (key === 'disabled') return 'disabled';
    if (key === 'true') return 'true';
    if (key === 'false') return 'false';
    return key;
  }),
}));

jest.mock('lodash/startCase', () => jest.fn((str) => str));

jest.mock('v2/helpers/roles', () => ({
  admin: { value: 'administrator', id: 1 },
}));

describe('common account extraReducers', () => {
  let state;

  beforeEach(() => {
    state = {
      list: [],
      listCount: 0,
      team: {},
      roles: [],
      status: { severity: '', message: '', type: status.IDLE_STATUS },
      inviteError: '',
      account: null,
      distance: [],
      features: [],
    };
    jest.clearAllMocks();
  });

  // ─── fetchTeam ───────────────────────────────────────────────────────────────

  describe('fetchTeam', () => {
    it('should handle fetchTeam.pending', () => {
      extraReducers[fetchTeam.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading members',
        type: status.LOADING_STATUS,
      });
      expect(state.team).toEqual({});
    });

    it('should handle fetchTeam.fulfilled with payload', () => {
      const payload = {
        user_role: 'account_holder',
        owner_id: '123',
        members: [
          { user_id: 1, role: { label: 'administrator' } },
          { user_id: 2, role: { label: 'member' } },
        ],
      };
      extraReducers[fetchTeam.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.team).toEqual({ ...payload });
    });

    it('should handle fetchTeam.fulfilled with empty payload', () => {
      const payload = null;
      extraReducers[fetchTeam.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.team).toEqual({});
    });

    it('should handle fetchTeam.rejected', () => {
      extraReducers[fetchTeam.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE Loading members',
        type: status.FAILURE_STATUS,
      });
      expect(state.team).toEqual([]);
    });
  });

  // ─── sendInvite ──────────────────────────────────────────────────────────────

  describe('sendInvite', () => {
    it('should handle sendInvite.pending', () => {
      state.inviteError = 'some error';
      extraReducers[sendInvite.pending](state);
      expect(state.inviteError).toBe('');
    });

    it('should handle sendInvite.fulfilled with success', () => {
      const payload = { status: true, message: 'Invite sent' };
      extraReducers[sendInvite.fulfilled](state, { payload });
      expect(state.inviteError).toBe('');
    });

    it('should handle sendInvite.rejected', () => {
      extraReducers[sendInvite.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE Sending team member invite',
        type: status.FAILURE_STATUS,
      });
    });
  });

  // ─── toggleStatus ────────────────────────────────────────────────────────────

  describe('toggleStatus', () => {
    it('should handle toggleStatus.pending', () => {
      extraReducers[toggleStatus.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Updating status',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle toggleStatus.fulfilled with success and change status from disabled to active', () => {
      state.list = [{ id: 1, status: 'disabled' }];
      const account = { id: 1, status: 'disabled' };
      const payload = { success: true };
      extraReducers[toggleStatus.fulfilled](state, {
        meta: { arg: account },
        payload,
      });
      expect(state.list[0].status).toBe('active');
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle toggleStatus.fulfilled with success and change status from active to disabled', () => {
      state.list = [{ id: 1, status: 'active' }];
      const account = { id: 1, status: 'active' };
      const payload = { success: true };
      extraReducers[toggleStatus.fulfilled](state, {
        meta: { arg: account },
        payload,
      });
      expect(state.list[0].status).toBe('disabled');
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle toggleStatus.fulfilled without success', () => {
      state.list = [{ id: 1, status: 'disabled' }];
      const account = { id: 1, status: 'disabled' };
      const payload = { success: false };
      extraReducers[toggleStatus.fulfilled](state, {
        meta: { arg: account },
        payload,
      });
      expect(state.list[0].status).toBe('disabled');
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle toggleStatus.rejected', () => {
      extraReducers[toggleStatus.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE Updating status',
        type: status.FAILURE_STATUS,
      });
    });
  });

  // ─── removeMemberTeam ────────────────────────────────────────────────────────

  describe('removeMemberTeam', () => {
    it('should handle removeMemberTeam.pending', () => {
      extraReducers[removeMemberTeam.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Removing member',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle removeMemberTeam.fulfilled with success', () => {
      state.team = { members: [{ user_id: 1 }, { user_id: 2 }] };
      const payload = { success: true };
      const meta = { arg: 1 };
      extraReducers[removeMemberTeam.fulfilled](state, { payload, meta });
      expect(state.team.members).toEqual([{ user_id: 2 }]);
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle removeMemberTeam.fulfilled without success', () => {
      state.team = { members: [{ user_id: 1 }, { user_id: 2 }] };
      const payload = { success: false };
      const meta = { arg: 1 };
      extraReducers[removeMemberTeam.fulfilled](state, { payload, meta });
      expect(state.team.members).toEqual([{ user_id: 1 }, { user_id: 2 }]);
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle removeMemberTeam.rejected', () => {
      extraReducers[removeMemberTeam.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE Removing member',
        type: status.FAILURE_STATUS,
      });
    });
  });

  // ─── changeRole ──────────────────────────────────────────────────────────────

  describe('changeRole', () => {
    it('should handle changeRole.pending', () => {
      extraReducers[changeRole.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Changing role',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle changeRole.fulfilled with success', () => {
      // state.roles needed so reducer can find the full role object by role.id
      state.roles = [
        {
          id: '2',
          label: 'Super Admin',
          description: '',
          user_type_id: '8',
          level: '2',
        },
      ];
      state.team = {
        members: [{ user_id: 1, role: { id: '1', label: 'administrator' } }],
      };

      // role is now the full option object { id, label, value } from the dropdown
      const meta = {
        arg: { id: 1, role: { id: '2', label: 'Super Admin', value: '2' } },
      };
      const payload = { success: true };

      extraReducers[changeRole.fulfilled](state, { payload, meta });

      // Reducer finds role by role.id in state.roles
      // and maps user_type_id as id to stay consistent with team endpoint format
      expect(state.team.members[0].role).toEqual({
        id: '8', // fullRole.user_type_id
        label: 'Super Admin',
        level: '2',
        user_type_id: '8',
      });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle changeRole.fulfilled with success but role not found in state.roles (fallback)', () => {
      state.roles = []; // empty — role won't be found
      state.team = {
        members: [{ user_id: 1, role: { id: '1', label: 'administrator' } }],
      };
      const meta = {
        arg: { id: 1, role: { id: '99', label: 'unknown', value: '99' } },
      };
      const payload = { success: true };

      extraReducers[changeRole.fulfilled](state, { payload, meta });

      // Falls back to existing role when fullRole not found in state.roles
      expect(state.team.members[0].role).toEqual({
        id: '1',
        label: 'administrator',
      });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle changeRole.fulfilled without success', () => {
      state.roles = [
        {
          id: '2',
          label: 'Super Admin',
          description: '',
          user_type_id: '8',
          level: '2',
        },
      ];
      state.team = {
        members: [{ user_id: 1, role: { label: 'member' } }],
      };
      const meta = {
        arg: { id: 1, role: { id: '2', label: 'Super Admin', value: '2' } },
      };
      const payload = { success: false };

      extraReducers[changeRole.fulfilled](state, { payload, meta });

      // Role should not change when success is false
      expect(state.team.members[0].role).toEqual({ label: 'member' });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle changeRole.rejected', () => {
      extraReducers[changeRole.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE Changing role',
        type: status.FAILURE_STATUS,
      });
    });
  });

  // ─── fetchAccounts ───────────────────────────────────────────────────────────

  describe('fetchAccounts', () => {
    it('should handle fetchAccounts.pending', () => {
      extraReducers[fetchAccounts.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading accounts',
        type: status.LOADING_STATUS,
      });
      expect(state.list).toEqual([]);
    });

    it('should handle fetchAccounts.fulfilled with data', () => {
      const payload = {
        data: [
          {
            id: 1,
            name: 'Comp1',
            status: 1,
            created_at: '2023-01-01',
            first_pqq_sent: 0,
          },
        ],
        info: { count: 1 },
        offset: 0,
      };
      const meta = { arg: { filtered: [] } };
      extraReducers[fetchAccounts.fulfilled](state, { payload, meta });
      expect(state.list).toEqual([
        {
          id: 1,
          company: 'Comp1',
          status: 'active',
          'registration-date': '2023-01-01',
          first_pqq_sent: '0',
          name: 'Comp1',
          created_at: '2023-01-01',
        },
      ]);
      expect(state.listCount).toBe(1);
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle fetchAccounts.fulfilled with filtered data', () => {
      const payload = {
        data: [
          {
            id: 1,
            name: 'Comp1',
            status: 1,
            created_at: '2023-01-01',
            first_pqq_sent: 0,
          },
          {
            id: 2,
            name: 'Comp2',
            status: 1,
            created_at: '2023-01-02',
            first_pqq_sent: 0,
          },
        ],
        info: { count: 2 },
        offset: 0,
      };
      const meta = { arg: { filtered: [{ account_id: 1 }] } };
      extraReducers[fetchAccounts.fulfilled](state, { payload, meta });
      expect(state.list).toEqual([
        {
          id: 2,
          company: 'Comp2',
          status: 'active',
          'registration-date': '2023-01-02',
          first_pqq_sent: '0',
          name: 'Comp2',
          created_at: '2023-01-02',
        },
      ]);
      expect(state.listCount).toBe(2);
    });

    it('should handle fetchAccounts.rejected', () => {
      extraReducers[fetchAccounts.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'Error loading accounts',
        type: status.FAILURE_STATUS,
      });
      expect(state.list).toEqual([]);
      expect(state.listCount).toBe(0);
    });
  });

  // ─── fetchCompany ────────────────────────────────────────────────────────────

  describe('fetchCompany', () => {
    it('should handle fetchCompany.pending', () => {
      extraReducers[fetchCompany.pending](state);
      expect(state.status).toEqual({
        severity: '',
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle fetchCompany.fulfilled', () => {
      const payload = { id: 1, name: 'Company A' };
      extraReducers[fetchCompany.fulfilled](state, { payload });
      expect(state.account).toEqual(payload);
    });

    it('should handle fetchCompany.rejected', () => {
      extraReducers[fetchCompany.rejected](state);
      expect(state.status).toEqual({
        severity: '',
        message: '',
        type: status.IDLE_STATUS,
      });
    });
  });

  // ─── upgradeProsperPro ───────────────────────────────────────────────────────

  describe('upgradeProsperPro', () => {
    it('should handle upgradeProsperPro.pending', () => {
      extraReducers[upgradeProsperPro.pending](state);
      expect(state.status).toEqual({
        severity: '',
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle upgradeProsperPro.fulfilled', () => {
      extraReducers[upgradeProsperPro.fulfilled](state);
      expect(state.status).toEqual({
        severity: '',
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle upgradeProsperPro.rejected', () => {
      extraReducers[upgradeProsperPro.rejected](state);
      expect(state.status).toEqual({
        severity: '',
        message: '',
        type: status.IDLE_STATUS,
      });
    });
  });

  // ─── distance ────────────────────────────────────────────────────────────────

  describe('distance', () => {
    it('should handle distance.pending', () => {
      extraReducers[distance.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Retrieving distance data',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle distance.fulfilled with success and data', () => {
      state.distance = [{ id: 1 }];
      const payload = { success: true, distance: [{ id: 2 }] };
      extraReducers[distance.fulfilled](state, { payload });
      expect(state.distance).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should handle distance.fulfilled without success', () => {
      state.distance = [{ id: 1 }];
      const payload = { success: false, distance: [{ id: 2 }] };
      extraReducers[distance.fulfilled](state, { payload });
      expect(state.distance).toEqual([{ id: 1 }]);
    });

    it('should handle distance.fulfilled with empty distance array', () => {
      state.distance = [{ id: 1 }];
      const payload = { success: true, distance: [] };
      extraReducers[distance.fulfilled](state, { payload });
      expect(state.distance).toEqual([{ id: 1 }]);
    });

    it('should handle distance.rejected', () => {
      extraReducers[distance.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE Retrieving distance data',
        type: status.FAILURE_STATUS,
      });
    });
  });

  // ─── toggleFirstPQQSend ──────────────────────────────────────────────────────

  describe('toggleFirstPQQSend', () => {
    it('should handle toggleFirstPQQSend.pending', () => {
      extraReducers[toggleFirstPQQSend.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Updating First PQQ sent property',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle toggleFirstPQQSend.fulfilled with success and change from false to true', () => {
      state.list = [{ id: 1, first_pqq_sent: 'false' }];
      const account = { id: 1, first_pqq_sent: 'false' };
      const payload = { success: true };
      extraReducers[toggleFirstPQQSend.fulfilled](state, {
        meta: { arg: account },
        payload,
      });
      expect(state.list[0].first_pqq_sent).toBe('true');
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle toggleFirstPQQSend.fulfilled with success and change from true to false', () => {
      state.list = [{ id: 1, first_pqq_sent: 'true' }];
      const account = { id: 1, first_pqq_sent: 'true' };
      const payload = { success: true };
      extraReducers[toggleFirstPQQSend.fulfilled](state, {
        meta: { arg: account },
        payload,
      });
      expect(state.list[0].first_pqq_sent).toBe('false');
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle toggleFirstPQQSend.fulfilled without success', () => {
      state.list = [{ id: 1, first_pqq_sent: 'false' }];
      const account = { id: 1, first_pqq_sent: 'false' };
      const payload = { success: false };
      extraReducers[toggleFirstPQQSend.fulfilled](state, {
        meta: { arg: account },
        payload,
      });
      expect(state.list[0].first_pqq_sent).toBe('false');
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle toggleFirstPQQSend.rejected', () => {
      extraReducers[toggleFirstPQQSend.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE Updating First PQQ sent property',
        type: status.FAILURE_STATUS,
      });
    });
  });
});
