import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchData } from 'services/helpers';
import status from 'store/reducers/common/constants';

const fetchEngagement = createAsyncThunk(
  'engagement/fetchEngagement',
  async ({ aid, typeData }) =>
    fetchData(`${typeData}/engagement/${aid}`).then((r) => r.data)
);
export default {
  [fetchEngagement.pending]: (state) => {
    state.status = {
      severity: 'info',
      message: 'Loading engagement',
      type: status.LOADING_STATUS,
    };
    state.list = [];
  },
  [fetchEngagement.fulfilled]: (state, { payload, meta }) => {
    state.status = {
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    };
    const { arg } = meta;
    const { typeData } = arg;
    let list = [];
    if (payload && typeData === 'user') {
      list = [payload];
    } else if (payload && typeData === 'account') {
      const { enquiries, quotes } = payload;
      const { total: nEnquiries, data: listEnquiries } = enquiries;
      const { total: nQuotes, data: listQuotes } = quotes;

      state.totalEnquiries = nEnquiries;
      state.totalQuotes = nQuotes;

      list = [
        ...listEnquiries.map((i, pos) => ({
          ...i,
          id: `${pos}1`,
          type: 'Enquiry',
        })),
        ...listQuotes.map((i, pos) => ({
          ...i,
          id: `${pos}2`,
          type: 'Order',
        })),
      ];
    }

    state.list = list;
  },
  [fetchEngagement.rejected]: (state) => {
    state.status = {
      severity: 'error',
      message: 'Error loading engagement',
      type: status.FAILURE_STATUS,
    };
    state.list = [];
  },
};
export { fetchEngagement };
