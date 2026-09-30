import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchData } from 'services/helpers';
import status from 'store/reducers/common/constants';
import { handleUnauthorized } from 'v2/helpers/session';

const fetchAdminInfo = createAsyncThunk('admin/fetchAdminInfo', async () =>
  fetch('/admin/info').then((result) => {
    if (result.status === 401) {
      handleUnauthorized();
      return new Promise(() => {});
    }
    return result.json();
  })
);

const limitToGetAll = 1000;
const fetchMainContractors = createAsyncThunk(
  'admin/fetchMainContractors',
  async (params) =>
    fetchData('user', { ...params, type: 2, limit: limitToGetAll }).then(
      (result) => result.data
    )
);

export default {
  [fetchAdminInfo.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading fetchAdminInfo',
      type: status.LOADING_STATUS,
    };
  },
  [fetchAdminInfo.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: 'IDLE ',
      type: status.IDLE_STATUS,
    };
    state.id = payload.id;
    state.accountId = payload.account_id;
    state.userName = payload.display_name;
    state.userEmail = payload.email;
    state.userType = `super admin`;
  },
  [fetchAdminInfo.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE',
      type: status.FAILURE_STATUS,
    };
  },
  [fetchMainContractors.pending]: (state) => {
    state.mainContractors = [];
  },
  [fetchMainContractors.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: 'IDLE ',
      type: status.IDLE_STATUS,
    };
    const mainContractors = payload && payload.length ? payload : [];
    // TODO: frequency && last-login
    state.mainContractors = mainContractors.map((user) => ({
      ...user,
      user: user.name,
      subscription: user.subscription_id,
      frequency: '',
      'registration-date': user.created_at,
      'last-login': '',
    }));
  },
  [fetchMainContractors.rejected]: (state) => {
    state.mainContractors = [];
  },
};
export { fetchAdminInfo, fetchMainContractors };
