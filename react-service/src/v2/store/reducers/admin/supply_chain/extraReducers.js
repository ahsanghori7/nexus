import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchData } from 'services/helpers';
import status from 'store/reducers/common/constants';

const fetchAdminSupplyChain = createAsyncThunk(
  'supply_chain/fetchAdminSupplyChain',
  async (aid) => fetchData(`account/supply_chain/${aid}`).then((r) => r.data)
);
export default {
  [fetchAdminSupplyChain.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading supply chain',
      type: status.LOADING_STATUS,
    };
    state.list = [];
  },
  [fetchAdminSupplyChain.fulfilled]: (state, { payload }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
    state.list = payload ? payload.map((p, i) => ({ id: i + 1, ...p })) : [];
  },
  [fetchAdminSupplyChain.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'Error loading supply chain',
      type: status.FAILURE_STATUS,
    };
    state.list = [];
  },
};
export { fetchAdminSupplyChain };
