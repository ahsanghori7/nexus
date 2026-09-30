import extraReducers, { fetchAdminSupplyChain } from './extraReducers';
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

describe('supplyChain extraReducers', () => {
  let state;

  beforeEach(() => {
    state = { ...initialState };
  });

  // Tests for fetchAdminSupplyChain
  describe('fetchAdminSupplyChain', () => {
    it('should handle fetchAdminSupplyChain.pending correctly', () => {
      extraReducers[fetchAdminSupplyChain.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading supply chain',
        type: status.LOADING_STATUS,
      });
      expect(state.list).toEqual([]);
    });

    it('should handle fetchAdminSupplyChain.fulfilled correctly with payload', () => {
      const payload = [{ name: 'Supplier A' }, { name: 'Supplier B' }];
      extraReducers[fetchAdminSupplyChain.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.list).toEqual([
        { id: 1, name: 'Supplier A' },
        { id: 2, name: 'Supplier B' },
      ]);
    });

    it('should handle fetchAdminSupplyChain.fulfilled correctly with empty payload', () => {
      const payload = [];
      extraReducers[fetchAdminSupplyChain.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.list).toEqual([]);
    });

    it('should handle fetchAdminSupplyChain.fulfilled correctly with null payload', () => {
      const payload = null;
      extraReducers[fetchAdminSupplyChain.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.list).toEqual([]);
    });

    it('should handle fetchAdminSupplyChain.rejected correctly', () => {
      extraReducers[fetchAdminSupplyChain.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'Error loading supply chain',
        type: status.FAILURE_STATUS,
      });
      expect(state.list).toEqual([]);
    });
  });
});
