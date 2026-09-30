import { createAsyncThunk } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
import { fetchData, patchData } from 'services/helpers';
import isArray from 'lodash/isArray';

const fetchFeatures = createAsyncThunk('features/fetchFeatures', async () =>
  fetchData('features').then((result) => result.data)
);

const fetchAccountFeatures = createAsyncThunk(
  'features/fetchAccountFeatures',
  async (aid = '') =>
    fetchData('features', {}, aid ? `account/${aid}` : 'account').then(
      (result) => result.data
    )
);

const updateAccountFeatures = createAsyncThunk(
  'features/updateAccountFeatures',
  async ({ add = [], remove = [] }) =>
    patchData(`features`, { add, remove }).then((r) => r.data)
);

const fetchAccountEnvelopes = createAsyncThunk(
  'features/fetchAccountEnvelopes',
  async (aid = '') => fetchData('features', {}, `envelope/${aid}`)
);

const updateAccountEnvelopes = createAsyncThunk(
  'features/updateAccountEnvelopes',
  async ({ aid, data = {} }) =>
    patchData(`features/envelope/${aid}`, data).then((r) => r.data)
);

export default {
  [fetchFeatures.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading features',
      type: status.LOADING_STATUS,
    };
  },
  [fetchFeatures.fulfilled]: (state, { payload }) => {
    if (payload) {
      state.featureList = payload;
    }
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [fetchFeatures.rejected]: (state) => {
    state.status = {
      severity: 'Loading features failed',
      message: '',
      type: status.FAILURE_STATUS,
    };
  },
  [fetchAccountFeatures.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading accounts with features',
      type: status.LOADING_STATUS,
    };
  },
  [fetchAccountFeatures.fulfilled]: (state, { payload }) => {
    if (payload && isArray(payload)) {
      const accountWithFeatures = {};
      payload.forEach((i) => {
        accountWithFeatures[i.account_id] = {
          id: i.id,
          account_id: i.account_id,
          account: i.account,
          features: accountWithFeatures[i.account_id]
            ? [...accountWithFeatures[i.account_id].features, i.feature]
            : [i.feature],
          feature_ids: accountWithFeatures[i.account_id]
            ? [...accountWithFeatures[i.account_id].feature_ids, i.feature_id]
            : [i.feature_id],
        };
      });
      state.list = Object.values(accountWithFeatures).map((i) => ({
        ...i,
        features: i.features.join(','),
        feature_ids: i.feature_ids.filter((f) => f).map((f) => Number(f)),
      }));
    }
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [fetchAccountFeatures.rejected]: (state) => {
    state.status = {
      severity: 'Loading accounts with features failed',
      message: '',
      type: status.FAILURE_STATUS,
    };
  },
  [updateAccountFeatures.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Updating features for accounts',
      type: status.LOADING_STATUS,
    };
  },
  [updateAccountFeatures.fulfilled]: (state, { payload }) => {
    if (payload) {
      state.list = payload;
    }
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [updateAccountFeatures.rejected]: (state) => {
    state.status = {
      severity: 'Updating features for accounts failed',
      message: '',
      type: status.FAILURE_STATUS,
    };
  },
  [fetchAccountEnvelopes.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading envelopes',
      type: status.LOADING_STATUS,
    };
  },
  [fetchAccountEnvelopes.fulfilled]: (state, { payload }) => {
    if (payload) {
      state.envelopes = payload;
    }
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [fetchAccountEnvelopes.rejected]: (state) => {
    state.status = {
      severity: 'Loading envelopes failed',
      message: '',
      type: status.FAILURE_STATUS,
    };
  },
  [updateAccountEnvelopes.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Updating envelopes for accounts',
      type: status.LOADING_STATUS,
    };
  },
  [updateAccountEnvelopes.fulfilled]: (state, { payload }) => {
    if (payload) {
      state.list = payload;
    }
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [updateAccountEnvelopes.rejected]: (state) => {
    state.status = {
      severity: 'Updating envelopes for accounts failed',
      message: '',
      type: status.FAILURE_STATUS,
    };
  },
};
export {
  fetchFeatures,
  fetchAccountFeatures,
  updateAccountFeatures,
  fetchAccountEnvelopes,
  updateAccountEnvelopes,
};
