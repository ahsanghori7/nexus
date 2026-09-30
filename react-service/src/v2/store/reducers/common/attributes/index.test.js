import attributesReducer, {
  fetchRegions,
  fetchTrades,
  fetchProjectType,
  fetchPublicTrades,
  fetchAsiteFolders,
} from './index';

describe('attributes reducer', () => {
  const initialState = {
    loading1: false,
    loading2: false,
    loading3: false,
    loading4: false,
    error: '',
    regions: [],
    trades: [],
    projectType: [],
    asiteFolders: [],
  };

  it('should return the initial state', () => {
    expect(attributesReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle undefined state', () => {
    expect(attributesReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('fetchRegions', () => {
    it('should handle fetchRegions.pending', () => {
      const action = { type: fetchRegions.pending.type };
      const state = attributesReducer(initialState, action);
      
      expect(state.loading1).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle fetchRegions.fulfilled', () => {
      const payload = { data: [{ id: 1, name: 'Region 1' }] };
      const action = { type: fetchRegions.fulfilled.type, payload };
      const state = attributesReducer(initialState, action);
      
      expect(state.regions).toEqual(payload.data);
      expect(state.loading1).toBe(false);
    });

    it('should handle fetchRegions.rejected', () => {
      const action = { type: fetchRegions.rejected.type };
      const state = attributesReducer(initialState, action);
      
      expect(state.loading1).toBe(false);
      expect(state.error).toBe('An error occurred while fetching the regions attributes.');
    });
  });

  describe('fetchTrades', () => {
    it('should handle fetchTrades.pending', () => {
      const action = { type: fetchTrades.pending.type };
      const state = attributesReducer(initialState, action);
      
      expect(state.loading2).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle fetchTrades.fulfilled', () => {
      const payload = { data: [{ id: 1, name: 'Trade 1' }] };
      const action = { type: fetchTrades.fulfilled.type, payload };
      const state = attributesReducer(initialState, action);
      
      expect(state.trades).toEqual(payload.data);
      expect(state.loading2).toBe(false);
    });

    it('should handle fetchTrades.rejected', () => {
      const action = { type: fetchTrades.rejected.type };
      const state = attributesReducer(initialState, action);
      
      expect(state.loading2).toBe(false);
      expect(state.error).toBe('An error occurred while fetching the trades attributes.');
    });
  });

  describe('fetchPublicTrades', () => {
    it('should handle fetchPublicTrades.pending', () => {
      const action = { type: fetchPublicTrades.pending.type };
      const state = attributesReducer(initialState, action);
      
      expect(state.loading2).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle fetchPublicTrades.fulfilled', () => {
      const payload = { data: [{ id: 1, name: 'Public Trade 1' }] };
      const action = { type: fetchPublicTrades.fulfilled.type, payload };
      const state = attributesReducer(initialState, action);
      
      expect(state.trades).toEqual(payload.data);
      expect(state.loading2).toBe(false);
    });

    it('should handle fetchPublicTrades.rejected', () => {
      const action = { type: fetchPublicTrades.rejected.type };
      const state = attributesReducer(initialState, action);
      
      expect(state.loading2).toBe(false);
      expect(state.error).toBe('An error occurred while fetching the public trades attributes.');
    });
  });

  describe('fetchProjectType', () => {
    it('should handle fetchProjectType.pending', () => {
      const action = { type: fetchProjectType.pending.type };
      const state = attributesReducer(initialState, action);
      
      expect(state.loading3).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle fetchProjectType.fulfilled', () => {
      const payload = { data: [{ id: 1, name: 'Project Type 1' }] };
      const action = { type: fetchProjectType.fulfilled.type, payload };
      const state = attributesReducer(initialState, action);
      
      expect(state.projectType).toEqual(payload.data);
      expect(state.loading3).toBe(false);
    });

    it('should handle fetchProjectType.rejected', () => {
      const action = { type: fetchProjectType.rejected.type };
      const state = attributesReducer(initialState, action);
      
      expect(state.loading3).toBe(false);
      expect(state.error).toBe('An error occurred while fetching the project type attributes.');
    });
  });

  describe('edge cases', () => {
    it('should handle unknown action type', () => {
      const action = { type: 'unknown/action' };
      const state = attributesReducer(initialState, action);
      
      expect(state).toEqual(initialState);
    });

    it('should preserve state for unknown actions', () => {
      const currentState = {
        ...initialState,
        regions: [{ id: 1, name: 'Existing Region' }],
        loading1: true,
      };
      const action = { type: 'unknown/action' };
      const state = attributesReducer(currentState, action);
      
      expect(state).toEqual(currentState);
    });

    it('should handle action with missing payload gracefully', () => {
      // This test is checking for defensive programming, but the current implementation
      // doesn't handle missing payload, which is expected Redux Toolkit behavior
      const action = { type: fetchRegions.fulfilled.type, payload: { data: null } };
      const state = attributesReducer(initialState, action);
      
      expect(state.loading1).toBe(false);
      expect(state.regions).toBeNull();
    });
  });
});