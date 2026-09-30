import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchData } from 'services/helpers';

const fetchFilterOptions = createAsyncThunk(
  'company/fetchFilterOptions',
  async ({ id }) =>
    fetchData(`company_profile`, {}, `${id}/filter_options`).then(
      (result) => result.data
    )
);

export default {
  [fetchFilterOptions.pending]: () => {},
  [fetchFilterOptions.fulfilled]: (state, { payload }) => {
    const trades = (payload && payload.trades) || [];
    const regions = (payload && payload.regions) || [];
    const types = (payload && payload.types) || [];
    state.list = {
      ...state.list,
      trades: trades.map((r) => ({ ...r, id: Number(r.id) })),
      regions: regions.map((r) => ({ ...r, id: Number(r.id) })),
      types: types.map((r) => ({ ...r, id: Number(r.id) })),
    };
  },
  [fetchFilterOptions.rejected]: () => {},
};
export { fetchFilterOptions };
