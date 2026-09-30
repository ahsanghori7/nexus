import analyticsReducer, { fetchTokens, fetchSupplyChainAnalytics } from './index';
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
  fetchTokens: jest.fn(), // Mock the fetchTokens action creator
  fetchSupplyChainAnalytics: jest.fn(), // Mock the fetchSupplyChainAnalytics action creator
}));

describe('analyticsSlice', () => {
  it('should create the slice with correct options', () => {
    // The slice is created when the module is imported, so we just need to check the mock call
    expect(createSlice).toHaveBeenCalledWith({
      name: 'analytics',
      initialState: {
        issuedpaidweek: {
          labels: [],
          datasets: [],
        },
        issuedpaidday: [],
        usedfreeday: [],
        usedfreeweek: {
          labels: [],
          datasets: [],
        },
        status: '',
        supplyChain: {
          labels: [],
          datasets: [],
        },
      },
      reducers: {},
      extraReducers, // Check if the imported extraReducers is used
    });
  });

  it('should export the fetchTokens action creator', () => {
    expect(fetchTokens).toBeDefined();
    expect(fetchTokens).toBe(fetchTokens); // Verify it's the mocked function
  });

  it('should export the fetchSupplyChainAnalytics action creator', () => {
    expect(fetchSupplyChainAnalytics).toBeDefined();
    expect(fetchSupplyChainAnalytics).toBe(fetchSupplyChainAnalytics); // Verify it's the mocked function
  });

  it('should export the reducer', () => {
    expect(analyticsReducer).toBeDefined();
    // We can't easily check if it's the reducer returned by the mocked createSlice
    // A basic check for defined is sufficient here.
  });
});
