import { createAsyncThunk } from '@reduxjs/toolkit';
import { postFormData, deleteData } from 'services/clinkHelpers';

const addDocument = createAsyncThunk(
  'project/addDocument',
  async ({ id, data }) => {
    return postFormData(
      'project_management',
      'addInstructionDocuments',
      { document: data },
      { id }
    )
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status);
  }
);

const removeDocument = createAsyncThunk(
  'project/removeDocument',
  async (did) => {
    return deleteData('document', 'remove', { did })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status);
  }
);

export { addDocument, removeDocument };
