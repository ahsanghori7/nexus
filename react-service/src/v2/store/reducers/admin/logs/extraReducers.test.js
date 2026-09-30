import { createSlice, configureStore } from '@reduxjs/toolkit';
import extraReducers, { fetchLogs } from './extraReducers';
import status from 'store/reducers/common/constants';
import { fetchData } from 'services/helpers';
import { renderTextWithoutHtml } from 'v2/helpers/data';
import capitalize from 'lodash/capitalize';

// Mock dependencies
jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
}));

jest.mock('v2/helpers/data', () => ({
  renderTextWithoutHtml: jest.fn((html) => {
    if (!html) {
      return '';
    }
    return html.replace(/<[^>]*>/g, '');
  }),
}));

jest.mock('lodash/capitalize', () =>
  jest.fn((str) => {
    if (!str) {
      return '';
    }

    const firstChar = str.charAt(0).toUpperCase();
    const remaining = str.slice(1);
    return firstChar + remaining;
  }),
);

describe('logs extraReducers', () => {
  let store;
  let initialState;

  beforeEach(() => {
    initialState = {
      list: [],
      listCount: 0,
      status: { severity: '', message: '', type: status.IDLE_STATUS },
    };

    // Create a slice to test extraReducers properly
    const testSlice = createSlice({
      name: 'testLogs',
      initialState,
      reducers: {},
      extraReducers,
    });

    store = configureStore({
      reducer: {
        logs: testSlice.reducer,
      },
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('fetchLogs async thunk', () => {
    it('should create correct action types', () => {
      expect(fetchLogs.pending.type).toBe('logs/fetchLogs/pending');
      expect(fetchLogs.fulfilled.type).toBe('logs/fetchLogs/fulfilled');
      expect(fetchLogs.rejected.type).toBe('logs/fetchLogs/rejected');
    });

    it('should call fetchData with correct parameters when limit > 0', async () => {
      const mockParams = { page: 1, limit: 10, filter: 'test' };
      const mockResponse = { data: [], info: { count: 0 } };
      fetchData.mockResolvedValue(mockResponse);

      await store.dispatch(fetchLogs(mockParams));

      expect(fetchData).toHaveBeenCalledWith('account/fetch-action', {
        limit: 10,
        filter: 'test',
      });
    });

    it('should call fetchData with correct parameters when limit <= 0', async () => {
      const mockParams = { page: 1, limit: 0, filter: 'test' };
      const mockResponse = { data: [], info: { count: 0 } };
      fetchData.mockResolvedValue(mockResponse);

      await store.dispatch(fetchLogs(mockParams));

      // When limit <= 0, it uses args which excludes both page and limit
      expect(fetchData).toHaveBeenCalledWith('account/fetch-action', {
        filter: 'test',
      });
    });

    it('should return payload with original params', async () => {
      const mockParams = { page: 1, limit: 10 };
      const mockResponse = { data: [], info: { count: 0 } };
      fetchData.mockResolvedValue(mockResponse);

      const result = await store.dispatch(fetchLogs(mockParams));

      expect(result.payload).toEqual({
        ...mockResponse,
        ...mockParams,
      });
    });
  });

  describe('pending state', () => {
    it('should set loading status and clear list when fetchLogs pending', () => {
      const action = fetchLogs.pending('', {});
      store.dispatch(action);

      const state = store.getState().logs;
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading account logs',
        type: status.LOADING_STATUS,
      });
      expect(state.list).toEqual([]);
    });
  });

  describe('fulfilled state', () => {
    beforeEach(() => {
      renderTextWithoutHtml.mockImplementation((html) => {
        if (!html) {
          return '';
        }

        return html.replace(/<[^>]*>/g, '');
      });

      capitalize.mockImplementation((str) => {
        if (!str) {
          return '';
        }

        const firstChar = str.charAt(0).toUpperCase();
        const remaining = str.slice(1);
        return firstChar + remaining;
      });
    });

    it('should set idle status and process logs data when fetchLogs fulfilled', async () => {
      const mockParams = { page: 1, limit: 10 };
      const mockResponse = {
        data: [
          {
            id: 1,
            action_type: 'create',
            description: '<p>Test description</p>',
            action_date: '2023-10-01',
          },
          {
            id: 2,
            action_type: 'update',
            description: '<div>Another description</div>',
            action_date: '2023-10-02',
          },
        ],
        info: { count: 25 },
      };

      fetchData.mockResolvedValue(mockResponse);
      await store.dispatch(fetchLogs(mockParams));

      const state = store.getState().logs;
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });

      expect(state.listCount).toBe(25);
      expect(state.list).toHaveLength(2);
      expect(capitalize).toHaveBeenCalledWith('create');
      expect(capitalize).toHaveBeenCalledWith('update');
      expect(renderTextWithoutHtml).toHaveBeenCalledWith('<p>Test description</p>');
      expect(renderTextWithoutHtml).toHaveBeenCalledWith('<div>Another description</div>');
    });

    it('should handle empty data array', async () => {
      const mockParams = { page: 1, limit: 10 };
      const mockResponse = {
        data: [],
        info: { count: 0 },
      };

      fetchData.mockResolvedValue(mockResponse);
      await store.dispatch(fetchLogs(mockParams));

      const state = store.getState().logs;
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(state.list).toEqual([]);
      expect(state.listCount).toBe(0);
    });

    it('should handle missing data property', async () => {
      const mockParams = { page: 1, limit: 10 };
      const mockResponse = {
        info: { count: 10 },
      };

      fetchData.mockResolvedValue(mockResponse);
      await store.dispatch(fetchLogs(mockParams));

      const state = store.getState().logs;
      expect(state.list).toEqual([]);
      expect(state.listCount).toBe(10);
    });

    it('should create mock logs when offset is provided', async () => {
      const mockParams = { page: 1, limit: 10, offset: 3 };
      const mockResponse = {
        data: [
          {
            id: 'real-1',
            action_type: 'create',
            description: 'Real log',
            action_date: '2023-10-01',
          },
        ],
        info: { count: 5 },
        offset: 3,
      };

      fetchData.mockResolvedValue(mockResponse);
      await store.dispatch(fetchLogs(mockParams));

      const state = store.getState().logs;
      expect(state.list).toHaveLength(4); // 3 mock logs + 1 real log
      expect(state.list[0]).toEqual({ id: 'mock-log-id-0' });
      expect(state.list[1]).toEqual({ id: 'mock-log-id-1' });
      expect(state.list[2]).toEqual({ id: 'mock-log-id-2' });
      expect(state.list[3].id).toBe('real-1');
    });

    it('should handle missing info property', async () => {
      const mockParams = { page: 1, limit: 10 };
      const mockResponse = {
        data: [
          {
            id: 1,
            action_type: 'create',
            description: 'Test',
            action_date: '2023-10-01',
          },
        ],
      };

      fetchData.mockResolvedValue(mockResponse);
      await store.dispatch(fetchLogs(mockParams));

      const state = store.getState().logs;
      expect(state.listCount).toBe(0); // Default when info is missing
    });

    it('should preserve original properties from log data', async () => {
      const mockParams = { page: 1, limit: 10 };
      const mockResponse = {
        data: [
          {
            id: 1,
            action_type: 'create',
            description: 'Test description',
            action_date: '2023-10-01',
            user_id: 123,
            custom_field: 'custom_value',
          },
        ],
        info: { count: 1 },
      };

      fetchData.mockResolvedValue(mockResponse);
      await store.dispatch(fetchLogs(mockParams));

      const state = store.getState().logs;
      expect(state.list[0]).toEqual({
        id: 1,
        action_type: 'Create',
        description: 'Test description',
        action_date: '2023-10-01',
        user_id: 123,
        custom_field: 'custom_value',
      });
    });
  });

  describe('rejected state', () => {
    it('should set error status and reset list when fetchLogs rejected', async () => {
      const mockParams = { page: 1, limit: 10 };
      fetchData.mockRejectedValue(new Error('Network error'));

      await store.dispatch(fetchLogs(mockParams));

      const state = store.getState().logs;
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE Loading account logs',
        type: status.FAILURE_STATUS,
      });
      expect(state.list).toEqual([]);
      expect(state.listCount).toBe(0);
    });
  });

  describe('fetchLogs export', () => {
    it('should export fetchLogs function', () => {
      expect(fetchLogs).toBeDefined();
      expect(typeof fetchLogs).toBe('function');
    });

    it('should be an async thunk', () => {
      expect(fetchLogs.pending).toBeDefined();
      expect(fetchLogs.fulfilled).toBeDefined();
      expect(fetchLogs.rejected).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle null payload in fulfilled state', async () => {
      const mockParams = { page: 1, limit: 10 };
      fetchData.mockResolvedValue(null);

      await store.dispatch(fetchLogs(mockParams));

      const state = store.getState().logs;
      expect(state.list).toEqual([]);
      expect(state.listCount).toBe(0);
    });

    it('should handle payload with zero offset', async () => {
      const mockParams = { page: 1, limit: 10 };
      const mockResponse = {
        data: [{ id: 1, action_type: 'create', description: 'Test', action_date: '2023-10-01' }],
        info: { count: 1 },
        offset: 0,
      };

      fetchData.mockResolvedValue(mockResponse);
      await store.dispatch(fetchLogs(mockParams));

      const state = store.getState().logs;
      expect(state.list).toHaveLength(1); // No mock logs, just the real one
      expect(state.list[0].id).toBe(1);
    });

    it('should handle logs without required properties', async () => {
      const mockParams = { page: 1, limit: 10 };
      const mockResponse = {
        data: [
          {
            id: 1,
            // Missing action_type and description
            action_date: '2023-10-01',
          },
        ],
        info: { count: 1 },
      };

      fetchData.mockResolvedValue(mockResponse);
      await store.dispatch(fetchLogs(mockParams));

      const state = store.getState().logs;
      expect(state.list).toHaveLength(1);
      expect(capitalize).toHaveBeenCalledWith(undefined);
      expect(renderTextWithoutHtml).toHaveBeenCalledWith(undefined);
    });

    it('should handle sequential dispatch calls', async () => {
      // Test that the state is properly handled across multiple dispatches
      const mockParams1 = { page: 1, limit: 10 };
      const mockResponse1 = {
        data: [{ id: 1, action_type: 'create', description: 'Log 1', action_date: '2023-10-01' }],
        info: { count: 1 },
      };

      fetchData.mockResolvedValueOnce(mockResponse1);
      await store.dispatch(fetchLogs(mockParams1));

      let state = store.getState().logs;
      expect(state.list).toHaveLength(1);
      expect(state.listCount).toBe(1);

      const mockParams2 = { page: 2, limit: 10 };
      const mockResponse2 = {
        data: [{ id: 2, action_type: 'update', description: 'Log 2', action_date: '2023-10-02' }],
        info: { count: 2 },
      };

      fetchData.mockResolvedValueOnce(mockResponse2);
      await store.dispatch(fetchLogs(mockParams2));

      state = store.getState().logs;
      expect(state.list).toHaveLength(1); // Should be replaced, not appended
      expect(state.list[0].id).toBe(2);
      expect(state.listCount).toBe(2);
    });
  });
});
