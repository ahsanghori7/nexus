import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
  fetchSubscriptions,
  changeSubscription,
} from './extraReducers';

const initialState = {
  subscriptionsList: [],
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchSubscriptions, changeSubscription };
export default usersSlice.reducer;
