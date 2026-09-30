import logsReducer, { updateLogs, fetchLogs } from './index';
import status from 'store/reducers/common/constants';

// Mock the extraReducers module
jest.mock('./extraReducers', () => ({
  __esModule: true,
  default: {},
  fetchLogs: jest.fn(),
}));

describe('logs slice', () => {
  const initialState = {
    list: [],
    listCount: 0,
    status: { severity: '', message: '', type: status.IDLE_STATUS },
  };

  it('should return the initial state', () => {
    expect(logsReducer(undefined, { type: undefined })).toEqual(initialState);
  });

  it('should handle updateLogs action', () => {
    const mockLogs = [
      { id: 1, action_type: 'Create', description: 'Test log 1' },
      { id: 2, action_type: 'Update', description: 'Test log 2' },
    ];

    const action = updateLogs(mockLogs);
    const newState = logsReducer(initialState, action);

    expect(newState.list).toEqual(mockLogs);
    expect(newState.listCount).toBe(0); // Should remain unchanged
    expect(newState.status).toEqual(initialState.status); // Should remain unchanged
  });

  it('should handle updateLogs with empty array', () => {
    const currentState = {
      list: [{ id: 1, action_type: 'Create', description: 'Existing log' }],
      listCount: 5,
      status: { severity: 'info', message: 'Loading', type: status.LOADING_STATUS },
    };

    const action = updateLogs([]);
    const newState = logsReducer(currentState, action);

    expect(newState.list).toEqual([]);
    expect(newState.listCount).toBe(5); // Should remain unchanged
    expect(newState.status).toEqual(currentState.status); // Should remain unchanged
  });

  it('should export fetchLogs action', () => {
    expect(fetchLogs).toBeDefined();
  });

  it('should not mutate the original state when updating logs', () => {
    const originalState = {
      list: [{ id: 1, action_type: 'Original', description: 'Original log' }],
      listCount: 1,
      status: { severity: '', message: '', type: status.IDLE_STATUS },
    };

    const mockLogs = [
      { id: 2, action_type: 'New', description: 'New log' },
    ];

    const action = updateLogs(mockLogs);
    const newState = logsReducer(originalState, action);

    // Original state should not be mutated
    expect(originalState.list).toEqual([{ id: 1, action_type: 'Original', description: 'Original log' }]);
    // New state should have updated list
    expect(newState.list).toEqual(mockLogs);
  });
});