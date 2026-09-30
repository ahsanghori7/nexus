import {
    fetchTenderTemplates,
    createTenderTemplate,
    deleteTenderTemplate,
} from "./asyncThunk";

const tenderTemplatesReducers = {
    [fetchTenderTemplates.pending]: (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
    },
    [fetchTenderTemplates.fulfilled]: (state, { payload }) => {
        state.status = "succeeded";
        state.loading = false;
        state.tenderTemplates = payload?.data || payload || [];
    },
    [fetchTenderTemplates.rejected]: (state, action) => {
        state.status = "error";
        state.loading = false;
        state.tenderTemplates = [];
        state.error = action.error?.message || "Failed to fetch templates";
    },

    [createTenderTemplate.pending]: (state) => {
        state.status = "creating";
        state.error = null;
    },
    [createTenderTemplate.fulfilled]: (state, { payload }) => {
        state.status = "succeeded";
        if (payload?.success) {
            state.tenderTemplates.push(payload.data || payload);
        }
    },
    [createTenderTemplate.rejected]: (state, action) => {
        state.status = "error";
        state.error = action.error?.message || "Failed to create template";
    },

    [deleteTenderTemplate.pending]: (state) => {
        state.status = "deleting";
        state.error = null;
    },
    [deleteTenderTemplate.fulfilled]: (state, action) => {
        state.status = "succeeded";
        if (action.payload?.success) {
            const deletedId = action.meta.arg.did;
            state.tenderTemplates = state.tenderTemplates.filter(
                (t) => String(t.id) !== String(deletedId)
            );
        }
    },
    [deleteTenderTemplate.rejected]: (state, action) => {
        state.status = "error";
        state.error = action.error?.message || "Failed to delete template";
    },
};

export default tenderTemplatesReducers;

export {
    fetchTenderTemplates,
    createTenderTemplate,
    deleteTenderTemplate,
};
