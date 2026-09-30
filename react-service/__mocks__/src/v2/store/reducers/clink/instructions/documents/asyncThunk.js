import { createAsyncThunk } from '@reduxjs/toolkit';

export const addDocument = createAsyncThunk(
  'instructions-documents/addDocument',
  async (arg, { rejectWithValue }) => {
    // This is a mock implementation for testing rejected case
    return Promise.reject(new Error('Upload failed'));
  }
);

export const removeDocument = createAsyncThunk(
  'instructions-documents/removeDocument',
  async (arg, { rejectWithValue }) => {
    // Provide a basic mock implementation for removeDocument if needed by other tests
    return Promise.resolve({});
  }
);
