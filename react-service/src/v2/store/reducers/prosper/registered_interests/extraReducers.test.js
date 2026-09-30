import extraReducers, { fetchInterests } from './extraReducers';
import { fetchData } from 'services/helpers';
import { prosperViewProject } from 'v2/helpers/url';

jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
}));

jest.mock('v2/helpers/url', () => ({
  prosperViewProject: jest.fn((id) => `/mock-project-view/${id}`),
}));

describe('prosper registered_interests extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      status: '',
      latest: [],
    };
    fetchData.mockClear();
    prosperViewProject.mockClear();
  });

  // Test fetchInterests
  describe('fetchInterests', () => {
    it('should handle pending state correctly', () => {
      extraReducers[fetchInterests.pending](initialState);
      expect(initialState.status).toBe('loading');
    });

    it('should handle fulfilled state correctly with array payload', () => {
      const payload = [
        {
          id: 1,
          project: 'Project A',
          packages: [{ created_at: '2023-01-01' }, { created_at: '2023-01-02' }],
          registered_date: '2023-01-15',
        },
        {
          id: 2,
          project: 'Project B',
          packages: [],
          registered_date: '2023-01-16',
        },
      ];
      extraReducers[fetchInterests.fulfilled](initialState, { payload });
      expect(initialState.status).toBe('');
      expect(initialState.latest).toEqual([
        {
          id: 1,
          name: 'Project A',
          tenderTags: [{ created_at: '2023-01-01' }, { created_at: '2023-01-02' }],
          viewProject: '/mock-project-view/1',
          registeredDate: '2023-01-15',
        },
        {
          id: 2,
          name: 'Project B',
          tenderTags: [],
          viewProject: '/mock-project-view/2',
          registeredDate: '2023-01-16',
        },
      ]);
      expect(prosperViewProject).toHaveBeenCalledWith(1);
      expect(prosperViewProject).toHaveBeenCalledWith(2);
    });

    it('should handle fulfilled state correctly with non-array payload', () => {
      const payload = null;
      extraReducers[fetchInterests.fulfilled](initialState, { payload });
      expect(initialState.status).toBe('');
      expect(initialState.latest).toEqual([]);
    });

    it('should handle rejected state correctly', () => {
      extraReducers[fetchInterests.rejected](initialState);
      expect(initialState.status).toBe('error');
      expect(initialState.latest).toEqual([]);
    });

    it('should handle fulfilled state with empty array payload', () => {
      const payload = [];
      extraReducers[fetchInterests.fulfilled](initialState, { payload });
      expect(initialState.status).toBe('');
      expect(initialState.latest).toEqual([]);
    });

    it('should handle fulfilled state with undefined payload', () => {
      const payload = undefined;
      extraReducers[fetchInterests.fulfilled](initialState, { payload });
      expect(initialState.status).toBe('');
      expect(initialState.latest).toEqual([]);
    });
  });
});
