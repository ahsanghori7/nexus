import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
  fetchOpportunities,
  fetchSingleProject,
  updateRegisteredProject,
  fetchOpportunitiesByAccount,
} from './extraReducers';

const initialState = {
  project: null,
  projects: [],
  latest: [],
  list: [],
  status: '',
  statusProject: '',
};

const projectsSlice = createSlice({
  name: 'opportunities',
  initialState,
  reducers: {
    saveLatestOnLocal(state, action) {
      const cardItem = action.payload;
      state.latest =
        state.latest && state.latest.length
          ? state.latest.filter((listItem) => listItem.id !== cardItem.id)
          : [];

      let hiddenProjects = [];
      if (localStorage.latest && JSON.parse(localStorage.latest).length) {
        hiddenProjects = JSON.parse(localStorage.latest);
      }

      localStorage.setItem(
        'latest',
        JSON.stringify([...hiddenProjects, cardItem.id])
      );
    },
  },
  extraReducers,
});

export const { saveLatestOnLocal } = projectsSlice.actions;
export {
  fetchOpportunities,
  fetchSingleProject,
  updateRegisteredProject,
  fetchOpportunitiesByAccount,
};
export default projectsSlice.reducer;
