/**
 * @jest-environment jsdom
 */

import { configureStore } from '@reduxjs/toolkit';
import { produce } from 'immer';
import { fetchData } from 'v2/services/clinkHelpers';

import templateReducer, { fetchTemplates } from './index';
import extraReducers from './extraReducers';

// Mock the service dependency
jest.mock('v2/services/clinkHelpers', () => ({
  fetchData: jest.fn(),
}));
const mockFetchData = fetchData;

describe('clink templates extraReducers', () => {
  let store;
  let dispatch;
  let getState;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        templates: templateReducer,
      },
    });
    dispatch = store.dispatch;
    getState = store.getState;
    mockFetchData.mockClear();
  });

  describe('fetchTemplates async thunk', () => {
    it('should have correct type', () => {
      expect(fetchTemplates.typePrefix).toBe('template/fetchAll');
    });

    it('should call fetchData with default params when no params provided', async () => {
      mockFetchData.mockResolvedValue([]);
      
      await dispatch(fetchTemplates());
      
      expect(mockFetchData).toHaveBeenCalledWith('template', 'fetchAll', { type: 'orders' });
    });

    it('should call fetchData with provided params', async () => {
      mockFetchData.mockResolvedValue([]);
      const customParams = { type: 'custom', filter: 'test' };
      
      await dispatch(fetchTemplates(customParams));
      
      expect(mockFetchData).toHaveBeenCalledWith('template', 'fetchAll', customParams);
    });

    it('should return resolved value from fetchData', async () => {
      const mockTemplates = [
        { id: 1, name: 'Template A' },
        { id: 2, name: 'Template B' }
      ];
      mockFetchData.mockResolvedValue(mockTemplates);
      
      const result = await dispatch(fetchTemplates());
      
      expect(result.payload).toEqual(mockTemplates);
    });

    it('should handle fetchData rejection', async () => {
      const error = new Error('Fetch failed');
      mockFetchData.mockRejectedValue(error);
      
      const result = await dispatch(fetchTemplates());
      
      expect(result.type).toBe('template/fetchAll/rejected');
      expect(result.error.message).toBe('Fetch failed');
    });
  });

  describe('extraReducers', () => {
    describe('fetchTemplates.pending', () => {
      it('should handle pending state', () => {
        const testState = { list: [{ id: 1, name: 'existing' }] };
        const action = { type: fetchTemplates.pending.type };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.pending](draft, action);
        });
        
        // Pending handler is empty, so state should be unchanged
        expect(newState).toEqual(testState);
      });

      it('should handle pending state with empty initial state', () => {
        const testState = { list: [] };
        const action = { type: fetchTemplates.pending.type };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.pending](draft, action);
        });
        
        expect(newState).toEqual(testState);
      });
    });

    describe('fetchTemplates.fulfilled', () => {
      it('should set sorted template list on fulfilled', () => {
        const testState = { list: [] };
        const templates = [
          { id: 2, name: 'Zebra Template' },
          { id: 1, name: 'Alpha Template' },
          { id: 3, name: 'Beta Template' }
        ];
        const action = {
          type: fetchTemplates.fulfilled.type,
          payload: templates
        };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.fulfilled](draft, action);
        });
        
        expect(newState.list).toEqual([
          { id: 1, name: 'Alpha Template' },
          { id: 3, name: 'Beta Template' },
          { id: 2, name: 'Zebra Template' }
        ]);
      });

      it('should handle case-insensitive sorting', () => {
        const testState = { list: [] };
        const templates = [
          { id: 1, name: 'zebra Template' },
          { id: 2, name: 'Alpha Template' },
          { id: 3, name: 'BETA Template' }
        ];
        const action = {
          type: fetchTemplates.fulfilled.type,
          payload: templates
        };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.fulfilled](draft, action);
        });
        
        expect(newState.list).toEqual([
          { id: 2, name: 'Alpha Template' },
          { id: 3, name: 'BETA Template' },
          { id: 1, name: 'zebra Template' }
        ]);
      });

      it('should handle empty payload array', () => {
        const testState = { list: [{ id: 1, name: 'existing' }] };
        const action = {
          type: fetchTemplates.fulfilled.type,
          payload: []
        };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.fulfilled](draft, action);
        });
        
        expect(newState.list).toEqual([]);
      });

      it('should handle null payload', () => {
        const testState = { list: [{ id: 1, name: 'existing' }] };
        const action = {
          type: fetchTemplates.fulfilled.type,
          payload: null
        };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.fulfilled](draft, action);
        });
        
        expect(newState.list).toEqual([]);
      });

      it('should handle undefined payload', () => {
        const testState = { list: [{ id: 1, name: 'existing' }] };
        const action = {
          type: fetchTemplates.fulfilled.type,
          payload: undefined
        };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.fulfilled](draft, action);
        });
        
        expect(newState.list).toEqual([]);
      });

      it('should handle non-array payload', () => {
        const testState = { list: [{ id: 1, name: 'existing' }] };
        const action = {
          type: fetchTemplates.fulfilled.type,
          payload: { data: 'not an array' }
        };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.fulfilled](draft, action);
        });
        
        expect(newState.list).toEqual([]);
      });

      it('should replace existing list completely', () => {
        const testState = { 
          list: [
            { id: 99, name: 'Old Template' }
          ]
        };
        const templates = [
          { id: 1, name: 'New Template A' },
          { id: 2, name: 'New Template B' }
        ];
        const action = {
          type: fetchTemplates.fulfilled.type,
          payload: templates
        };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.fulfilled](draft, action);
        });
        
        expect(newState.list).toEqual([
          { id: 1, name: 'New Template A' },
          { id: 2, name: 'New Template B' }
        ]);
        expect(newState.list).not.toContainEqual({ id: 99, name: 'Old Template' });
      });

      it('should handle single template', () => {
        const testState = { list: [] };
        const templates = [{ id: 1, name: 'Single Template' }];
        const action = {
          type: fetchTemplates.fulfilled.type,
          payload: templates
        };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.fulfilled](draft, action);
        });
        
        expect(newState.list).toEqual([{ id: 1, name: 'Single Template' }]);
      });

      it('should preserve other state properties', () => {
        const testState = { 
          list: [],
          otherProperty: 'preserved',
          loading: true
        };
        const templates = [{ id: 1, name: 'Template' }];
        const action = {
          type: fetchTemplates.fulfilled.type,
          payload: templates
        };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.fulfilled](draft, action);
        });
        
        expect(newState.list).toEqual([{ id: 1, name: 'Template' }]);
        expect(newState.otherProperty).toBe('preserved');
        expect(newState.loading).toBe(true);
      });
    });

    describe('fetchTemplates.rejected', () => {
      it('should handle rejected state', () => {
        const testState = { list: [{ id: 1, name: 'existing' }] };
        const action = { 
          type: fetchTemplates.rejected.type,
          error: { message: 'Failed to fetch' }
        };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.rejected](draft, action);
        });
        
        // Rejected handler is empty, so state should be unchanged
        expect(newState).toEqual(testState);
      });

      it('should handle rejected state with empty initial state', () => {
        const testState = { list: [] };
        const action = { 
          type: fetchTemplates.rejected.type,
          error: { message: 'Failed to fetch' }
        };
        
        const newState = produce(testState, (draft) => {
          extraReducers[fetchTemplates.rejected](draft, action);
        });
        
        expect(newState).toEqual(testState);
      });
    });
  });

  describe('integration tests', () => {
    it('should handle complete fetch cycle', async () => {
      // Initial state
      expect(getState().templates.list).toEqual([]);

      // Mock successful response
      const mockTemplates = [
        { id: 3, name: 'Charlie Template' },
        { id: 1, name: 'Alpha Template' },
        { id: 2, name: 'Beta Template' }
      ];
      mockFetchData.mockResolvedValue(mockTemplates);

      // Dispatch fetch
      const result = await dispatch(fetchTemplates({ type: 'orders' }));

      // Verify success
      expect(result.type).toBe('template/fetchAll/fulfilled');
      expect(result.payload).toEqual(mockTemplates);

      // Verify state is updated and sorted
      const finalState = getState().templates;
      expect(finalState.list).toEqual([
        { id: 1, name: 'Alpha Template' },
        { id: 2, name: 'Beta Template' },
        { id: 3, name: 'Charlie Template' }
      ]);
    });

    it('should handle fetch failure gracefully', async () => {
      // Initial state with existing data
      const initialTemplates = [{ id: 1, name: 'Existing Template' }];
      store = configureStore({
        reducer: {
          templates: templateReducer,
        },
        preloadedState: {
          templates: { list: initialTemplates }
        }
      });
      dispatch = store.dispatch;
      getState = store.getState;

      // Mock failed response
      mockFetchData.mockRejectedValue(new Error('Network error'));

      // Dispatch fetch
      const result = await dispatch(fetchTemplates());

      // Verify failure
      expect(result.type).toBe('template/fetchAll/rejected');
      expect(result.error.message).toBe('Network error');

      // Verify state is unchanged (rejected handler is empty)
      const finalState = getState().templates;
      expect(finalState.list).toEqual(initialTemplates);
    });

    it('should handle empty response', async () => {
      mockFetchData.mockResolvedValue([]);

      const result = await dispatch(fetchTemplates());

      expect(result.type).toBe('template/fetchAll/fulfilled');
      expect(getState().templates.list).toEqual([]);
    });

    it('should handle multiple consecutive fetches', async () => {
      // First fetch
      mockFetchData.mockResolvedValue([{ id: 1, name: 'First Template' }]);
      await dispatch(fetchTemplates());
      expect(getState().templates.list).toEqual([{ id: 1, name: 'First Template' }]);

      // Second fetch overwrites
      mockFetchData.mockResolvedValue([
        { id: 2, name: 'Second Template' },
        { id: 3, name: 'Third Template' }
      ]);
      await dispatch(fetchTemplates());
      
      const finalState = getState().templates;
      expect(finalState.list).toEqual([
        { id: 2, name: 'Second Template' },
        { id: 3, name: 'Third Template' }
      ]);
      expect(finalState.list).not.toContainEqual({ id: 1, name: 'First Template' });
    });
  });
});