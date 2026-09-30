import { createAsyncThunk } from '@reduxjs/toolkit';
import isArray from 'lodash/isArray';
import sortBy from 'lodash/sortBy';
import { prosperViewProject } from 'v2/helpers/url';
import { fetchData } from 'services/helpers';

const fetchInterests = createAsyncThunk(
  'interests/fetchInterests',
  async ({ resource = 'interests', method = 'latest' }) =>
    fetchData(resource, false, method).then((result) => result.data)
);

export default {
  [fetchInterests.pending]: (state) => {
    state.status = 'loading';
  },
  [fetchInterests.fulfilled]: (state, { payload }) => {
    state.status = '';
    state.latest =
      payload && isArray(payload)
        ? payload.map((item) => ({
            id: item.id,
            name: item.project,
            tenderTags: item.packages.length
              ? sortBy(item.packages, ['created_at'])
              : [],
            viewProject: prosperViewProject(item.id),
            registeredDate: item.registered_date,
          }))
        : [];
  },
  [fetchInterests.rejected]: (state) => {
    state.status = 'error';
    state.latest = [];
  },
};
export { fetchInterests };
