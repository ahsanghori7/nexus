import { createSlice } from '@reduxjs/toolkit';
import extraReducers, { addDocument, removeDocument } from './extraReducers';

const initialState = {
  uploadingDocumentsState: {
    uploading: false,
    uploaded: 0,
    total: 0,
    errors: [],
    current: null,
    currentDocs: 0,
    DOCS_PER_REQUEST: 2,
  },
  documents: [],
  firstLoaded: true,
};

const instructionDocumentsSlice = createSlice({
  name: 'instructions-documents',
  initialState,
  reducers: {
    changeUploadingDocumentsState(state, action) {
      const { key, value, method } = action.payload;
      if (method === 'add') {
        state.uploadingDocumentsState[key] += value;
      } else if (method === 'substract') {
        state.uploadingDocumentsState[key] -= value;
      } else {
        state.uploadingDocumentsState[key] = value;
      }
    },
    initialDocumentUpdate(state, action) {
      state.documents = action.payload;
      state.firstLoaded = false;
    },
  },
  extraReducers,
});

export const { changeUploadingDocumentsState, initialDocumentUpdate } =
  instructionDocumentsSlice.actions;
export { addDocument, removeDocument };
export default instructionDocumentsSlice.reducer;
