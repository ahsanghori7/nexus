import { createAsyncThunk } from '@reduxjs/toolkit';
import capitalize from 'lodash/capitalize';
import { renderTextWithoutHtml } from 'v2/helpers/data';
import { fetchData } from 'services/helpers';
import status from 'store/reducers/common/constants';

const fetchLogs = createAsyncThunk('logs/fetchLogs', async (params) => {
  const { page, ...rest } = params;
  const { limit, ...args } = rest;
  return fetchData('account/fetch-action', limit > 0 ? rest : args).then(
    (result) => ({
      ...result,
      ...params,
    }),
  );
});

export default {
  [fetchLogs.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading account logs',
      type: status.LOADING_STATUS,
    };
    state.list = [];
  },
  [fetchLogs.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };

    const logs =
      payload && payload?.data
        ? payload.data.map((log) => ({
            ...log,
            action_type: capitalize(log.action_type),
            description: renderTextWithoutHtml(log.description),
            action_date: log.action_date,
          }))
        : [];

    // If pagination offset is provided, create mock logs
    let mockLogList = [];
    if (payload?.offset) {
      mockLogList = [...new Array(payload.offset).keys()].map((id) => ({
        id: `mock-log-id-${id}`,
      }));
    }
    state.list = [...mockLogList, ...logs];
    state.listCount = payload?.info?.count || 0;
  },

  [fetchLogs.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'FAILURE Loading account logs',
      type: status.FAILURE_STATUS,
    };
    state.list = [];
    state.listCount = 0;
  },
};
export { fetchLogs };
