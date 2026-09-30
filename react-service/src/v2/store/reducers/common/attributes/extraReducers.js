import {
  fetchRegions,
  fetchTrades,
  fetchProjectType,
  fetchPublicTrades,
  fetchAsiteFolders,
} from './asyncThunk';

export default {
  [fetchRegions.pending]: (state) => {
    state.loading1 = true;
    state.error = '';
  },
  [fetchRegions.fulfilled]: (state, { payload }) => {
    state.regions = payload.data;
    state.loading1 = false;
  },
  [fetchRegions.rejected]: (state) => {
    state.loading1 = false;
    state.error = 'An error occurred while fetching the regions attributes.';
  },
  [fetchTrades.pending]: (state) => {
    state.loading2 = true;
    state.error = '';
  },
  [fetchTrades.fulfilled]: (state, { payload }) => {
    state.trades = payload.data;
    state.loading2 = false;
  },
  [fetchTrades.rejected]: (state) => {
    state.loading2 = false;
    state.error = 'An error occurred while fetching the trades attributes.';
  },
  [fetchPublicTrades.pending]: (state) => {
    state.loading2 = true;
    state.error = '';
  },
  [fetchPublicTrades.fulfilled]: (state, { payload }) => {
    state.trades = payload.data;
    state.loading2 = false;
  },
  [fetchPublicTrades.rejected]: (state) => {
    state.loading2 = false;
    state.error =
      'An error occurred while fetching the public trades attributes.';
  },
  [fetchProjectType.pending]: (state) => {
    state.loading3 = true;
    state.error = '';
  },
  [fetchProjectType.fulfilled]: (state, { payload }) => {
    state.projectType = payload.data;
    state.loading3 = false;
  },
  [fetchProjectType.rejected]: (state) => {
    state.loading3 = false;
    state.error =
      'An error occurred while fetching the project type attributes.';
  },
  [fetchAsiteFolders.pending]: (state) => {
    state.loading4 = true;
    state.error = '';
  },
  [fetchAsiteFolders.fulfilled]: (state, { payload }) => {
    state.asiteFolders = payload.data || [];
    state.loading4 = false;
  },
  [fetchAsiteFolders.rejected]: (state) => {
    state.loading4 = false;
    state.error = 'An error occurred while fetching the asite folders.';
  },
};

export { fetchRegions, fetchTrades, fetchProjectType, fetchPublicTrades, fetchAsiteFolders };
