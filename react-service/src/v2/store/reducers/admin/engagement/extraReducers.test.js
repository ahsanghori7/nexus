import extraReducers, { fetchEngagement } from './extraReducers';
import status from 'store/reducers/common/constants';

// Mock external dependencies
jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
}));

const initialState = {
  list: [],
  status: { severity: '', message: '', type: status.IDLE_STATUS },
  totalEnquiries: 0,
  totalQuotes: 0,
};

describe('engagement extraReducers', () => {
  let state;

  beforeEach(() => {
    state = { ...initialState };
  });

  // Tests for fetchEngagement
  describe('fetchEngagement', () => {
    it('should handle fetchEngagement.pending correctly', () => {
      extraReducers[fetchEngagement.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading engagement',
        type: status.LOADING_STATUS,
      });
      expect(state.list).toEqual([]);
    });

    it('should handle fetchEngagement.fulfilled correctly for type "user"', () => {
      const payload = { id: 1, name: 'User A' };
      const meta = { arg: { aid: 123, typeData: 'user' } };
      extraReducers[fetchEngagement.fulfilled](state, { payload, meta });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.list).toEqual([payload]);
    });

    it('should handle fetchEngagement.fulfilled correctly for type "account"', () => {
      const payload = {
        enquiries: { total: 1, data: [{ id: 101, title: 'Enquiry 1' }] },
        quotes: { total: 2, data: [{ id: 201, title: 'Quote 1' }, { id: 202, title: 'Quote 2' }] },
      };
      const meta = { arg: { aid: 456, typeData: 'account' } };
      extraReducers[fetchEngagement.fulfilled](state, { payload, meta });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.totalEnquiries).toBe(1);
      expect(state.totalQuotes).toBe(2);
      expect(state.list).toEqual([
        { id: '01', title: 'Enquiry 1', type: 'Enquiry' },
        { id: '02', title: 'Quote 1', type: 'Order' },
        { id: '12', title: 'Quote 2', type: 'Order' },
      ]);
    });

    it('should handle fetchEngagement.fulfilled correctly for type "account" with empty data', () => {
      const payload = {
        enquiries: { total: 0, data: [] },
        quotes: { total: 0, data: [] },
      };
      const meta = { arg: { aid: 456, typeData: 'account' } };
      extraReducers[fetchEngagement.fulfilled](state, { payload, meta });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.totalEnquiries).toBe(0);
      expect(state.totalQuotes).toBe(0);
      expect(state.list).toEqual([]);
    });

    it('should handle fetchEngagement.rejected correctly', () => {
      extraReducers[fetchEngagement.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'Error loading engagement',
        type: status.FAILURE_STATUS,
      });
      expect(state.list).toEqual([]);
    });
  });
});
