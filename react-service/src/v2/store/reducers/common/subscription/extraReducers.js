import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchData, patchData } from 'services/helpers';
import status from 'store/reducers/common/constants';

const fetchSubscriptions = createAsyncThunk(
  'subscription/fetchSubscriptions',
  async ({ website }) =>
    fetchData(`account/subscription/${website}`).then((result) => result.data)
);

const changeSubscription = createAsyncThunk(
  'subscription/changeSubscription',
  async ({ aid, sid, extraData = {} }) => {
    const { ...extra } = extraData;
    return patchData(
      'account',
      extra || {},
      `update_subscription/${aid}/${sid}`
    ).then((result) => result.json());
  }
);

export default {
  [fetchSubscriptions.pending]: () => {},
  [fetchSubscriptions.fulfilled]: (state, { payload }) => {
    state.subscriptionsList = payload || [];
  },
  [fetchSubscriptions.rejected]: (state) => {
    state.subscriptionsList = [];
  },
  [changeSubscription.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Updating subscription',
      type: status.LOADING_STATUS,
    };
  },
  [changeSubscription.fulfilled]: (state) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [changeSubscription.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Updating subscription',
      type: status.FAILURE_STATUS,
    };
  },
};
export { fetchSubscriptions, changeSubscription };
