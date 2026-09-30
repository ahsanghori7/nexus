import { configureStore } from '@reduxjs/toolkit';
import extraReducers, { fetchSubscriptions, changeSubscription } from './extraReducers';
import status from 'store/reducers/common/constants';
import { fetchData, patchData } from 'services/helpers';

// Mock the services
jest.mock('services/helpers');

const mockFetchData = fetchData;
const mockPatchData = patchData;

describe('common subscription extraReducers', () => {
  const initialState = { subscriptionsList: [], status: null };
  
  beforeEach(() => {
    // Reset mocks
    mockFetchData.mockClear();
    mockPatchData.mockClear();
  });

  describe('fetchSubscriptions', () => {
    it('should create fetchSubscriptions action with correct type and payload function', () => {
      const website = 'test-website';
      const action = fetchSubscriptions({ website });
      expect(action).toBeDefined();
      expect(typeof action).toBe('function'); // It's a thunk function
    });

    it('should handle fetchSubscriptions.pending', () => {
      const state = { subscriptionsList: ['existing'], status: null };
      const action = { type: fetchSubscriptions.pending.type };
      
      const reducer = extraReducers[fetchSubscriptions.pending.type];
      expect(reducer).toBeDefined();
      
      const result = reducer(state, action);
      expect(result).toBe(undefined); // This reducer returns undefined (no change)
    });

    it('should handle fetchSubscriptions.fulfilled with payload', () => {
      const state = { subscriptionsList: [], status: null };
      const payload = [{ id: 1, name: 'Test Subscription' }];
      const action = { type: fetchSubscriptions.fulfilled.type, payload };
      
      const reducer = extraReducers[fetchSubscriptions.fulfilled.type];
      reducer(state, action);
      
      expect(state.subscriptionsList).toEqual(payload);
    });

    it('should handle fetchSubscriptions.fulfilled with null payload', () => {
      const state = { subscriptionsList: ['existing'], status: null };
      const action = { type: fetchSubscriptions.fulfilled.type, payload: null };
      
      const reducer = extraReducers[fetchSubscriptions.fulfilled.type];
      reducer(state, action);
      
      expect(state.subscriptionsList).toEqual([]);
    });

    it('should handle fetchSubscriptions.rejected', () => {
      const state = { subscriptionsList: ['existing'], status: null };
      const action = { type: fetchSubscriptions.rejected.type };
      
      const reducer = extraReducers[fetchSubscriptions.rejected.type];
      reducer(state, action);
      
      expect(state.subscriptionsList).toEqual([]);
    });
  });

  describe('changeSubscription', () => {
    it('should create changeSubscription action with correct type and payload function', () => {
      const params = { aid: '123', sid: '456', extraData: {} };
      const action = changeSubscription(params);
      expect(action).toBeDefined();
      expect(typeof action).toBe('function'); // It's a thunk function
    });

    it('should handle changeSubscription.pending', () => {
      const state = { subscriptionsList: [], status: null };
      const action = { type: changeSubscription.pending.type };
      
      const reducer = extraReducers[changeSubscription.pending.type];
      reducer(state, action);
      
      expect(state.status).toEqual({
        severity: 'info',
        message: 'Updating subscription',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle changeSubscription.fulfilled', () => {
      const state = { 
        subscriptionsList: [], 
        status: { severity: 'info', message: 'Updating subscription', type: status.LOADING_STATUS }
      };
      const action = { type: changeSubscription.fulfilled.type };
      
      const reducer = extraReducers[changeSubscription.fulfilled.type];
      reducer(state, action);
      
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle changeSubscription.rejected', () => {
      const state = { 
        subscriptionsList: [], 
        status: { severity: 'info', message: 'Updating subscription', type: status.LOADING_STATUS }
      };
      const action = { type: changeSubscription.rejected.type };
      
      const reducer = extraReducers[changeSubscription.rejected.type];
      reducer(state, action);
      
      expect(state.status).toEqual({
        severity: 'error',
        message: 'FAILURE Updating subscription',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('async thunk functionality', () => {
    it('should call fetchData with correct parameters for fetchSubscriptions', async () => {
      const mockResponse = { data: [{ id: 1, name: 'Test' }] };
      mockFetchData.mockResolvedValue(mockResponse);

      const website = 'test-website';
      const thunk = fetchSubscriptions({ website });
      
      // Test the thunk function directly
      const dispatch = jest.fn();
      const getState = jest.fn();
      
      const result = await thunk(dispatch, getState, undefined);
      
      expect(result.payload).toEqual(mockResponse.data);
      expect(result.type).toBe('subscription/fetchSubscriptions/fulfilled');
      expect(mockFetchData).toHaveBeenCalledWith('account/subscription/test-website');
    });

    it('should call patchData with correct parameters for changeSubscription', async () => {
      const mockJsonResponse = { success: true };
      const mockResponse = { json: () => Promise.resolve(mockJsonResponse) };
      mockPatchData.mockResolvedValue(mockResponse);

      const params = { aid: '123', sid: '456', extraData: { test: 'data' } };
      const thunk = changeSubscription(params);
      
      // Test the thunk function directly
      const dispatch = jest.fn();
      const getState = jest.fn();
      
      const result = await thunk(dispatch, getState, undefined);
      
      expect(result.payload).toEqual(mockJsonResponse);
      expect(result.type).toBe('subscription/changeSubscription/fulfilled');
      expect(mockPatchData).toHaveBeenCalledWith(
        'account',
        { test: 'data' },
        'update_subscription/123/456'
      );
    });

    it('should handle empty extraData for changeSubscription', async () => {
      const mockJsonResponse = { success: true };
      const mockResponse = { json: () => Promise.resolve(mockJsonResponse) };
      mockPatchData.mockResolvedValue(mockResponse);

      const params = { aid: '123', sid: '456' };
      const thunk = changeSubscription(params);
      
      // Test the thunk function directly
      const dispatch = jest.fn();
      const getState = jest.fn();
      
      const result = await thunk(dispatch, getState, undefined);
      
      expect(result.payload).toEqual(mockJsonResponse);
      expect(result.type).toBe('subscription/changeSubscription/fulfilled');
      expect(mockPatchData).toHaveBeenCalledWith(
        'account',
        {},
        'update_subscription/123/456'
      );
    });
  });

  describe('extraReducers object', () => {
    it('should have all required reducers', () => {
      expect(extraReducers[fetchSubscriptions.pending.type]).toBeDefined();
      expect(extraReducers[fetchSubscriptions.fulfilled.type]).toBeDefined();
      expect(extraReducers[fetchSubscriptions.rejected.type]).toBeDefined();
      expect(extraReducers[changeSubscription.pending.type]).toBeDefined();
      expect(extraReducers[changeSubscription.fulfilled.type]).toBeDefined();
      expect(extraReducers[changeSubscription.rejected.type]).toBeDefined();
    });

    it('should export fetchSubscriptions and changeSubscription', () => {
      expect(fetchSubscriptions).toBeDefined();
      expect(changeSubscription).toBeDefined();
      expect(typeof fetchSubscriptions).toBe('function');
      expect(typeof changeSubscription).toBe('function');
    });
  });
});
