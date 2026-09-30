import { createSlice } from '@reduxjs/toolkit';
import extraReducers, { fetchConstants } from './extraReducers';

// TODO: Remove this file when attibutes are fully migrated to the new system
const initialState = {
  project: {},
  pricing_document: {},
  tender: {},
  default_categories: {},
  regions: [],
};

const constantsSlice = createSlice({
  name: 'constants',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchConstants };
export default constantsSlice.reducer;
