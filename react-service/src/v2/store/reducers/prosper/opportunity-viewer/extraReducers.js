import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchData, postData } from 'services/helpers';

const fetchRegions = createAsyncThunk(
  'account/fetchRegions',
  async (regionGroup) =>
    fetchData(
      `account`,
      { group: regionGroup },
      'regions',
      RELAY.VERSION,
      `${BASE_URLS.APP_PROSPER}${RELAY.HOST}`
    ).then((result) => result.data)
);

const fetchTrades = createAsyncThunk('account/fetchTrades', async () =>
  fetchData(
    `account`,
    {},
    'trades',
    RELAY.VERSION,
    `${BASE_URLS.APP_PROSPER}${RELAY.HOST}`
  ).then((result) => result.data)
);

const fetchOpportunity = createAsyncThunk('account/opportunity', async (data) =>
  postData(
    `account`,
    data,
    'opportunity',
    {},
    RELAY.VERSION,
    `${BASE_URLS.APP_PROSPER}${RELAY.HOST}`
  )
    .then((result) => result.json())
    .then((result) => result.data)
);

export default {
  [fetchRegions.pending]: () => {},
  [fetchRegions.fulfilled]: (state, { payload }) => {
    state.regions = payload;
  },
  [fetchRegions.rejected]: () => {},
  [fetchTrades.pending]: () => {},
  [fetchTrades.fulfilled]: (state, { payload }) => {
    state.trades = payload;
  },
  [fetchTrades.rejected]: () => {},
  [fetchOpportunity.pending]: () => {},
  [fetchOpportunity.fulfilled]: (state, { payload }) => {
    state.opportunity = payload;
  },
  [fetchOpportunity.rejected]: () => {},
};
export { fetchRegions, fetchTrades, fetchOpportunity };
