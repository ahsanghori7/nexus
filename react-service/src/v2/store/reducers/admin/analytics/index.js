import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
  fetchTokens,
  fetchSupplyChainAnalytics,
} from './extraReducers';

const initialState = {
  issuedpaidweek: {
    labels: [],
    datasets: [],
  },
  issuedpaidday: [],
  usedfreeday: [],
  usedfreeweek: {
    labels: [],
    datasets: [],
  },
  status: '',
  supplyChain: {
    labels: [],
    datasets: [],
  },
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchTokens, fetchSupplyChainAnalytics };
export default analyticsSlice.reducer;
