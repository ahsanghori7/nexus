import extraReducers, {
  fetchAdminInfo,
  fetchMainContractors,
} from './extraReducers';
import status from 'store/reducers/common/constants';

// Mock external dependencies
jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

const initialState = {
  id: 0,
  accountId: 0,
  userName: '',
  userEmail: '',
  userType: `super admin`,
  mainContractors: [],
  status: { severity: '', message: '', type: status.IDLE_STATUS }, // Added status to initial state for consistency
};

describe('info extraReducers', () => {
  let state;

  beforeEach(() => {
    state = { ...initialState };
  });

  // Tests for fetchAdminInfo
  describe('fetchAdminInfo', () => {
    it('should handle fetchAdminInfo.pending correctly', () => {
      extraReducers[fetchAdminInfo.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading fetchAdminInfo',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle fetchAdminInfo.fulfilled correctly with payload', () => {
      const payload = {
        id: 123,
        account_id: 456,
        display_name: 'Admin User',
        email: 'admin@example.com',
      };
      extraReducers[fetchAdminInfo.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
      expect(state.id).toBe(123);
      expect(state.accountId).toBe(456);
      expect(state.userName).toBe('Admin User');
      expect(state.userEmail).toBe('admin@example.com');
      expect(state.userType).toBe('super admin');
    });

    it('should handle fetchAdminInfo.rejected correctly', () => {
      extraReducers[fetchAdminInfo.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE',
        type: status.FAILURE_STATUS,
      });
    });
  });

  // Tests for fetchMainContractors
  describe('fetchMainContractors', () => {
    it('should handle fetchMainContractors.pending correctly', () => {
      state.mainContractors = [{ id: 1, name: 'Existing Contractor' }]; // Simulate existing data
      extraReducers[fetchMainContractors.pending](state);
      expect(state.mainContractors).toEqual([]);
    });

    it('should handle fetchMainContractors.fulfilled correctly with payload', () => {
      const payload = [
        {
          id: 1,
          name: 'Contractor A',
          subscription_id: 1,
          created_at: '2023-01-01',
        },
        {
          id: 2,
          name: 'Contractor B',
          subscription_id: 2,
          created_at: '2023-01-02',
        },
      ];
      extraReducers[fetchMainContractors.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
      expect(state.mainContractors).toEqual([
        {
          id: 1,
          name: 'Contractor A',
          subscription_id: 1,
          created_at: '2023-01-01',
          user: 'Contractor A',
          subscription: 1,
          frequency: '',
          'registration-date': '2023-01-01',
          'last-login': '',
        },
        {
          id: 2,
          name: 'Contractor B',
          subscription_id: 2,
          created_at: '2023-01-02',
          user: 'Contractor B',
          subscription: 2,
          frequency: '',
          'registration-date': '2023-01-02',
          'last-login': '',
        },
      ]);
    });

    it('should handle fetchMainContractors.fulfilled correctly with empty payload', () => {
      const payload = [];
      extraReducers[fetchMainContractors.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
      expect(state.mainContractors).toEqual([]);
    });

    it('should handle fetchMainContractors.rejected correctly', () => {
      extraReducers[fetchMainContractors.rejected](state);
      expect(state.mainContractors).toEqual([]);
    });
  });
});
