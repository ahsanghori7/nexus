import extraReducers, {
  fetchProjects,
  fetchStatusList,
  changeStatus,
} from './extraReducers';
import status from 'store/reducers/common/constants';

// Mock external dependencies
jest.mock('v2/services/relay', () => {
  const mockGet = jest.fn();
  const mockPatch = jest.fn();
  return jest.fn(() => ({
    get: mockGet,
    patch: mockPatch,
  }));
});

jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
}));

const initialState = {
  list: [],
  status: { severity: '', message: '', type: status.IDLE_STATUS },
  statusList: [],
};

describe('projects extraReducers', () => {
  let state;

  beforeEach(() => {
    state = { ...initialState };
  });

  // Tests for fetchProjects
  describe('fetchProjects', () => {
    it('should handle fetchProjects.pending correctly', () => {
      extraReducers[fetchProjects.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading ',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle fetchProjects.fulfilled correctly with payload', () => {
      const payload = [
        {
          id: 1,
          name: 'Project A',
          region: 'Region A',
          author_name: 'Author A',
          created_at: '2023-01-01',
        },
        {
          id: 2,
          name: 'Project B',
          region: 'Region B',
          author_name: '',
          created_at: '2023-01-02',
        },
      ];
      extraReducers[fetchProjects.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
      expect(state.list).toEqual([
        {
          id: 1,
          name: 'Project A',
          project: 'Project A',
          location: 'Region A',
          'unit-no': 'n/a',
          'created-by': 'Author A',
          'approx-cost': 'n/a',
          'published-date': '2023-01-01',
          region: 'Region A',
          author_name: 'Author A',
          created_at: '2023-01-01',
        },
        {
          id: 2,
          name: 'Project B',
          project: 'Project B',
          location: 'Region B',
          'unit-no': 'n/a',
          'created-by': 'No User Data',
          'approx-cost': 'n/a',
          'published-date': '2023-01-02',
          region: 'Region B',
          author_name: '',
          created_at: '2023-01-02',
        },
      ]);
    });

    it('should handle fetchProjects.fulfilled correctly with empty payload', () => {
      const payload = [];
      extraReducers[fetchProjects.fulfilled](state, { payload });
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
      expect(state.list).toEqual([]);
    });

    it('should handle fetchProjects.rejected correctly', () => {
      extraReducers[fetchProjects.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE',
        type: status.FAILURE_STATUS,
      });
      expect(state.list).toEqual([]);
    });
  });

  // Tests for fetchStatusList
  describe('fetchStatusList', () => {
    it('should handle fetchStatusList.pending correctly (no state change)', () => {
      const originalState = { ...state };
      extraReducers[fetchStatusList.pending](state);
      expect(state).toEqual(originalState); // No change expected
    });

    it('should handle fetchStatusList.fulfilled correctly with payload', () => {
      const payload = ['open', 'closed', 'pending'];
      extraReducers[fetchStatusList.fulfilled](state, { payload });
      expect(state.statusList).toEqual([
        { id: 0, label: 'Open' },
        { id: 1, label: 'Closed' },
        { id: 2, label: 'Pending' },
      ]);
    });

    it('should handle fetchStatusList.fulfilled correctly with empty payload', () => {
      const payload = [];
      extraReducers[fetchStatusList.fulfilled](state, { payload });
      expect(state.statusList).toEqual([]);
    });

    it('should handle fetchStatusList.rejected correctly', () => {
      extraReducers[fetchStatusList.rejected](state);
      expect(state.statusList).toEqual([]);
    });
  });

  // Tests for changeStatus
  describe('changeStatus', () => {
    it('should handle changeStatus.pending correctly', () => {
      extraReducers[changeStatus.pending](state);
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Updating status',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle changeStatus.fulfilled correctly', () => {
      state.list = [
        { id: 1, status: 'open' },
        { id: 2, status: 'pending' },
      ];
      const meta = {
        arg: {
          project: { id: 1 },
          status: { id: 2, label: 'Closed' },
        },
      };
      extraReducers[changeStatus.fulfilled](state, { meta });
      expect(state.list).toEqual([
        { id: 1, status: 'closed' },
        { id: 2, status: 'pending' },
      ]);
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle changeStatus.fulfilled correctly when project not found', () => {
      state.list = [
        { id: 1, status: 'open' },
        { id: 2, status: 'pending' },
      ];
      const meta = {
        arg: {
          project: { id: 3 }, // Non-existent project
          status: { id: 2, label: 'Closed' },
        },
      };
      extraReducers[changeStatus.fulfilled](state, { meta });
      expect(state.list).toEqual([
        { id: 1, status: 'open' },
        { id: 2, status: 'pending' },
      ]);
      expect(state.status).toEqual({
        severity: false,
        message: 'IDLE ',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle changeStatus.rejected correctly', () => {
      extraReducers[changeStatus.rejected](state);
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE Updating status',
        type: status.FAILURE_STATUS,
      });
    });
  });
});
