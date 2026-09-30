import { createSlice } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
import extraReducers, {
  fetchSubcontractorInfo,
  updateSubcontractorDescription,
  fetchRooms,
  unlockProject,
  claimToken,
} from './extraReducers';

const initialState = {
  id: 0,
  accountId: 0,
  title: '',
  subtitle: '',
  rooms: [],
  token_prices: [],
  membership: {
    regions: [4],
    tokens: 0,
  },
  info: {},
  statusRoom: '',
  trades: {},
  regions: {},
  subscription_id: null,
  firstname: '',
  lastname: '',
  email: '',
  job_description: '',
  account_owner: false,
  unlocked_projects: [],
  prosperProBanner: false,
  canClaimFreeTokens: false,
  contractor_id: null,
  how_to_win_work_opted: false,
  tokens_top_up: 0,
  status: {
    severity: false,
    message: '',
    type: status.IDLE_STATUS,
  },
  statusActions: {
    severity: false,
    message: '',
    type: status.IDLE_STATUS,
  },
  country: null,
  features: null,
};

const subcontractorSlice = createSlice({
  name: 'subcontractor',
  initialState,
  reducers: {
    reduceInfoToken(state) {
      state.membership.tokens -= 1;
    },
    updateSubscription(state, action) {
      const { payload } = action;
      state.subscription_id = payload.subscription_id;
    },
    enableProsperProBanner(state, action) {
      const { payload } = action;
      state.prosperProBanner = payload.enableProsperProBanner;
    },
    updateSubscriptionHowToWin(state, action) {
      const { payload } = action;
      state.how_to_win_work_opted = payload.how_to_win_work_opted;
    },
    updateUserDetails(state, action) {
      const { email, firstname, job_description, lastname } = action.payload;
      state.email = email;
      state.firstname = firstname;
      state.job_description = job_description;
      state.lastname = lastname;
    },
  },
  extraReducers,
});

export const {
  reduceInfoToken,
  updateSubscription,
  enableProsperProBanner,
  updateSubscriptionHowToWin,
  updateUserDetails,
} = subcontractorSlice.actions;
export {
  fetchSubcontractorInfo,
  fetchRooms,
  updateSubcontractorDescription,
  unlockProject,
  claimToken,
};
export default subcontractorSlice.reducer;
