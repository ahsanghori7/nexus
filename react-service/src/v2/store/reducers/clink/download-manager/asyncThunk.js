import { createAsyncThunk } from '@reduxjs/toolkit';
import { httpHelperV2 } from 'v2/services/httpHelper';

const getDocumentSnapshot = createAsyncThunk(
  'download_manager/getDocumentSnapshot',
  async ({ document_id,token }) => {
    const response = await httpHelperV2({
      url: `document/${document_id}/snapshot`,
      method: 'GET',
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
    });
    return response?.data;
  },
);

const downloadAllDocuments = createAsyncThunk(
  'download_manager/downloadAllDocuments',
  async ({ document_id }, thunkAPI) => {
    try {
      const response = await httpHelperV2({
        url: `document/${document_id}/snapshot/download-all`,
        method: 'GET',
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message,
        status: error.status,
        response: error.response,
      });
    }
  },
);

const downloadSingleDocument = createAsyncThunk(
  'download_manager/downloadSingleDocument',
  async ({ document_id }, thunkAPI) => {
    try {
      const response = await httpHelperV2({
        url: `document/download/${document_id}`,
        method: 'GET',
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message,
        status: error.status,
        response: error.response,
      });
    }
  },
);

const getTrDocuments = createAsyncThunk(
  'download_manager/getTrDocuments',
  async ({ project_id, tr_id, token }, thunkAPI) => {
    try {
      const response = await httpHelperV2({
        url: `project/${project_id}/tender_recommendation_attachment/download_manager/${tr_id}`,
        method: 'GET',
      });
      return response?.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message,
        status: error.status,
        response: error.response,
      });
    }
  },
);

export {
  getDocumentSnapshot,
  downloadAllDocuments,
  downloadSingleDocument,
  getTrDocuments,
};
