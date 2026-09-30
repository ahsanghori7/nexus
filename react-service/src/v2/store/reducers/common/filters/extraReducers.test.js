import extraReducers, { fetchFilterOptions } from './extraReducers';
import { fetchData } from 'services/helpers';

// Mock the fetchData function
jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
}));

describe('common filters extraReducers', () => {
  const dispatch = jest.fn();
  const getState = jest.fn();

  const initialState = {
    selected: {
      type: null,
      phase: null,
      trades: null,
      regions: null,
      enquiryStatus: null,
      dates: [],
      subscriptions: null,
    },
    list: {
      types: [],
      phase: [],
      selectStatus: [
        { id: 4, label: 'accept-invitation' },
        { id: 2, label: 'decline-invitation' },
      ],
      trades: [],
      regions: [],
      enquiriesStatus: [],
      dates: [],
      subscriptions: [],
    },
    loaded: 6,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchFilterOptions async thunk', () => {
    it('should create action with correct type prefix', () => {
      expect(fetchFilterOptions.typePrefix).toBe('company/fetchFilterOptions');
    });

    it('should call fetchData with correct parameters', async () => {
      const mockResponse = { 
        data: { 
          trades: [{ id: '1', label: 'Trade 1' }],
          regions: [{ id: '2', label: 'Region 1' }],
          types: [{ id: '3', label: 'Type 1' }]
        } 
      };
      fetchData.mockResolvedValue(mockResponse);

      const thunk = fetchFilterOptions({ id: 123 });
      const result = await thunk(dispatch, getState, undefined);

      expect(fetchData).toHaveBeenCalledWith(
        'company_profile',
        {},
        '123/filter_options'
      );
      expect(result.payload).toEqual(mockResponse.data);
    });

    it('should handle fetchFilterOptions error', async () => {
      const error = new Error('Network error');
      fetchData.mockRejectedValue(error);

      const thunk = fetchFilterOptions({ id: 123 });
      const result = await thunk(dispatch, getState, undefined);

      expect(result.type).toBe('company/fetchFilterOptions/rejected');
    });
  });

  describe('extraReducers handlers', () => {
    it('should handle fetchFilterOptions.pending without modifying state', () => {
      const state = { ...initialState };
      const action = { type: fetchFilterOptions.pending.type };

      // This should not modify state (empty function)
      const originalState = JSON.parse(JSON.stringify(state));
      extraReducers[fetchFilterOptions.pending](state, action);
      
      expect(state).toEqual(originalState);
    });

    it('should handle fetchFilterOptions.fulfilled with complete payload', () => {
      const state = { ...initialState };
      const payload = {
        trades: [{ id: '1', label: 'Trade 1' }, { id: '2', label: 'Trade 2' }],
        regions: [{ id: '3', label: 'Region 1' }],
        types: [{ id: '4', label: 'Type 1' }],
      };
      const action = { type: fetchFilterOptions.fulfilled.type, payload };

      extraReducers[fetchFilterOptions.fulfilled](state, action);

      expect(state.list.trades).toEqual([
        { id: 1, label: 'Trade 1' },
        { id: 2, label: 'Trade 2' },
      ]);
      expect(state.list.regions).toEqual([
        { id: 3, label: 'Region 1' },
      ]);
      expect(state.list.types).toEqual([
        { id: 4, label: 'Type 1' },
      ]);
    });

    it('should handle fetchFilterOptions.fulfilled with partial payload', () => {
      const state = { ...initialState };
      const payload = {
        trades: [{ id: '1', label: 'Trade 1' }],
        // Missing regions and types
      };
      const action = { type: fetchFilterOptions.fulfilled.type, payload };

      extraReducers[fetchFilterOptions.fulfilled](state, action);

      expect(state.list.trades).toEqual([{ id: 1, label: 'Trade 1' }]);
      expect(state.list.regions).toEqual([]);
      expect(state.list.types).toEqual([]);
    });

    it('should handle fetchFilterOptions.fulfilled with null payload', () => {
      const state = { ...initialState };
      const payload = null;
      const action = { type: fetchFilterOptions.fulfilled.type, payload };

      extraReducers[fetchFilterOptions.fulfilled](state, action);

      expect(state.list.trades).toEqual([]);
      expect(state.list.regions).toEqual([]);
      expect(state.list.types).toEqual([]);
    });

    it('should handle fetchFilterOptions.fulfilled with undefined payload', () => {
      const state = { ...initialState };
      const payload = undefined;
      const action = { type: fetchFilterOptions.fulfilled.type, payload };

      extraReducers[fetchFilterOptions.fulfilled](state, action);

      expect(state.list.trades).toEqual([]);
      expect(state.list.regions).toEqual([]);
      expect(state.list.types).toEqual([]);
    });

    it('should handle fetchFilterOptions.fulfilled with empty arrays', () => {
      const state = { ...initialState };
      const payload = {
        trades: [],
        regions: [],
        types: [],
      };
      const action = { type: fetchFilterOptions.fulfilled.type, payload };

      extraReducers[fetchFilterOptions.fulfilled](state, action);

      expect(state.list.trades).toEqual([]);
      expect(state.list.regions).toEqual([]);
      expect(state.list.types).toEqual([]);
    });

    it('should preserve existing list properties not affected by fulfilled action', () => {
      const state = {
        ...initialState,
        list: {
          ...initialState.list,
          phase: [{ id: 1, label: 'Phase 1' }],
          selectStatus: [{ id: 4, label: 'accept-invitation' }],
        },
      };
      const payload = {
        trades: [{ id: '1', label: 'Trade 1' }],
        regions: [],
        types: [],
      };
      const action = { type: fetchFilterOptions.fulfilled.type, payload };

      extraReducers[fetchFilterOptions.fulfilled](state, action);

      expect(state.list.phase).toEqual([{ id: 1, label: 'Phase 1' }]);
      expect(state.list.selectStatus).toEqual([{ id: 4, label: 'accept-invitation' }]);
    });

    it('should handle fetchFilterOptions.rejected without modifying state', () => {
      const state = { ...initialState };
      const action = { type: fetchFilterOptions.rejected.type };

      // This should not modify state (empty function)
      const originalState = JSON.parse(JSON.stringify(state));
      extraReducers[fetchFilterOptions.rejected](state, action);
      
      expect(state).toEqual(originalState);
    });
  });

  describe('data type conversion', () => {
    it('should convert string IDs to numbers in fulfilled action', () => {
      const state = { ...initialState };
      const payload = {
        trades: [{ id: '123', label: 'Trade 1' }],
        regions: [{ id: '456', label: 'Region 1' }],
        types: [{ id: '789', label: 'Type 1' }],
      };
      const action = { type: fetchFilterOptions.fulfilled.type, payload };

      extraReducers[fetchFilterOptions.fulfilled](state, action);

      expect(state.list.trades[0].id).toBe(123);
      expect(state.list.regions[0].id).toBe(456);
      expect(state.list.types[0].id).toBe(789);
      expect(typeof state.list.trades[0].id).toBe('number');
      expect(typeof state.list.regions[0].id).toBe('number');
      expect(typeof state.list.types[0].id).toBe('number');
    });

    it('should handle non-numeric ID strings gracefully', () => {
      const state = { ...initialState };
      const payload = {
        trades: [{ id: 'abc', label: 'Trade 1' }],
        regions: [{ id: 'def', label: 'Region 1' }],
        types: [{ id: 'ghi', label: 'Type 1' }],
      };
      const action = { type: fetchFilterOptions.fulfilled.type, payload };

      extraReducers[fetchFilterOptions.fulfilled](state, action);

      expect(state.list.trades[0].id).toBeNaN();
      expect(state.list.regions[0].id).toBeNaN();
      expect(state.list.types[0].id).toBeNaN();
    });

    it('should preserve all other properties from the payload', () => {
      const state = { ...initialState };
      const payload = {
        trades: [{ id: '1', label: 'Trade 1', category: 'construction', active: true }],
        regions: [{ id: '2', label: 'Region 1', country: 'UK' }],
        types: [{ id: '3', label: 'Type 1', description: 'Test type' }],
      };
      const action = { type: fetchFilterOptions.fulfilled.type, payload };

      extraReducers[fetchFilterOptions.fulfilled](state, action);

      expect(state.list.trades[0]).toEqual({
        id: 1,
        label: 'Trade 1',
        category: 'construction',
        active: true,
      });
      expect(state.list.regions[0]).toEqual({
        id: 2,
        label: 'Region 1',
        country: 'UK',
      });
      expect(state.list.types[0]).toEqual({
        id: 3,
        label: 'Type 1',
        description: 'Test type',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle payload with null arrays', () => {
      const state = { ...initialState };
      const payload = {
        trades: null,
        regions: null,
        types: null,
      };
      const action = { type: fetchFilterOptions.fulfilled.type, payload };

      extraReducers[fetchFilterOptions.fulfilled](state, action);

      expect(state.list.trades).toEqual([]);
      expect(state.list.regions).toEqual([]);
      expect(state.list.types).toEqual([]);
    });

    it('should handle items with missing id property', () => {
      const state = { ...initialState };
      const payload = {
        trades: [{ label: 'Trade without ID' }],
        regions: [{ id: '1', label: 'Region 1' }],
        types: [],
      };
      const action = { type: fetchFilterOptions.fulfilled.type, payload };

      extraReducers[fetchFilterOptions.fulfilled](state, action);

      expect(state.list.trades[0].id).toBeNaN();
      expect(state.list.trades[0].label).toBe('Trade without ID');
    });
  });
});
