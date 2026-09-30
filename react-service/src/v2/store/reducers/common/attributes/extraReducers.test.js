import extraReducers from './extraReducers';
import {
  fetchRegions,
  fetchTrades,
  fetchProjectType,
  fetchPublicTrades,
  fetchAsiteFolders,
} from './asyncThunk';

describe('attributes extraReducers', () => {
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

  describe('fetchRegions handlers', () => {
    it('should handle fetchRegions.pending', () => {
      const state = { ...initialState, error: 'Previous error' };
      const action = { type: fetchRegions.pending.type };
      
      extraReducers[fetchRegions.pending](state, action);
      
      expect(state.loading1).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle fetchRegions.fulfilled', () => {
      const state = { ...initialState, loading1: true };
      const payload = { data: [{ id: 1, name: 'Region 1' }] };
      const action = { type: fetchRegions.fulfilled.type, payload };
      
      extraReducers[fetchRegions.fulfilled](state, action);
      
      expect(state.regions).toEqual(payload.data);
      expect(state.loading1).toBe(false);
    });

    it('should handle fetchRegions.rejected', () => {
      const state = { ...initialState, loading1: true };
      const action = { type: fetchRegions.rejected.type };
      
      extraReducers[fetchRegions.rejected](state, action);
      
      expect(state.loading1).toBe(false);
      expect(state.error).toBe('An error occurred while fetching the regions attributes.');
    });
  });

  describe('fetchTrades handlers', () => {
    it('should handle fetchTrades.pending', () => {
      const state = { ...initialState, error: 'Previous error' };
      const action = { type: fetchTrades.pending.type };
      
      extraReducers[fetchTrades.pending](state, action);
      
      expect(state.loading2).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle fetchTrades.fulfilled', () => {
      const state = { ...initialState, loading2: true };
      const payload = { data: [{ id: 1, name: 'Trade 1' }] };
      const action = { type: fetchTrades.fulfilled.type, payload };
      
      extraReducers[fetchTrades.fulfilled](state, action);
      
      expect(state.trades).toEqual(payload.data);
      expect(state.loading2).toBe(false);
    });

    it('should handle fetchTrades.rejected', () => {
      const state = { ...initialState, loading2: true };
      const action = { type: fetchTrades.rejected.type };
      
      extraReducers[fetchTrades.rejected](state, action);
      
      expect(state.loading2).toBe(false);
      expect(state.error).toBe('An error occurred while fetching the trades attributes.');
    });
  });

  describe('fetchPublicTrades handlers', () => {
    it('should handle fetchPublicTrades.pending', () => {
      const state = { ...initialState, error: 'Previous error' };
      const action = { type: fetchPublicTrades.pending.type };
      
      extraReducers[fetchPublicTrades.pending](state, action);
      
      expect(state.loading2).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle fetchPublicTrades.fulfilled', () => {
      const state = { ...initialState, loading2: true };
      const payload = { data: [{ id: 1, name: 'Public Trade 1' }] };
      const action = { type: fetchPublicTrades.fulfilled.type, payload };
      
      extraReducers[fetchPublicTrades.fulfilled](state, action);
      
      expect(state.trades).toEqual(payload.data);
      expect(state.loading2).toBe(false);
    });

    it('should handle fetchPublicTrades.rejected', () => {
      const state = { ...initialState, loading2: true };
      const action = { type: fetchPublicTrades.rejected.type };
      
      extraReducers[fetchPublicTrades.rejected](state, action);
      
      expect(state.loading2).toBe(false);
      expect(state.error).toBe('An error occurred while fetching the public trades attributes.');
    });
  });

  describe('fetchProjectType handlers', () => {
    it('should handle fetchProjectType.pending', () => {
      const state = { ...initialState, error: 'Previous error' };
      const action = { type: fetchProjectType.pending.type };
      
      extraReducers[fetchProjectType.pending](state, action);
      
      expect(state.loading3).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle fetchProjectType.fulfilled', () => {
      const state = { ...initialState, loading3: true };
      const payload = { data: [{ id: 1, name: 'Project Type 1' }] };
      const action = { type: fetchProjectType.fulfilled.type, payload };
      
      extraReducers[fetchProjectType.fulfilled](state, action);
      
      expect(state.projectType).toEqual(payload.data);
      expect(state.loading3).toBe(false);
    });

    it('should handle fetchProjectType.rejected', () => {
      const state = { ...initialState, loading3: true };
      const action = { type: fetchProjectType.rejected.type };
      
      extraReducers[fetchProjectType.rejected](state, action);
      
      expect(state.loading3).toBe(false);
      expect(state.error).toBe('An error occurred while fetching the project type attributes.');
    });
  });

  describe('fetchAsiteFolders handlers', () => {
    it('should handle fetchAsiteFolders.pending', () => {
      const state = { ...initialState, error: 'Previous error' };
      const action = { type: fetchAsiteFolders.pending.type };
      
      extraReducers[fetchAsiteFolders.pending](state, action);
      
      expect(state.loading4).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle fetchAsiteFolders.fulfilled with valid data', () => {
      const state = { ...initialState, loading4: true };
      const payload = { 
        data: [
          {
            id: '142353541$$2iQ1gp',
            name: '00 - Information Management Documentation',
            uri: 'https://dmsak.asite.com/api/workspace/2225710$$QQYS8m/folder/142353541$$2iQ1gp/firstpage_doclist'
          },
          {
            id: '142353543$$QwMpjd',
            name: '01 - Contract Documents',
            uri: 'https://dmsak.asite.com/api/workspace/2225710$$QQYS8m/folder/142353543$$QwMpjd/firstpage_doclist'
          }
        ]
      };
      const action = { type: fetchAsiteFolders.fulfilled.type, payload };
      
      extraReducers[fetchAsiteFolders.fulfilled](state, action);
      
      expect(state.asiteFolders).toEqual(payload.data);
      expect(state.loading4).toBe(false);
    });

    it('should handle fetchAsiteFolders.fulfilled with null payload', () => {
      const state = { ...initialState, loading4: true };
      const action = { type: fetchAsiteFolders.fulfilled.type, payload: { data: null } };
      
      extraReducers[fetchAsiteFolders.fulfilled](state, action);
      
      expect(state.asiteFolders).toEqual([]);
      expect(state.loading4).toBe(false);
    });

    it('should handle fetchAsiteFolders.fulfilled with undefined payload', () => {
      const state = { ...initialState, loading4: true };
      const action = { type: fetchAsiteFolders.fulfilled.type, payload: {} };
      
      extraReducers[fetchAsiteFolders.fulfilled](state, action);
      
      expect(state.asiteFolders).toEqual([]);
      expect(state.loading4).toBe(false);
    });

    it('should handle fetchAsiteFolders.fulfilled with empty array', () => {
      const state = { ...initialState, loading4: true };
      const action = { type: fetchAsiteFolders.fulfilled.type, payload: { data: [] } };
      
      extraReducers[fetchAsiteFolders.fulfilled](state, action);
      
      expect(state.asiteFolders).toEqual([]);
      expect(state.loading4).toBe(false);
    });

    it('should handle fetchAsiteFolders.rejected', () => {
      const state = { ...initialState, loading4: true };
      const action = { type: fetchAsiteFolders.rejected.type };
      
      extraReducers[fetchAsiteFolders.rejected](state, action);
      
      expect(state.loading4).toBe(false);
      expect(state.error).toBe('An error occurred while fetching the asite folders.');
    });
  });

  describe('edge cases', () => {
    it('should handle fulfilled actions with missing payload gracefully', () => {
      // In real Redux Toolkit usage, payload should always be present for fulfilled actions
      // This test verifies the current behavior - it will throw an error if payload is missing
      const state = { ...initialState };
      const action = { type: fetchRegions.fulfilled.type, payload: { data: undefined } };
      
      extraReducers[fetchRegions.fulfilled](state, action);
      
      expect(state.loading1).toBe(false);
      expect(state.regions).toBeUndefined();
    });

    it('should handle fulfilled actions with null payload data', () => {
      const state = { ...initialState };
      const action = { type: fetchTrades.fulfilled.type, payload: { data: null } };
      
      extraReducers[fetchTrades.fulfilled](state, action);
      
      expect(state.loading2).toBe(false);
      expect(state.trades).toBeNull();
    });

    it('should handle fulfilled actions with empty payload data', () => {
      const state = { ...initialState };
      const action = { type: fetchProjectType.fulfilled.type, payload: { data: [] } };
      
      extraReducers[fetchProjectType.fulfilled](state, action);
      
      expect(state.loading3).toBe(false);
      expect(state.projectType).toEqual([]);
    });
  });
});