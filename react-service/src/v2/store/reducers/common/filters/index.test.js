import filtersReducer, {
  changeFilter,
  changeDates,
  initFilter,
  increaseLoaded,
  resetFilter,
  fetchFilterOptions,
} from './index';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

describe('common filters reducer', () => {
  const initialState = {
    selected: {
      type: null,
      phase: null,
      trades: null,
      regions: null,
      enquiryStatus: null,
      dates: [],
      subscriptions: null,
    },
    list: {
      types: [],
      phase: [],
      selectStatus: [
        { id: 4, label: 'accept-invitation' },
        { id: 2, label: 'decline-invitation' },
      ],
      trades: [],
      regions: [],
      enquiriesStatus: [],
      dates: [],
      subscriptions: [],
    },
    loaded: 6,
  };

  it('should return the initial state', () => {
    expect(filtersReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle undefined state', () => {
    expect(filtersReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('initFilter action', () => {
    it('should initialize filter with default parameters', () => {
      const action = initFilter({
        data: [
          { id: 1, label: 'Filter 1' },
          { id: 2, label: 'Filter 2' },
        ],
        stateFilter: 'types',
      });
      const state = filtersReducer(initialState, action);

      expect(state.list.types).toEqual([
        { id: 1, label: 'Filter 1' },
        { id: 2, label: 'Filter 2' },
      ]);
    });

    it('should initialize filter with custom keys', () => {
      const action = initFilter({
        data: [
          { customId: 1, customLabel: 'Custom Filter 1' },
          { customId: 2, customLabel: 'Custom Filter 2' },
        ],
        stateFilter: 'trades',
        idKey: 'customId',
        labelKey: 'customLabel',
      });
      const state = filtersReducer(initialState, action);

      expect(state.list.trades).toEqual([
        { id: 1, label: 'Custom Filter 1' },
        { id: 2, label: 'Custom Filter 2' },
      ]);
    });

    it('should handle duplicate entries using uniqBy', () => {
      const action = initFilter({
        data: [
          { id: 1, label: 'Filter 1' },
          { id: 2, label: 'Filter 1' }, // Duplicate label
          { id: 3, label: 'Filter 3' },
        ],
        stateFilter: 'regions',
        uniqKey: 'label',
      });
      const state = filtersReducer(initialState, action);

      expect(state.list.regions).toEqual([
        { id: 1, label: 'Filter 1' },
        { id: 3, label: 'Filter 3' },
      ]);
    });

    it('should handle empty data array', () => {
      const action = initFilter({
        data: [],
        stateFilter: 'types',
      });
      const state = filtersReducer(initialState, action);

      expect(state.list.types).toEqual([]);
    });
  });

  describe('changeFilter action', () => {
    it('should set filter when none is selected', () => {
      const filter = { id: 1, label: 'Test Filter' };
      const action = changeFilter({
        filter,
        stateFilter: 'types',
      });
      const state = filtersReducer(initialState, action);

      expect(state.selected.types).toEqual(filter);
    });

    it('should unset filter when same filter is selected', () => {
      const filter = { id: 1, label: 'Test Filter' };
      const currentState = {
        ...initialState,
        selected: {
          ...initialState.selected,
          types: filter,
        },
      };

      const action = changeFilter({
        filter,
        stateFilter: 'types',
      });
      const state = filtersReducer(currentState, action);

      expect(state.selected.types).toBeNull();
    });

    it('should replace filter when different filter is selected', () => {
      const oldFilter = { id: 1, label: 'Old Filter' };
      const newFilter = { id: 2, label: 'New Filter' };
      const currentState = {
        ...initialState,
        selected: {
          ...initialState.selected,
          types: oldFilter,
        },
      };

      const action = changeFilter({
        filter: newFilter,
        stateFilter: 'types',
      });
      const state = filtersReducer(currentState, action);

      expect(state.selected.types).toEqual(newFilter);
    });

    it('should handle null existing filter', () => {
      const filter = { id: 1, label: 'Test Filter' };
      const currentState = {
        ...initialState,
        selected: {
          ...initialState.selected,
          types: null,
        },
      };

      const action = changeFilter({
        filter,
        stateFilter: 'types',
      });
      const state = filtersReducer(currentState, action);

      expect(state.selected.types).toEqual(filter);
    });
  });

  describe('changeDates action', () => {
    it('should set dates filter', () => {
      const dateFilter = ['2023-01-01', '2023-12-31'];
      const action = changeDates({
        filter: dateFilter,
        stateFilter: 'dates',
      });
      const state = filtersReducer(initialState, action);

      expect(state.selected.dates).toEqual(dateFilter);
    });

    it('should replace existing dates filter', () => {
      const oldDates = ['2022-01-01', '2022-12-31'];
      const newDates = ['2023-01-01', '2023-12-31'];
      const currentState = {
        ...initialState,
        selected: {
          ...initialState.selected,
          dates: oldDates,
        },
      };

      const action = changeDates({
        filter: newDates,
        stateFilter: 'dates',
      });
      const state = filtersReducer(currentState, action);

      expect(state.selected.dates).toEqual(newDates);
    });
  });

  describe('increaseLoaded action', () => {
    it('should increase loaded count when current loaded is less than data length', () => {
      const data = new Array(20); // Array with 20 items
      const action = increaseLoaded(data);
      const state = filtersReducer(initialState, action);

      expect(state.loaded).toBe(12); // 6 + 6
    });

    it('should not increase loaded count when current loaded is equal to data length', () => {
      const data = new Array(6); // Array with 6 items
      const action = increaseLoaded(data);
      const state = filtersReducer(initialState, action);

      expect(state.loaded).toBe(6); // No change
    });

    it('should not increase loaded count when current loaded is greater than data length', () => {
      const data = new Array(3); // Array with 3 items
      const action = increaseLoaded(data);
      const state = filtersReducer(initialState, action);

      expect(state.loaded).toBe(6); // No change
    });

    it('should handle multiple increases', () => {
      const data = new Array(25); // Array with 25 items
      let state = filtersReducer(initialState, increaseLoaded(data));
      expect(state.loaded).toBe(12);

      state = filtersReducer(state, increaseLoaded(data));
      expect(state.loaded).toBe(18);

      state = filtersReducer(state, increaseLoaded(data));
      expect(state.loaded).toBe(24);

      state = filtersReducer(state, increaseLoaded(data));
      expect(state.loaded).toBe(30); // Will go beyond data length since implementation doesn't cap it
    });
  });

  describe('resetFilter action', () => {
    it('should reset trades, regions, and types filters to empty arrays', () => {
      const currentState = {
        ...initialState,
        list: {
          ...initialState.list,
          trades: [{ id: 1, label: 'Trade 1' }],
          regions: [{ id: 1, label: 'Region 1' }],
          types: [{ id: 1, label: 'Type 1' }],
          phase: [{ id: 1, label: 'Phase 1' }], // Should not be reset
        },
      };

      const action = resetFilter();
      const state = filtersReducer(currentState, action);

      expect(state.list.trades).toEqual([]);
      expect(state.list.regions).toEqual([]);
      expect(state.list.types).toEqual([]);
      expect(state.list.phase).toEqual([{ id: 1, label: 'Phase 1' }]); // Unchanged
    });

    it('should work when filters are already empty', () => {
      const action = resetFilter();
      const state = filtersReducer(initialState, action);

      expect(state.list.trades).toEqual([]);
      expect(state.list.regions).toEqual([]);
      expect(state.list.types).toEqual([]);
    });
  });

  describe('async thunk exports', () => {
    it('should export fetchFilterOptions thunk', () => {
      expect(fetchFilterOptions).toBeDefined();
      expect(fetchFilterOptions.typePrefix).toBe('company/fetchFilterOptions');
    });
  });

  describe('edge cases', () => {
    it('should handle unknown action type', () => {
      const action = { type: 'unknown/action' };
      const state = filtersReducer(initialState, action);

      expect(state).toEqual(initialState);
    });

    it('should preserve existing state for unknown actions', () => {
      const currentState = {
        ...initialState,
        loaded: 12,
        selected: { ...initialState.selected, types: { id: 1, label: 'Test' } },
      };
      const action = { type: 'unknown/action' };
      const state = filtersReducer(currentState, action);

      expect(state).toEqual(currentState);
    });

    it('should handle initFilter with missing data property', () => {
      const action = initFilter({
        stateFilter: 'types',
      });
      const state = filtersReducer(initialState, action);

      expect(state.list.types).toEqual([]);
    });
  });
});
