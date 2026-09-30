import { createSlice } from "@reduxjs/toolkit";
import extraReducers, {
    fetchTenderTemplates,
    createTenderTemplate,
    deleteTenderTemplate,
} from "./extraReducers";

const initialState = {
    tenderTemplates: [],
    status: "idle",
    loading: false,
    error: null,
};

const tenderTemplateSlice = createSlice({
    name: "tender_template",
    initialState,
    reducers: {},
    extraReducers,
});

export { fetchTenderTemplates, createTenderTemplate, deleteTenderTemplate };

export default tenderTemplateSlice.reducer;
