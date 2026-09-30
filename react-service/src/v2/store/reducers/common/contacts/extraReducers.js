import { createAsyncThunk } from '@reduxjs/toolkit';

const mockPostContactsFailure = createAsyncThunk(
  'contacts/mockPostContactsFailure',
  async () => {
    throw new Error('Mocked error');
  },
);
const mockPostContactsSuccess = createAsyncThunk(
  'contacts/mockPostContactsSuccess',
  async () => {
    return { success: true };
  },
);

export default {
  [mockPostContactsFailure.pending]: (state) => {
    state.loading = true;
  },
  [mockPostContactsFailure.fulfilled]: (state) => {
    state.loading = false;
  },
  [mockPostContactsFailure.rejected]: (state) => {
    state.loading = false;
  },
  [mockPostContactsSuccess.pending]: (state) => {
    state.loading = true;
  },
  [mockPostContactsSuccess.fulfilled]: (state) => {
    state.loading = false;
  },
  [mockPostContactsSuccess.rejected]: (state) => {
    state.loading = false;
  },
};
export {
  mockPostContactsFailure,
  mockPostContactsSuccess,
};
