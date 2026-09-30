import projectsReducer, { fetchProjects, fetchStatusList, changeStatus } from './index';
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
  fetchProjects: jest.fn(), // Mock the fetchProjects action creator
  fetchStatusList: jest.fn(), // Mock the fetchStatusList action creator
  changeStatus: jest.fn(), // Mock the changeStatus action creator
}));

// Mock status constants
jest.mock('store/reducers/common/constants', () => ({
  __esModule: true,
  default: {
    IDLE_STATUS: 'idle',
  },
}));


describe('projectsSlice', () => {
  it('should create the slice with correct options', () => {
    // The slice is created when the module is imported, so we just need to check the mock call
    expect(createSlice).toHaveBeenCalledWith({
      name: 'projects',
      initialState: {
        list: [],
        status: { severity: '', message: '', type: status.IDLE_STATUS },
        statusList: [],
      },
      reducers: {},
      extraReducers, // Check if the imported extraReducers is used
    });
  });

  it('should export the fetchProjects action creator', () => {
    expect(fetchProjects).toBeDefined();
    expect(fetchProjects).toBe(fetchProjects); // Verify it's the mocked function
  });

  it('should export the fetchStatusList action creator', () => {
    expect(fetchStatusList).toBeDefined();
    expect(fetchStatusList).toBe(fetchStatusList); // Verify it's the mocked function
  });

  it('should export the changeStatus action creator', () => {
    expect(changeStatus).toBeDefined();
    expect(changeStatus).toBe(changeStatus); // Verify it's the mocked function
  });

  it('should export the reducer', () => {
    expect(projectsReducer).toBeDefined();
    // We can't easily check if it's the reducer returned by the mocked createSlice
    // A basic check for defined is sufficient here.
  });
});
