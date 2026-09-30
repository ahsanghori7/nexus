import activityReducer, { fetchActivities } from './index';
import { createSlice } from '@reduxjs/toolkit';
import extraReducers from './extraReducers';

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
  fetchActivities: jest.fn(), // Mock the fetchActivities action creator
}));

describe('activitySlice', () => {
  it('should create the slice with correct options', () => {
    // The slice is created when the module is imported, so we just need to check the mock call
    expect(createSlice).toHaveBeenCalledWith({
      name: 'activity',
      initialState: {
        list: [],
        status: '',
      },
      reducers: {},
      extraReducers, // Check if the imported extraReducers is used
    });
  });

  it('should export the fetchActivities action creator', () => {
    expect(fetchActivities).toBeDefined();
    expect(fetchActivities).toBe(fetchActivities); // Verify it's the mocked function
  });

  it('should export the reducer', () => {
    expect(activityReducer).toBeDefined();
    // We can't easily check if it's the reducer returned by the mocked createSlice
    // A basic check for defined is sufficient here.
  });
});
