import { createSlice } from '@reduxjs/toolkit';
import flag from 'v2/helpers/flags';
import extraReducers, {
  fetchEnquiries,
  changeStatus as patchStatus,
  createQuote,
  tenderIsDownloaded,
  fetchDocumentsHistory,
} from './extraReducers';

const initialState = {
  latest: [],
  current: [],
  total: [],
  types: [],
  documents: [],
  status: 'Loading',
};

const ITEMS_LENGTH = flag('PROSPER_ENQUIRIES_MUI_PAGINATION') || 6;
const projectsSlice = createSlice({
  name: 'enquiries',
  initialState,
  reducers: {
    changeStatus(state, action) {
      state.status = action.payload;
    },
    nextBatch(state) {
      state.current = [...state.current, ...state.total.slice(0, ITEMS_LENGTH)];
      state.total = state.total.slice(ITEMS_LENGTH);
    },
  },
  extraReducers,
});

export const { changeStatus, nextBatch } = projectsSlice.actions;
export {
  fetchEnquiries,
  patchStatus,
  createQuote,
  tenderIsDownloaded,
  fetchDocumentsHistory,
};
export default projectsSlice.reducer;
