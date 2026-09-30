import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
  fetchAdminInfo,
  fetchMainContractors,
} from './extraReducers';

const initialState = {
  id: 0,
  accountId: 0,
  userName: '',
  userEmail: '',
  userType: `super admin`,
  mainContractors: [],
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchAdminInfo, fetchMainContractors };
export default adminSlice.reducer;
