import { createSlice } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
import extraReducers, { fetchAdminSupplyChain } from './extraReducers';

const initialState = {
  list: [],
  status: { severity: '', message: '', type: status.IDLE_STATUS },
  totalEnquiries: 0,
  totalQuotes: 0,
};

const usersSlice = createSlice({
  name: 'supply_chain',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchAdminSupplyChain };
export default usersSlice.reducer;
