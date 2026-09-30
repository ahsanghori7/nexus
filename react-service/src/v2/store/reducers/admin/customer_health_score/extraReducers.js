import i18next from 'v2/helpers/i18n';
import capitalize from 'lodash/capitalize';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchData, patchData } from 'services/helpers';
import status from 'store/reducers/common/constants';

const fetchHealthScore = createAsyncThunk(
  'customer_health_score/fetchHealthScore',
  async () => fetchData(`account/customer_health_score`).then((r) => r.data)
);

const updateHealthScore = createAsyncThunk(
  'customer_health_score/updateHealthScore',
  async ({ add = [], remove = [] }) =>
    patchData(`account/customer_health_score`, { add, remove }).then(
      (r) => r.data
    )
);

export default {
  [fetchHealthScore.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading Health Score',
      type: status.LOADING_STATUS,
    };
    state.list = [];
  },
  [fetchHealthScore.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
    if (payload && payload.length) {
      state.list = payload.map((i) => ({
        ...i,
        tender: i.tender
          ? capitalize(i18next.t('true'))
          : capitalize(i18next.t('false')),
        issued: i.issued
          ? capitalize(i18next.t('true'))
          : capitalize(i18next.t('false')),
        budget: i.budget
          ? capitalize(i18next.t('true'))
          : capitalize(i18next.t('false')),
      }));
    }
  },
  [fetchHealthScore.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'Error loading Health Score',
      type: status.FAILURE_STATUS,
    };
    state.list = [];
    state.listCount = 0;
  },
  [updateHealthScore.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Updating Health Score',
      type: status.LOADING_STATUS,
    };
  },
  [updateHealthScore.fulfilled]: (state) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
  },
  [updateHealthScore.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'Error updating Health Score',
      type: status.FAILURE_STATUS,
    };
  },
};
export { fetchHealthScore, updateHealthScore };
