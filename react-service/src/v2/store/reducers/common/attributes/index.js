import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
  fetchRegions,
  fetchTrades,
  fetchProjectType,
  fetchPublicTrades,
  fetchAsiteFolders,
} from './extraReducers';

const initialState = {
  loading1: false,
  loading2: false,
  loading3: false,
  loading4: false,
  error: '',
  regions: [],
  trades: [],
  projectType: [],
  asiteFolders: [],
};

const attributesSlice = createSlice({
  name: 'attributes',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchRegions, fetchTrades, fetchProjectType, fetchPublicTrades, fetchAsiteFolders };

export default attributesSlice.reducer;
