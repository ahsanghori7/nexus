import { createSlice } from '@reduxjs/toolkit';
import uniqBy from 'lodash/uniqBy';
import i18next from 'v2/helpers/i18n';
import extraReducers, { fetchFilterOptions } from './extraReducers';

const selectStatusLabels = {
  4: i18next.t('accept-invitation'),
  2: i18next.t('decline-invitation'),
};

const N_CARDS_TO_SHOW = 6;
const selectStatusIds = [4, 2];
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
    selectStatus: selectStatusIds.map((id) => ({
      id,
      label: selectStatusLabels[id],
    })),
    trades: [],
    regions: [],
    enquiriesStatus: [],
    dates: [],
    subscriptions: [],
  },
  loaded: N_CARDS_TO_SHOW,
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  extraReducers,
  reducers: {
    initFilter(state, action) {
      const {
        data = [],
        stateFilter,
        idKey = 'id',
        labelKey = 'label',
        uniqKey = 'label',
      } = action.payload;

      state.list[stateFilter] = uniqBy(
        data.map((i) => ({ id: i[idKey], label: i[labelKey] })),
        uniqKey
      );
    },
    changeFilter(state, action) {
      const { filter, stateFilter } = action.payload;
      if (
        state.selected[stateFilter] &&
        state.selected[stateFilter].label === filter.label
      ) {
        state.selected[stateFilter] = null;
      } else {
        state.selected[stateFilter] = filter;
      }
    },
    changeDates(state, action) {
      const { filter, stateFilter } = action.payload;
      state.selected[stateFilter] = filter;
    },
    increaseLoaded(state, action) {
      const data = action.payload;
      if (state.loaded < data.length) {
        state.loaded += N_CARDS_TO_SHOW;
      }
    },
    resetFilter(state) {
      state.list.trades = [];
      state.list.regions = [];
      state.list.types = [];
    },
  },
});

export { fetchFilterOptions };
export const {
  changeFilter,
  changeDates,
  initFilter,
  increaseLoaded,
  resetFilter,
} = filtersSlice.actions;
export default filtersSlice.reducer;
