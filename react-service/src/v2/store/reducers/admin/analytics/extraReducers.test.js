import extraReducers, { fetchTokens, fetchSupplyChainAnalytics } from './extraReducers';
import { createReducer } from '@reduxjs/toolkit'; // Import createReducer
import { fetchData } from 'services/helpers';
// import produce from 'immer'; // No longer need direct immer import

// Mock dependencies
jest.mock('@reduxjs/toolkit', () => ({
  ...jest.requireActual('@reduxjs/toolkit'),
  createAsyncThunk: jest.fn((type, payloadCreator) => {
    const asyncThunk = {
      pending: `${type}/pending`,
      fulfilled: `${type}/fulfilled`,
      rejected: `${type}/rejected`,
    };
    asyncThunk.type = type;
    asyncThunk.payloadCreator = payloadCreator;
    return asyncThunk;
  }),
  createReducer: jest.requireActual('@reduxjs/toolkit').createReducer, // Use actual createReducer
}));

jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
}));

jest.mock('lodash/random', () => jest.fn((min, max) => (min + max) / 2)); // Mock random to return a predictable value

describe('analytics async thunks', () => {
  it('should call fetchData with the correct arguments and return the data for fetchTokens', async () => {
    const mockQuery = { type: 'issued', token_type: 'paid', interval: 'week' };
    const mockData = { some: 'data' };
    fetchData.mockResolvedValueOnce({ data: mockData });

    const result = await fetchTokens.payloadCreator(mockQuery);

    expect(fetchData).toHaveBeenCalledWith('analytics', mockQuery, 'tokens');
    expect(result).toEqual(mockData);
  });

  it('should call fetchData with the correct arguments and return the data for fetchSupplyChainAnalytics', async () => {
    const mockQuery = { some: 'query' };
    const mockData = { supply_chain: { invite: { total: 10 }, activation: { total: 5 } } };
    fetchData.mockResolvedValueOnce({ data: mockData });

    const result = await fetchSupplyChainAnalytics.payloadCreator(mockQuery);

    expect(fetchData).toHaveBeenCalledWith('analytics', mockQuery, 'actions');
    expect(result).toEqual(mockData);
  });
});

describe('analytics extraReducers', () => {
  let initialState;
  let reducer;

  beforeAll(() => {
    // Create a reducer using createReducer with the extraReducers
    reducer = createReducer(initialState, (builder) => {
      builder
        .addCase(fetchTokens.pending, extraReducers[fetchTokens.pending])
        .addCase(fetchTokens.fulfilled, extraReducers[fetchTokens.fulfilled])
        .addCase(fetchTokens.rejected, extraReducers[fetchTokens.rejected])
        .addCase(fetchSupplyChainAnalytics.pending, extraReducers[fetchSupplyChainAnalytics.pending])
        .addCase(fetchSupplyChainAnalytics.fulfilled, extraReducers[fetchSupplyChainAnalytics.fulfilled])
        .addCase(fetchSupplyChainAnalytics.rejected, extraReducers[fetchSupplyChainAnalytics.rejected]);
    });
  });


  beforeEach(() => {
    initialState = {
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
    };
  });

  it('should handle fetchTokens.pending', () => {
    const action = { type: fetchTokens.pending };
    const newState = reducer(initialState, action);
    expect(newState.status).toBe('loading');
  });

  it('should handle fetchTokens.fulfilled for week graph', () => {
    const mockPayload = {
      '2023-01': { total: { tokens: 100 } },
      '2023-02': { total: { tokens: 150 } },
    };
    const action = {
      type: fetchTokens.fulfilled,
      meta: { arg: { type: 'issued', token_type: 'paid', interval: 'week' } },
      payload: mockPayload,
    };
    const newState = reducer(initialState, action);

    expect(newState.status).toBe('');
    expect(newState.issuedpaidweek.labels).toEqual(['Week 01 (2023)', 'Week 02 (2023)']);
    expect(newState.issuedpaidweek.datasets.length).toBe(1);
    expect(newState.issuedpaidweek.datasets[0].data).toEqual([100, 150]);
    expect(newState.issuedpaidweek.datasets[0].backgroundColor).toBeDefined();
  });

  it('should handle fetchTokens.fulfilled for day graph', () => {
    const mockPayload = {
      '2023-01-01': { date: { day: 1, month: 1, year: 2023 }, data: [{ subcontractor: { name: 'Sub A' }, project_name: 'Project X', tender: { project_id: 1, name: 'Tender 1', label: 'Pack A' }, token_amount: 10, cost: '1000' }] },
      '2023-01-02': { date: { day: 2, month: 1, year: 2023 }, data: [{ subcontractor: { name: 'Sub B' }, project_name: 'Project Y', tender: { project_id: 2, name: 'Tender 2', label: 'Pack B' }, token_amount: 20, cost: '2000' }] },
    };
    const action = {
      type: fetchTokens.fulfilled,
      meta: { arg: { type: 'used', token_type: 'free', interval: 'day' } },
      payload: mockPayload,
    };
    const newState = reducer(initialState, action);

    expect(newState.status).toBe('');
    expect(newState.usedfreeday.length).toBe(2);
    expect(newState.usedfreeday[0].company).toBe('Sub B'); // Ordered in reverse
    expect(newState.usedfreeday[0].date).toBe('2/1/2023');
    expect(newState.usedfreeday[0].tokenAmount).toBe(20);
    expect(newState.usedfreeday[0].cost).toBe('20');
  });

  it('should handle fetchTokens.rejected', () => {
    const action = { type: fetchTokens.rejected };
    const newState = reducer(initialState, action);
    expect(newState.status).toBe('error');
    expect(newState.data).toEqual([]); // Note: The reducer sets state.data, but initial state doesn't have it. This might be a potential issue in the actual reducer.
  });

  it('should handle fetchSupplyChainAnalytics.pending', () => {
    const action = { type: fetchSupplyChainAnalytics.pending };
    const newState = reducer(initialState, action);
    expect(newState.status).toBe('loading');
  });

  it('should handle fetchSupplyChainAnalytics.fulfilled', () => {
    const mockPayload = { supply_chain: { invite: { total: 10 }, activation: { total: 7 } } };
    const action = { type: fetchSupplyChainAnalytics.fulfilled, payload: mockPayload };
    const newState = reducer(initialState, action);

    expect(newState.supplyChain.labels).toEqual(['(70%) Activated', '(30%) Pending']);
    expect(newState.supplyChain.datasets.length).toBe(1);
    expect(newState.supplyChain.datasets[0].data).toEqual([7, 3]);
  });

  it('should handle fetchSupplyChainAnalytics.rejected', () => {
    const action = { type: fetchSupplyChainAnalytics.rejected };
    const newState = reducer(initialState, action);
    expect(newState.status).toBe('error');
    expect(newState.data).toEqual([]); // Note: The reducer sets state.data, but initial state doesn't have it. This might be a potential issue in the actual reducer.
  });
});
