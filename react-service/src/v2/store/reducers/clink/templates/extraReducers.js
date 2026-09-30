import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchData } from 'v2/services/clinkHelpers';

const fetchTemplates = createAsyncThunk(
  'template/fetchAll',
  async (params = { type: 'orders' }) =>
    fetchData('template', 'fetchAll', params),
);

export default {
  [fetchTemplates.pending]: () => {},
  [fetchTemplates.fulfilled]: (state, { payload }) => {
    state.list =
      payload && Array.isArray(payload)
        ? payload.sort((templateA, templateB) =>
            templateA.name
              .toLowerCase()
              .localeCompare(templateB.name.toLowerCase()),
          )
        : [];
  },
  [fetchTemplates.rejected]: () => {},
};

export { fetchTemplates };
