import { produce } from 'immer';
import extraReducers from './extraReducers';
import { addDocument, removeDocument } from './asyncThunk'; // Import the actual async thunks

describe('instructions/documents extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
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
  });

  // Test addDocument.pending
  it('should handle addDocument.pending correctly', () => {
    const mockDocument = { name: 'test-doc.pdf' };
    const action = {
      type: addDocument.pending.type,
      meta: { arg: { data: [mockDocument] } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[addDocument.pending.type](draft, action);
    });

    expect(state.uploadingDocumentsState.uploading).toBe(true);
    expect(state.uploadingDocumentsState.current).toBe(mockDocument.name);
    expect(state.uploadingDocumentsState.uploaded).toBe(0);
    expect(state.uploadingDocumentsState.errors).toEqual([]);
  });

  // Test addDocument.fulfilled - success case
  it('should handle addDocument.fulfilled with success', () => {
    const newDocuments = [{ id: 1, name: 'doc1.pdf' }, { id: 2, name: 'doc2.pdf' }];
    const action = {
      type: addDocument.fulfilled.type,
      payload: { success: newDocuments, error: 0 },
    };

    // Initialize state as if pending was already handled
    initialState.uploadingDocumentsState.uploading = true;
    initialState.uploadingDocumentsState.currentDocs = 5; // Simulate some pending docs
    const state = produce(initialState, (draft) => {
      extraReducers[addDocument.fulfilled.type](draft, action);
    });

    expect(state.documents).toEqual(expect.arrayContaining(newDocuments));
    expect(state.uploadingDocumentsState.currentDocs).toBe(5 - newDocuments.length);
    expect(state.uploadingDocumentsState.uploaded).toBe(newDocuments.length);
    expect(state.uploadingDocumentsState.errors).toEqual([]);
    expect(state.uploadingDocumentsState.uploading).toBe(true); // Should still be uploading if currentDocs > DOCS_PER_REQUEST
  });

  // Test addDocument.fulfilled - success case with completion
  it('should handle addDocument.fulfilled with success and complete upload', () => {
    const newDocuments = [{ id: 1, name: 'doc1.pdf' }];
    const action = {
      type: addDocument.fulfilled.type,
      payload: { success: newDocuments, error: 0 },
    };

    // Initialize state as if pending was already handled
    initialState.uploadingDocumentsState.uploading = true;
    initialState.uploadingDocumentsState.currentDocs = 1; // Simulate 1 pending doc, DOCS_PER_REQUEST is 2
    const state = produce(initialState, (draft) => {
      extraReducers[addDocument.fulfilled.type](draft, action);
    });

    expect(state.documents).toEqual(expect.arrayContaining(newDocuments));
    expect(state.uploadingDocumentsState.currentDocs).toBe(0);
    expect(state.uploadingDocumentsState.uploaded).toBe(0); // Reset to 0 on completion
    expect(state.uploadingDocumentsState.errors).toEqual([]);
    expect(state.uploadingDocumentsState.uploading).toBe(false); // Should be false as upload is complete
  });

  // Test addDocument.fulfilled - error case
  it('should handle addDocument.fulfilled with error', () => {
    const newDocuments = [{ id: 1, name: 'doc1.pdf' }];
    const action = {
      type: addDocument.fulfilled.type,
      payload: { success: newDocuments, error: 1 }, // Simulate an error
    };

    // Initialize state as if pending was already handled
    initialState.uploadingDocumentsState.uploading = true;
    initialState.uploadingDocumentsState.currentDocs = 5;
    const state = produce(initialState, (draft) => {
      extraReducers[addDocument.fulfilled.type](draft, action);
    });

    expect(state.documents).toEqual(expect.arrayContaining(newDocuments));
    expect(state.uploadingDocumentsState.currentDocs).toBe(5 - (newDocuments.length + 1));
    expect(state.uploadingDocumentsState.uploaded).toBe(newDocuments.length + 1);
    expect(state.uploadingDocumentsState.errors).toEqual([{ invalid: 'Fail uploading' }]);
  });

  // Test addDocument.rejected
  it('should handle addDocument.rejected correctly', () => {
    const action = { type: addDocument.rejected.type };
    // Initialize state as if pending was already handled
    initialState.uploadingDocumentsState.uploading = true;
    initialState.uploadingDocumentsState.currentDocs = 5;

    const state = produce(initialState, (draft) => {
      extraReducers[addDocument.rejected.type](draft, action);
    });

    expect(state.uploadingDocumentsState.uploading).toBe(false);
    expect(state.uploadingDocumentsState.currentDocs).toBe(0);
  });

  // Test removeDocument.fulfilled - success case
  it('should handle removeDocument.fulfilled with success', () => {
    initialState.documents = [
      { id: 1, name: 'doc1.pdf' },
      { id: 2, name: 'doc2.pdf' },
    ];
    const action = {
      type: removeDocument.fulfilled.type,
      payload: { success: true },
      meta: { arg: 1 }, // Document ID to remove
    };
    const state = produce(initialState, (draft) => {
      extraReducers[removeDocument.fulfilled.type](draft, action);
    });

    expect(state.documents).toEqual([{ id: 2, name: 'doc2.pdf' }]);
  });

  // Test removeDocument.fulfilled - no success
  it('should handle removeDocument.fulfilled without success', () => {
    initialState.documents = [
      { id: 1, name: 'doc1.pdf' },
      { id: 2, name: 'doc2.pdf' },
    ];
    const action = {
      type: removeDocument.fulfilled.type,
      payload: { success: false },
      meta: { arg: 1 }, // Document ID to remove
    };
    const state = produce(initialState, (draft) => {
      extraReducers[removeDocument.fulfilled.type](draft, action);
    });

    expect(state.documents).toEqual([
      { id: 1, name: 'doc1.pdf' },
      { id: 2, name: 'doc2.pdf' },
    ]); // Documents should remain unchanged
  });

  // Test removeDocument.pending (no state change expected)
  it('should handle removeDocument.pending without state change', () => {
    const action = { type: removeDocument.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[removeDocument.pending.type](draft, action);
    });
    expect(state).toEqual(initialState); // No change expected for pending
  });

  // Test removeDocument.rejected (no state change expected)
  it('should handle removeDocument.rejected without state change', () => {
    const action = { type: removeDocument.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[removeDocument.rejected.type](draft, action);
    });
    expect(state).toEqual(initialState); // No change expected for rejected
  });
});
