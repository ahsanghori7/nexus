import { createSlice } from '@reduxjs/toolkit';
import status from 'store/reducers/common/constants';
import extraReducers, {
  fetchProjects,
  fetchStatusList,
  changeStatus,
} from './extraReducers';

const initialState = {
  list: [],
  status: { severity: '', message: '', type: status.IDLE_STATUS },
  statusList: [],
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {},
  extraReducers,
});

export { fetchProjects, fetchStatusList, changeStatus };
export default projectsSlice.reducer;
