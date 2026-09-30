import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
  fetchRegions,
  fetchTrades,
  fetchOpportunity,
} from './extraReducers';

const initialState = {
  trades: [],
  regions: [],
  opportunity: {},
};

const opportunityViewerSlice = createSlice({
  name: 'opportunity-viewer',
  initialState,
  extraReducers,
  reducers: {},
});

export { fetchRegions, fetchTrades, fetchOpportunity };
export default opportunityViewerSlice.reducer;
