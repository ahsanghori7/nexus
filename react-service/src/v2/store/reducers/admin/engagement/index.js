import { createSlice } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
import extraReducers, { fetchEngagement } from './extraReducers';

const initialState = {
  list: [],
  status: { severity: '', message: '', type: status.IDLE_STATUS },
  totalEnquiries: 0,
  totalQuotes: 0,
};

const usersSlice = createSlice({
  name: 'engagement',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchEngagement };
export default usersSlice.reducer;
