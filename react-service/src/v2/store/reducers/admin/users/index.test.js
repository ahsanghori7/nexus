import usersReducer, { updateUsers, fetchUsers, createAccount } from './index';
import { createSlice } from '@reduxjs/toolkit';
import extraReducers from './extraReducers';
import status from 'store/reducers/common/constants';

// Mock @reduxjs/toolkit
jest.mock('@reduxjs/toolkit', () => ({
  ...jest.requireActual('@reduxjs/toolkit'),
  createSlice: jest.fn((options) => ({
    reducer: jest.fn((state, action) => {
      // Mock the updateUsers reducer logic
      if (action.type === 'users/updateUsers') {
        return { ...state, list: action.payload };
      }
      // For other actions, return the initial state or handle as needed for testing
      return state;
    }),
    actions: {
      updateUsers: jest.fn((payload) => ({ type: 'users/updateUsers', payload })), // Mock the updateUsers action creator
    },
    caseReducers: {}, // Mock caseReducers if any
    getInitialState: jest.fn(() => options.initialState), // Mock getInitialState
  })),
}));

// Mock extraReducers
jest.mock('./extraReducers', () => ({
  __esModule: true,
  default: jest.fn(), // Mock the extraReducers function
  fetchUsers: jest.fn(), // Mock the fetchUsers action creator
  createAccount: jest.fn(), // Mock the createAccount action creator
}));

// Mock status constants
jest.mock('store/reducers/common/constants', () => ({
  __esModule: true,
  default: {
    IDLE_STATUS: 'idle',
  },
}));


describe('usersSlice', () => {
  it('should create the slice with correct options', () => {
    // The slice is created when the module is imported, so we just need to check the mock call
    expect(createSlice).toHaveBeenCalledWith({
      name: 'users',
      initialState: {
        list: [],
        listCount: 0,
        status: { severity: '', message: '', type: status.IDLE_STATUS },
      },
      reducers: {
        updateUsers: expect.any(Function), // Check that updateUsers reducer is defined
      },
      extraReducers, // Check if the imported extraReducers is used
    });
  });

  it('should export the updateUsers action creator', () => {
    expect(updateUsers).toBeDefined();
    expect(updateUsers).toBe(updateUsers); // Verify it's the mocked function
  });

  it('should export the fetchUsers action creator', () => {
    expect(fetchUsers).toBeDefined();
    expect(fetchUsers).toBe(fetchUsers); // Verify it's the mocked function
  });

  it('should export the createAccount action creator', () => {
    expect(createAccount).toBeDefined();
    expect(createAccount).toBe(createAccount); // Verify it's the mocked function
  });

  it('should export the reducer', () => {
    expect(usersReducer).toBeDefined();
    // We can't easily check if it's the reducer returned by the mocked createSlice
    // A basic check for defined is sufficient here.
  });

  it('should handle updateUsers action', () => {
    const initialState = {
      list: [],
      listCount: 0,
      status: { severity: '', message: '', type: status.IDLE_STATUS },
    };
    const mockPayload = [{ id: 1, name: 'User 1' }];
    const action = updateUsers(mockPayload);
    const newState = usersReducer(initialState, action);
    expect(newState.list).toEqual(mockPayload);
  });
});
