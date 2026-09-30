import extraReducers, { fetchActivities } from './extraReducers';
import { fetchData } from 'services/helpers';
import sortBy from 'lodash/sortBy';
import orderBy from 'lodash/orderBy';
import i18next from 'v2/helpers/i18n';
import status from 'store/reducers/common/constants';
import * as immer from 'immer'; // Import immer with wildcard

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
}));

jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
}));

jest.mock('lodash/sortBy', () => jest.fn((arr) => arr)); // Mock sortBy to return the array as is
jest.mock('lodash/orderBy', () => jest.fn((arr) => arr)); // Mock orderBy to return the array as is

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key), // Mock i18next.t to return the key
}));

jest.mock('store/reducers/common/constants', () => ({
  __esModule: true,
  default: {
    LOADING_STATUS: 'loading',
    IDLE_STATUS: 'idle',
    FAILURE_STATUS: 'failure',
  },
}));


describe('fetchActivities async thunk', () => {
  it('should call fetchData with the correct arguments and return the data', async () => {
    const mockId = 'test-id';
    const mockData = [{ id: 1, name: 'Activity 1' }];
    fetchData.mockResolvedValueOnce({ data: mockData });

    const result = await fetchActivities.payloadCreator(mockId);

    expect(fetchData).toHaveBeenCalledWith(`account/activities/${mockId}`);
    expect(result).toEqual(mockData);
  });
});

describe('activity extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      list: [],
      status: '',
    };
  });

  it('should handle fetchActivities.pending', () => {
    const action = { type: fetchActivities.pending };
    const newState = immer.produce(initialState, (draft) => {
      extraReducers[action.type](draft, action);
    });
    expect(newState.status).toEqual({
      severity: 'info',
      message: 'Loading activities',
      type: status.LOADING_STATUS,
    });
  });

  it('should handle fetchActivities.fulfilled', () => {
    const mockPayload = [
      {
        project: 'Project A',
        package: 'Package 1',
        enquiry_recieved: '2023-01-01',
        interest_registered: '2023-01-05',
        quotes_uploaded: '2023-01-10',
        packaged_awarded_status: '1', // Corresponds to 'unsuccessful'
      },
      {
        project: 'Project B',
        package: 'Package 2',
        enquiry_recieved: '2023-02-01',
        interest_registered: null,
        quotes_uploaded: '2023-02-15',
        packaged_awarded_status: '0', // Corresponds to 'unawarded'
      },
    ];
    const action = { type: fetchActivities.fulfilled, payload: mockPayload };
    const newState = immer.produce(initialState, (draft) => {
      extraReducers[action.type](draft, action);
    });

    expect(newState.status).toEqual({
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    });
    expect(sortBy).toHaveBeenCalled(); // Check if sortBy was called
    expect(orderBy).toHaveBeenCalled(); // Check if orderBy was called
    expect(i18next.t).toHaveBeenCalledWith('unawarded');
    expect(i18next.t).toHaveBeenCalledWith('unsuccessful');
    expect(newState.list.length).toBe(2);
    // Add more specific assertions about the processed list if needed
    expect(newState.list[0].last_activity).toBeDefined();
    expect(newState.list[0].project_package).toBeDefined();
    expect(newState.list[0].packaged_awarded_status).toBeDefined();
  });

  it('should handle fetchActivities.rejected', () => {
    const action = { type: fetchActivities.rejected };
    const newState = immer.produce(initialState, (draft) => {
      extraReducers[action.type](draft, action);
    });
    expect(newState.status).toEqual({
      severity: 'error',
      message: 'Error fetchActivities',
      type: status.FAILURE_STATUS,
    });
  });
});
