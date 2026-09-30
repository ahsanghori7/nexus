import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  breadcrumbs: [],
  slugHack: false,
  projectNameHack: false,
  projectLoaded: false,
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    setBreadcrumbs(state, action) {
      state.breadcrumbs = action.payload;
    },
    setSlug(state, action) {
      state.slugHack = action.payload;
    },
    setProjectName(state, action) {
      state.projectNameHack = action.payload;
    },
    setLoaded(state, action) {
      const { key, value } = action.payload;
      state[key] = value;
    },
  },
  extraReducers: {},
});

export const { setBreadcrumbs, setSlug, setProjectName, setLoaded } =
  layoutSlice.actions;
export default layoutSlice.reducer;
