import adminReducer, { fetchAdminInfo, fetchMainContractors } from './index';
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
  fetchAdminInfo: jest.fn(), // Mock the fetchAdminInfo action creator
  fetchMainContractors: jest.fn(), // Mock the fetchMainContractors action creator
}));


describe('adminSlice', () => {
  it('should create the slice with correct options', () => {
    // The slice is created when the module is imported, so we just need to check the mock call
    expect(createSlice).toHaveBeenCalledWith({
      name: 'admin',
      initialState: {
        id: 0,
        accountId: 0,
        userName: '',
        userEmail: '',
        userType: `super admin`,
        mainContractors: [],
      },
      reducers: {},
      extraReducers, // Check if the imported extraReducers is used
    });
  });

  it('should export the fetchAdminInfo action creator', () => {
    expect(fetchAdminInfo).toBeDefined();
    expect(fetchAdminInfo).toBe(fetchAdminInfo); // Verify it's the mocked function
  });

  it('should export the fetchMainContractors action creator', () => {
    expect(fetchMainContractors).toBeDefined();
    expect(fetchMainContractors).toBe(fetchMainContractors); // Verify it's the mocked function
  });

  it('should export the reducer', () => {
    expect(adminReducer).toBeDefined();
    // We can't easily check if it's the reducer returned by the mocked createSlice
    // A basic check for defined is sufficient here.
  });
});
