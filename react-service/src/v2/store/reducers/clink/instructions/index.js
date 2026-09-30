import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
  fetchInstructions,
  fetchInstruction,
  fetchStatus,
  fetchType,
  fetchSubcontractors,
  deleteInstruction,
  fetchForecastList,
  createInstruction,
  updateInstruction,
} from './extraReducers';

const initialState = {
  status: 'loading',
  blocked: false,
  data: null,
  list: [],
  statusList: [],
  typeList: [],
  subcontractorsList: [],
  forecastList: [],
  editMode: false,
  sentSuccessfully: false,
};

const instructionsSlice = createSlice({
  name: 'instructions',
  initialState,
  reducers: {
    changeBudget(state, action) {
      const { budget, tid } = action.payload;
      const forecastList = state.forecastList.map((elem) => {
        if (elem.tid === tid) {
          return {
            ...elem,
            budget: budget / 100,
          };
        }
        return { ...elem };
      });
      forecastList.pop();
      const totalRow = {
        tid: 0,
        package: 'TOTALS',
        order: 0,
        variations: 0,
        omissions: 0,
        budget: 0,
        total: 0,
        end: true,
      };
      forecastList.forEach((i) => {
        totalRow.order += Number(i.order);
        totalRow.variations += Number(i.variations);
        totalRow.omissions += Number(i.omissions);
        totalRow.budget += Number(i.budget);
        totalRow.total += Number(i.total);
      });
      state.forecastList = [...forecastList, totalRow];
    },
    blockAccess(state) {
      state.blocked = true;
    },
    changeInstructionStatus(state, action) {
      state.status = action.payload;
    },
    resetInstruction(state) {
      state.data = null;
    },
  },
  extraReducers,
});

export const {
  changeBudget,
  blockAccess,
  changeInstructionStatus,
  resetInstruction,
} = instructionsSlice.actions;
export {
  fetchInstructions,
  fetchInstruction,
  fetchStatus,
  fetchType,
  fetchSubcontractors,
  deleteInstruction,
  fetchForecastList,
  createInstruction,
  updateInstruction,
};
export default instructionsSlice.reducer;
