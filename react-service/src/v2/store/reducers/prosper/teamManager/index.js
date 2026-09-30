import { createSlice } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
import extraReducers, { activateTeamAccount } from './extraReducers';

const initialState = { severity: '', message: '', type: status.IDLE_STATUS };

const teamManagerSlice = createSlice({
  name: 'teamManager',
  initialState,
  reducers: {},
  extraReducers,
});

export { activateTeamAccount };
export default teamManagerSlice.reducer;
