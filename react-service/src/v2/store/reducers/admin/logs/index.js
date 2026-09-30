import { createSlice } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
import extraReducers, { fetchLogs } from './extraReducers';

const initialState = {
  list: [],
  listCount: 0,
  status: { severity: '', message: '', type: status.IDLE_STATUS },
};

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    updateLogs(state, action) {
      state.list = action.payload;
    },
  },
  extraReducers,
});

export const { updateLogs } = logsSlice.actions;
export { fetchLogs };
export default logsSlice.reducer;
