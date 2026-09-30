import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  documents: [],
  isLoading: false,
  message: null,
};

const downloadManagerSlice = createSlice({
  name: 'downloadManager',
  initialState,
  reducers: {}
});

export default downloadManagerSlice.reducer;
