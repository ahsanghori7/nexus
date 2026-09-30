import { createSlice } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
import extraReducers, {
  fetchHealthScore,
  updateHealthScore,
} from './extraReducers';

const initialState = {
  list: [],
  listCount: 0,
  status: { severity: '', message: '', type: status.IDLE_STATUS },
};

const customerHealthScoreSlice = createSlice({
  name: 'customer_health_score',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchHealthScore, updateHealthScore };
export default customerHealthScoreSlice.reducer;
