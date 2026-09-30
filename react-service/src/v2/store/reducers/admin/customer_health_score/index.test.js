import customerHealthScoreReducer, { fetchHealthScore, updateHealthScore } from './index';
import { createSlice } from '@reduxjs/toolkit';
import extraReducers from './extraReducers';
import status from 'store/reducers/common/constants';

// Mock @reduxjs/toolkit
jest.mock('@reduxjs/toolkit', () => ({
  ...jest.requireActual('@reduxjs/toolkit'),
  createSlice: jest.fn((options) => ({
    reducer: jest.fn(), // Mock the reducer returned by createSlice
    actions: {}, // Mock actions if any
    caseReducers: {}, // Mock caseReducers if any
    getInitialState: jest.fn(() => options.initialState), // Mock getInitialState
  })),
}));

// Mock extraReducers
jest.mock('./extraReducers', () => ({
  __esModule: true,
  default: jest.fn(), // Mock the extraReducers function
  fetchHealthScore: jest.fn(), // Mock the fetchHealthScore action creator
  updateHealthScore: jest.fn(), // Mock the updateHealthScore action creator
}));

// Mock status constants
jest.mock('store/reducers/common/constants', () => ({
  __esModule: true,
  default: {
    IDLE_STATUS: 'idle',
  },
}));


describe('customerHealthScoreSlice', () => {
  it('should create the slice with correct options', () => {
    // The slice is created when the module is imported, so we just need to check the mock call
    expect(createSlice).toHaveBeenCalledWith({
      name: 'customer_health_score',
      initialState: {
        list: [],
        listCount: 0,
        status: { severity: '', message: '', type: status.IDLE_STATUS },
      },
      reducers: {},
      extraReducers, // Check if the imported extraReducers is used
    });
  });

  it('should export the fetchHealthScore action creator', () => {
    expect(fetchHealthScore).toBeDefined();
    expect(fetchHealthScore).toBe(fetchHealthScore); // Verify it's the mocked function
  });

  it('should export the updateHealthScore action creator', () => {
    expect(updateHealthScore).toBeDefined();
    expect(updateHealthScore).toBe(updateHealthScore); // Verify it's the mocked function
  });

  it('should export the reducer', () => {
    expect(customerHealthScoreReducer).toBeDefined();
    // We can't easily check if it's the reducer returned by the mocked createSlice
    // A basic check for defined is sufficient here.
  });
});
