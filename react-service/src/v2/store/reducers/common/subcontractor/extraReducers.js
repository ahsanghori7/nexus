import { createAsyncThunk } from '@reduxjs/toolkit';
import isArray from 'lodash/isArray';
import sortBy from 'lodash/sortBy';
import { postData, patchData, fetchData } from 'services/helpers';
import useClarity from 'v2/helpers/clarity';
import { renderTextWithoutHtml } from 'v2/helpers/data';
import status from 'store/reducers/common/constants';
import { handleUnauthorized } from 'v2/helpers/session';

const fetchSubcontractorInfo = createAsyncThunk(
  'subcontractor/fetchSubcontractorInfo',
  async () => fetch('/subcontractor/info').then((result) => {
    if (result.status === 401) {
      handleUnauthorized();
      return new Promise(() => {});
    }
    return result.json();
  })
);

const updateSubcontractorDescription = createAsyncThunk(
  'subcontractor/updateSubcontractorDescription',
  async ({ data, id }) => {
    const firstname = data.firstname;
    const lastname = data.lastname;
    const email = data.email;
    const job_description = data.job_description;

    return patchData(
      'company_profile/',
      { firstname, lastname, email, job_description },
      `${id}/user_information`
    ).then((result) => result.json());
  }
);

const fetchRooms = createAsyncThunk('subcontractor/fetchRooms', async () =>
  fetchData('inbox', false, 'room').then((result) => result.data)
);

const unlockProject = createAsyncThunk(
  'subcontractor/unlockProject',
  async (pid) =>
    postData(`account`, { pid }, 'unlock_project').then((result) =>
      result.status === 200 ? result.json() : result.status
    )
);

const claimToken = createAsyncThunk('subcontractor/claimToken', async () =>
  postData(`account`, null, 'free_token_claim')
    .then((result) => result.json())
    .then((result) => result.data)
);

let envs = ['production'];
if (CLARITY && CLARITY.DEBUG) {
  envs = ['staging', 'uat', 'production'];
}
export default {
  [updateSubcontractorDescription.pending]: (state) => {
    state.statusActions = {
      severity: 'info',
      message: 'Updating subcontractor details',
      type: status.IDLE_STATUS,
    };
  },
  [updateSubcontractorDescription.fulfilled]: (state, { meta }) => {
    const { arg } = meta;
    state.firstname = arg.data.firstname || state.firstname;
    state.lastname = arg.data.lastname || state.lastname;
    state.email = arg.data.email || state.email;
    state.job_description = arg.data.job_description || state.job_description;

    state.statusActions = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [updateSubcontractorDescription.rejected]: (state) => {
    state.statusActions = {
      severity: 'error',
      message: 'Updating subcontractor details failed',
      type: status.FAILURE_STATUS,
    };
  },
  [fetchSubcontractorInfo.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading fetchAdminInfo',
      type: status.LOADING_STATUS,
    };
  },
  [fetchSubcontractorInfo.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };

    state.id = payload.id || state.id;
    state.accountId = payload.account_id || state.accountId;
    state.created_at = payload.created_at || state.created_at;
    state.title = renderTextWithoutHtml(payload.display_name) || state.title;
    state.subtitle =
      renderTextWithoutHtml(payload.company_name) || state.subtitle;
    state.membership = payload.membership || state.membership;
    state.tokens_top_up = payload.tokens_top_up || state.tokens_top_up;
    state.info = { ...payload } || state.info;
    state.trades = payload.trades || state.trades;
    state.regions = payload.regions || state.regions;
    state.subscription_id = payload.subscription_id || state.subscription_id;
    state.token_prices = payload.token_prices || state.token_prices;
    state.contractor_id = payload.contractor_id;
    state.firstname = payload.firstname || state.firstname;
    state.lastname = payload.lastname || state.lastname;
    state.email = payload.email || state.email;
    state.phone = payload.phone || state.phone;
    state.job_description = payload.job_description || state.job_description;
    state.account_owner = payload.account_owner || state.account_owner;
    state.unlocked_projects =
      payload.unlocked_projects || state.unlocked_projects;
    state.prosperProBanner = payload.prosper_pro_banner;
    state.canClaimFreeTokens =
      payload.can_claim_free_tokens || state.canClaimFreeTokens;
    state.how_to_win_work_opted =
      payload.how_to_win_work_opted || state.how_to_win_work_opted;
    state.country = payload.country || state.country;
    state.features = payload.features || state.features;

    if (CLARITY && CLARITY.PROJECT_ID && ENV && envs.includes(ENV)) {
      const set = () => {
        clarity('set', 'environment', ENV);
        clarity('set', 'user_id', String(payload.id));
        clarity('set', 'account_id', String(payload.account_id));
        clarity('set', 'subscription_id', String(payload.subscription_id));
        clarity('set', 'app', 'app.prosper');
      };
      useClarity(set);
    }
  },
  [fetchSubcontractorInfo.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE',
      type: status.FAILURE_STATUS,
    };
  },
  [fetchRooms.pending]: (state) => {
    state.statusRoom = 'loading';
  },
  [fetchRooms.fulfilled]: (state, { payload }) => {
    state.statusRoom = '';
    let rooms = payload && isArray(payload) ? payload : [];
    rooms = rooms.filter(
      (room) =>
        room.company &&
        room.company.name &&
        room.author &&
        room.author.name &&
        room.recipient &&
        room.recipient.name &&
        room.project &&
        room.project.name
    );
    state.rooms = sortBy(rooms, ['lastUpdate']).reverse();
  },
  [fetchRooms.rejected]: (state) => {
    state.statusRoom = 'error';
    state.rooms = [];
  },
  [unlockProject.pending]: () => {},
  [unlockProject.fulfilled]: (state, { meta, payload }) => {
    const { arg: pid } = meta;
    const { success } = payload;
    if (success) {
      state.unlocked_projects = [...state.unlocked_projects, pid];
    }
  },
  [unlockProject.rejected]: () => {},
  [claimToken.pending]: () => {},
  [claimToken.fulfilled]: (state, { payload }) => {
    const { success } = payload;
    if (success) {
      state.membership.tokens =
        (state.membership.tokens || 0) + (state.tokens_top_up || 1);
      state.canClaimFreeTokens = false;
    }
  },
  [claimToken.rejected]: () => {},
};
export {
  fetchSubcontractorInfo,
  fetchRooms,
  updateSubcontractorDescription,
  unlockProject,
  claimToken,
};
