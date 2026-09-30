import isArray from 'lodash/isArray';
import { addDocument, removeDocument } from './asyncThunk';

export default {
  [addDocument.pending]: (state, { meta }) => {
    const { arg } = meta;
    const { data } = arg;
    const prevStatus = { ...state.uploadingDocumentsState };
    const [first] = data;
    state.uploadingDocumentsState.uploading = true;
    state.uploadingDocumentsState.uploaded = prevStatus.uploaded;
    state.uploadingDocumentsState.errors = prevStatus.errors;
    state.uploadingDocumentsState.current = first.name;
  },
  [addDocument.fulfilled]: (state, { payload }) => {
    const { success, error } = payload;
    const { DOCS_PER_REQUEST } = state.uploadingDocumentsState; // Only destructure DOCS_PER_REQUEST
    if (success && isArray(success)) {
      const documents = [...state.documents, ...success];
      const substraction = success.length + error;
      state.documents = documents;
      state.uploadingDocumentsState.currentDocs -= substraction;
      state.uploadingDocumentsState.uploaded += substraction;
      state.uploadingDocumentsState.errors = error
        ? [
            ...state.uploadingDocumentsState.errors,
            { invalid: 'Fail uploading' },
          ]
        : state.uploadingDocumentsState.errors;
    }
    // Use the updated state.uploadingDocumentsState.currentDocs
    if (state.uploadingDocumentsState.currentDocs <= DOCS_PER_REQUEST) {
      state.uploadingDocumentsState.uploading = false;
      state.uploadingDocumentsState.uploaded = 0;
    }
  },
  [addDocument.rejected]: (state) => {
    state.uploadingDocumentsState.uploading = false;
    state.uploadingDocumentsState.currentDocs = 0;
  },
  [removeDocument.pending]: () => {},
  [removeDocument.fulfilled]: (state, { payload, meta }) => {
    const { arg: did } = meta;
    const { success } = payload;
    if (success) {
      state.documents = state.documents.filter(
        (d) => Number(d.id) !== Number(did)
      );
    }
  },
  [removeDocument.rejected]: () => {},
};
export { addDocument, removeDocument };
