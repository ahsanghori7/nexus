import { createSlice } from '@reduxjs/toolkit';
import extraReducers, { fetchInterests } from './extraReducers';

const initialState = {
  latest: [],
  status: '',
};

const interestsSlice = createSlice({
  name: 'interests',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchInterests };
export default interestsSlice.reducer;
