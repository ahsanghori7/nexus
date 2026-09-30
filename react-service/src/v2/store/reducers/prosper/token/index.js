import { createSlice } from '@reduxjs/toolkit';
import extraReducers, { checkToken, verifyToken } from './extraReducers';

const initialState = {
  loading: false,
  success: true,
  tokenAward: 0,
  data: {},
};

const tokenSlice = createSlice({
  name: 'token',
  initialState,
  reducers: {},
  extraReducers,
});

export { checkToken, verifyToken };
export default tokenSlice.reducer;
