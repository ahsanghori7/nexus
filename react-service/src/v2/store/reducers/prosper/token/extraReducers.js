import { createAsyncThunk } from '@reduxjs/toolkit';
import httpRequest from 'services/httpHelper';
import Relay from 'v2/services/relay';

const checkToken = createAsyncThunk('token/checkToken', async (token) => {
  const service = new Relay('user');
  return service
    .patch({ promo_token: token }, 'check_promo_token')
    .then((response) => response.text());
});

const verifyToken = createAsyncThunk('token/verifyToken', async (token) => {
  try {
    return await httpRequest({ url: `token/verify/${token}` });
  } catch (error) {
    return error;
  }
});

export default {
  [checkToken.pending]: (state) => {
    state.loading = true;
  },
  [checkToken.fulfilled]: (state, { payload }) => {
    const response = payload ? JSON.parse(payload) : { success: false };
    if (response && response.success) {
      const { token_award } = response;
      state.tokenAward = token_award;
      state.success = true;
    }
    state.success = response && response.success;
    state.loading = false;
  },
  [checkToken.rejected]: (state) => {
    state.loading = false;
    state.success = false;
  },
  [verifyToken.pending]: (state) => {
    state.loading = true;
  },
  [verifyToken.fulfilled]: (state, { payload }) => {
    if (payload && payload.data) {
      state.data = payload.data;
    }
    state.success = payload && payload.data;
    state.loading = false;
  },
  [verifyToken.rejected]: (state) => {
    state.loading = false;
    state.success = false;
  },
};

export { checkToken, verifyToken };
