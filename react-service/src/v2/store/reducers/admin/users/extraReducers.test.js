import extraReducers, { fetchUsers, createAccount } from './extraReducers';
import status from 'store/reducers/common/constants';

// Mock external dependencies
jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
  postData: jest.fn(),
}));

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    if (key === 'users-table-column-activated-supply-chain') {
      return 'Activated Supply Chain';
    }
    return key;
  }),
}));

jest.mock('v2/helpers/data', () => ({
  renderTextWithoutHtml: jest.fn((text) => text),
}));

const initialState = {
  list: [],
  listCount: 0,
  status: { severity: '', message: '', type: status.IDLE_STATUS },
};

describe('users extraReducers', () => {
  let state;

  beforeEach(() => {
    state = { ...initialState };
  });

  // Tests for fetchUsers
  describe('fetchUsers', () => {
    it('should handle fetchUsers.pending correctly', () => {
      extraReducers[fetchUsers.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading users',
        type: status.LOADING_STATUS,
      });
      expect(state.list).toEqual([]);
    });

    it('should handle fetchUsers.fulfilled correctly with payload', () => {
      const payload = {
        data: [
          {
            id: 1,
            name: 'User One',
            company: 'Company A',
            frequency: 'monthly',
            subscription_id: 16,
            created_at: '2023-01-01',
          },
          {
            id: 2,
            name: 'User Two',
            company: 'Company B',
            frequency: 'yearly',
            subscription_id: 10,
            created_at: '2023-01-02',
          },
        ],
        info: { count: 2 },
        offset: 0,
      };
      extraReducers[fetchUsers.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.list).toEqual([
        {
          id: 1,
          name: 'User One',
          company: 'Company A',
          frequency: 'Monthly',
          subscription_id: 16,
          created_at: '2023-01-01',
          'activated-supply-chain': 'Activated Supply Chain',
          user: 'User One',
          'registration-date': '2023-01-01',
          'last-login': '',
        },
        {
          id: 2,
          name: 'User Two',
          company: 'Company B',
          frequency: 'Yearly',
          subscription_id: 10,
          created_at: '2023-01-02',
          'activated-supply-chain': 'Not activated supply chain',
          user: 'User Two',
          'registration-date': '2023-01-02',
          'last-login': '',
        },
      ]);
      expect(state.listCount).toBe(2);
    });

    it('should handle fetchUsers.fulfilled correctly with empty payload data', () => {
      const payload = {
        data: [],
        info: { count: 0 },
        offset: 0,
      };
      extraReducers[fetchUsers.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.list).toEqual([]);
      expect(state.listCount).toBe(0);
    });

    it('should handle fetchUsers.fulfilled correctly with offset', () => {
      const payload = {
        data: [
          {
            id: 1,
            name: 'User One',
            company: 'Company A',
            frequency: 'monthly',
            subscription_id: 16,
            created_at: '2023-01-01',
          },
        ],
        info: { count: 10 },
        offset: 5,
      };
      extraReducers[fetchUsers.fulfilled](state, { payload });
      expect(state.list.length).toBe(6); // 5 mock users + 1 actual user
      expect(state.list[0].id).toBe('mock-id-0');
      expect(state.list[5].id).toBe(1);
      expect(state.listCount).toBe(10);
    });

    it('should handle fetchUsers.rejected correctly', () => {
      extraReducers[fetchUsers.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'Error loading users',
        type: status.FAILURE_STATUS,
      });
      expect(state.list).toEqual([]);
      expect(state.listCount).toBe(0);
    });
  });

  // Tests for createAccount
  describe('createAccount', () => {
    it('should handle createAccount.pending correctly', () => {
      extraReducers[createAccount.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading createAccount',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle createAccount.fulfilled correctly', () => {
      extraReducers[createAccount.fulfilled](state);
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle createAccount.rejected correctly', () => {
      extraReducers[createAccount.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE',
        type: status.FAILURE_STATUS,
      });
    });
  });
});
