import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  type: 'string',
  title: 'TITLE',
  lock: false,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setTitle(state, action) {
      state.title = action.payload;
    },
    setType(state, action) {
      state.type = action.payload;
    },
    setLock(state, action) {
      state.lock = action.payload;
    },
  },
  extraReducers: {},
});

export const { setTitle, setType, setLock } = configSlice.actions;
export default configSlice.reducer;
