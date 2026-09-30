import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
    fetchTenderInsights,
    createTenderInsights,
} from './extraReducers';

const initialState = {
    insights: {},
};

const tenderInsightsSlice = createSlice({
    name: 'tenderInsights',
    initialState,
    reducers: {
        clearInsights(state, action) {
            const { tenderId } = action.payload || {};
            if (tenderId) {
                delete state.insights[tenderId];
            } else {
                state.insights = {};
            }
        },
    },
    extraReducers,
});

export const { clearInsights } = tenderInsightsSlice.actions;
export { fetchTenderInsights, createTenderInsights };
export default tenderInsightsSlice.reducer;
