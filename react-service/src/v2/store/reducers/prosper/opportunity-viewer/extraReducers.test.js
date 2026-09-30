import extraReducers, {
  fetchRegions,
  fetchTrades,
  fetchOpportunity,
} from './extraReducers';
import { fetchData, postData } from 'services/helpers';
import { configureStore } from '@reduxjs/toolkit';
import opportunityViewerReducer from './index';

jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
  postData: jest.fn(),
}));

describe('prosper opportunity-viewer extraReducers', () => {
  let initialState;
  let store;

  beforeEach(() => {
    initialState = {
      regions: [],
      trades: [],
      opportunity: null,
      loading: false,
      error: null,
    };
    store = configureStore({
      reducer: {
        opportunityViewer: opportunityViewerReducer,
      },
    });
    fetchData.mockClear();
    postData.mockClear();
  });

  // Test fetchRegions
  describe('fetchRegions', () => {
    it('should handle pending state correctly', () => {
      extraReducers[fetchRegions.pending](initialState);
      expect(initialState).toEqual({
        regions: [],
        trades: [],
        opportunity: null,
        loading: false,
        error: null,
      });
    });

    it('should handle fulfilled state correctly', () => {
      const payload = ['Region A', 'Region B'];
      extraReducers[fetchRegions.fulfilled](initialState, { payload });
      expect(initialState.regions).toEqual(payload);
    });

    it('should handle rejected state correctly', () => {
      extraReducers[fetchRegions.rejected](initialState);
      expect(initialState).toEqual({
        regions: [],
        trades: [],
        opportunity: null,
        loading: false,
        error: null,
      });
    });
  });

  // Test fetchTrades
  describe('fetchTrades', () => {
    it('should handle pending state correctly', () => {
      extraReducers[fetchTrades.pending](initialState);
      expect(initialState).toEqual({
        regions: [],
        trades: [],
        opportunity: null,
        loading: false,
        error: null,
      });
    });

    it('should handle fulfilled state correctly', () => {
      const payload = ['Trade X', 'Trade Y'];
      extraReducers[fetchTrades.fulfilled](initialState, { payload });
      expect(initialState.trades).toEqual(payload);
    });

    it('should handle rejected state correctly', () => {
      extraReducers[fetchTrades.rejected](initialState);
      expect(initialState).toEqual({
        regions: [],
        trades: [],
        opportunity: null,
        loading: false,
        error: null,
      });
    });
  });

  // Test fetchOpportunity
  describe('fetchOpportunity', () => {
    it('should handle pending state correctly', () => {
      extraReducers[fetchOpportunity.pending](initialState);
      expect(initialState).toEqual({
        regions: [],
        trades: [],
        opportunity: null,
        loading: false,
        error: null,
      });
    });

    it('should handle fulfilled state correctly', () => {
      const payload = { id: 1, name: 'Opportunity Z' };
      extraReducers[fetchOpportunity.fulfilled](initialState, { payload });
      expect(initialState.opportunity).toEqual(payload);
    });

    it('should handle rejected state correctly', () => {
      extraReducers[fetchOpportunity.rejected](initialState);
      expect(initialState).toEqual({
        regions: [],
        trades: [],
        opportunity: null,
        loading: false,
        error: null,
      });
    });
  });

  // Test async thunk functions
  describe('async thunk functions', () => {
    it('should fetch regions successfully', async () => {
      const mockData = ['Region A', 'Region B'];
      fetchData.mockResolvedValue({ data: mockData });

      const result = await store.dispatch(fetchRegions('testGroup'));
      
      expect(fetchData).toHaveBeenCalled();
      expect(result.payload).toEqual(mockData);
    });

    it('should fetch trades successfully', async () => {
      const mockData = ['Trade X', 'Trade Y'];
      fetchData.mockResolvedValue({ data: mockData });

      const result = await store.dispatch(fetchTrades());
      
      expect(fetchData).toHaveBeenCalled();
      expect(result.payload).toEqual(mockData);
    });

    it('should fetch opportunity successfully', async () => {
      const mockData = { id: 1, name: 'Test Opportunity' };
      const mockResponse = { json: jest.fn().mockResolvedValue({ data: mockData }) };
      postData.mockResolvedValue(mockResponse);

      const result = await store.dispatch(fetchOpportunity({ query: 'test' }));
      
      expect(postData).toHaveBeenCalled();
      expect(result.payload).toEqual(mockData);
    });
  });
});
