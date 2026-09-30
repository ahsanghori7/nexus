import { createSlice } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
import extraReducers, { fetchUsers, createAccount } from './extraReducers';

const initialState = {
  list: [],
  listCount: 0,
  status: { severity: '', message: '', type: status.IDLE_STATUS },
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    updateUsers(state, action) {
      state.list = action.payload;
    },
  },
  extraReducers,
});

export const { updateUsers } = usersSlice.actions;
export { fetchUsers, createAccount };
export default usersSlice.reducer;
