import { createSlice } from '@reduxjs/toolkit';
import extraReducers from './extraReducers';

const initialState = {
  quotesData: {},
  quoteFiles: {},
  quoteDocuments: {},
  loading: false,
  loadingQuotes: false,
  error: false,
};

const quotesTenderSlice = createSlice({
  name: 'quotesTender',
  initialState,
  reducers: {
    resetQuotesTender(state) {
      state.quotesData = {};
      state.quoteFiles = {};
      state.quoteDocuments = {};
      state.loading = false;
      state.loadingQuotes = false;
      state.error = false;
    },
  },
  extraReducers,
});

export const { resetQuotesTender } = quotesTenderSlice.actions;
export {
  fetchQuoteFiles,
  fetchQuoteDocuments,
  fetchQuotes,
  postQuote,
  editQuote,
  toggleCompliant,
  deleteQuote,
  award,
  withdrawAward,
  toggledSelected,
  updateProjectTender,
} from './extraReducers';
export default quotesTenderSlice.reducer;
