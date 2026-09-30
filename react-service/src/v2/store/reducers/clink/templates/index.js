import { createSlice } from '@reduxjs/toolkit';
import extraReducers, { fetchTemplates } from './extraReducers';

const initialState = {
  list: [],
};

const templateSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchTemplates };
export default templateSlice.reducer;
