import { createSlice } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
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
  fetchApprovalThresholds,
  updateApprovalThresholds,
  updateMemberPermissions,
  userRoles,
  checkCompany,
  fetchGroups,
  addToSupplyChain,
} from './extraReducers';

const initialState = {
  list: [],
  listCount: 0,
  team: {},
  status: { severity: '', message: '', type: status.IDLE_STATUS },
  inviteError: '',
  account: null,
  distance: [],
  features: [],
  approvalThresholds: [],
  roles: [],
  groups: [],
};

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    updateAccounts(state, action) {
      state.list = action.payload;
    },
  },
  extraReducers,
});

export const { updateAccounts } = accountSlice.actions;
export {
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
  fetchApprovalThresholds,
  updateApprovalThresholds,
  updateMemberPermissions,
  userRoles,
  checkCompany,
  fetchGroups,
  addToSupplyChain,
};
export default accountSlice.reducer;
