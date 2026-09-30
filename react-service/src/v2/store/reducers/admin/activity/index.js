import { createSlice } from '@reduxjs/toolkit';
import extraReducers, { fetchActivities } from './extraReducers';

const initialState = {
  list: [],
  status: '',
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchActivities };
export default activitySlice.reducer;
