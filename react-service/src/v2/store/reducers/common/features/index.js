import { createSlice } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
import extraReducers, {
  fetchFeatures,
  fetchAccountFeatures,
  updateAccountFeatures,
  fetchAccountEnvelopes,
  updateAccountEnvelopes,
} from './extraReducers';

const initialState = {
  list: [],
  featureList: [],
  envelopes: {},
  status: { severity: '', message: '', type: status.IDLE_STATUS },
};

const featuresSlice = createSlice({
  name: 'features',
  initialState,
  reducers: {},
  extraReducers,
});

export {
  fetchFeatures,
  fetchAccountFeatures,
  updateAccountFeatures,
  fetchAccountEnvelopes,
  updateAccountEnvelopes,
};
export default featuresSlice.reducer;
