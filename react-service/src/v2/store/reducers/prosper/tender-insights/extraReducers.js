import { createAsyncThunk } from '@reduxjs/toolkit';
import { httpHelperV2 as httpRequest } from 'v2/services/httpHelper';

const fetchTenderInsights = createAsyncThunk(
    'tenderInsights/fetch',
    async ({ tenderId, documentId = null }) => {
        const url = documentId
            ? `ai/tender-insights/${tenderId}?document_id=${documentId}`
            : `ai/tender-insights/${tenderId}`;

        const response = await httpRequest({
            url,
            method: 'GET',
        });

        return {
            tenderId,
            data: response,
            timestamp: new Date().toISOString(),
        };
    }
);

const createTenderInsights = createAsyncThunk(
    'tenderInsights/create',
    async ({ tenderId, documentId = null }) => {
        const url = documentId
            ? `ai/tender-insights/${tenderId}?document_id=${documentId}`
            : `ai/tender-insights/${tenderId}`;

        const response = await httpRequest({
            url,
            method: 'POST',
        });

        return {
            tenderId,
            data: response,
        };
    }
);

export default {
    [fetchTenderInsights.pending]: (state, { meta }) => {
        const { tenderId } = meta.arg;
        state.insights[tenderId] = {
            ...state.insights[tenderId],
            status: 'loading',
            error: null,
        };
    },
    [fetchTenderInsights.fulfilled]: (state, { payload }) => {
        const { tenderId, data } = payload;

        const hasValidInsights = () => {
            if (!data) return false;

            const insightsData = data.result?.data || data.data || data;

            if (!insightsData) return false;

            const sections = [
                insightsData.headline_dates,
                insightsData.payment_terms,
                insightsData.contractual_risks,
                insightsData.warnings_notes,
                insightsData.insurances,
                insightsData.scope_attendances,
                insightsData.dayworks,
                insightsData.health_safety_site_rules,
                insightsData.tender_submission_requirements,
                insightsData.scope_of_works,
            ];

            const hasInsights = sections.some(section => {
                if (!section) return false;
                return typeof section === 'object' && Object.keys(section).length > 0;
            });

            return hasInsights;
        };

        if (!hasValidInsights()) {
            if (data.status && (data.status === 'PENDING' || data.status === 'STARTED')){
                state.insights[tenderId] = {
                    ...state.insights[tenderId],
                    status: 'PENDING',
                    error: null,
                };

            } else {
                state.insights[tenderId] = {
                    ...state.insights[tenderId],
                    status: 'error',
                    error: 'No insights were generated from the tender document.',
                };
            }
        } else {
            const insightsData = data.result?.data || data.data || data;
            const files = data.files || data.result?.files || null;

            state.insights[tenderId] = {
                data: insightsData,
                files,
                timestamp: data.completed_at,
                status: 'success',
                error: null,
            };
        }
    },
    [fetchTenderInsights.rejected]: (state, { meta, error }) => {
        const { tenderId } = meta.arg;
        state.insights[tenderId] = {
            ...state.insights[tenderId],
            status: 'error',
            error: error.message || 'Failed to fetch tender insights',
        };
    },
    [createTenderInsights.pending]: (state, { meta }) => {
        const { tenderId } = meta.arg;
        state.insights[tenderId] = {
            ...state.insights[tenderId],
            status: 'creating',
            error: null,
        };
    },
    [createTenderInsights.fulfilled]: (state, { payload }) => {
        const { tenderId, data, timestamp } = payload;

        const hasValidInsights = () => {
            if (!data) return false;

            const insightsData = data.result?.data || data.data || data;

            if (!insightsData) return false;

            const sections = [
                insightsData.headline_dates,
                insightsData.payment_terms,
                insightsData.contractual_risks,
                insightsData.warnings_notes,
                insightsData.insurances,
                insightsData.scope_attendances,
                insightsData.dayworks,
                insightsData.health_safety_site_rules,
                insightsData.tender_submission_requirements,
                insightsData.scope_of_works,
            ];

            const hasInsights = sections.some(section => {
                if (!section) return false;
                return typeof section === 'object' && Object.keys(section).length > 0;
            });

            return hasInsights;
        };

        if (!hasValidInsights()) {
            if (data.status && data.status === 'PENDING' || data.status === 'STARTED') {
                state.insights[tenderId] = {
                    ...state.insights[tenderId],
                    status: 'PENDING',
                    error: null,
                };

            } else {
                state.insights[tenderId] = {
                    ...state.insights[tenderId],
                    status: 'error',
                    error: 'No insights were generated from the tender document.',
                };
            }
        } else {
            const insightsData = data.result?.data || data.data || data;
            const files = data.files || data.result?.files || null;

            state.insights[tenderId] = {
                data: insightsData,
                files,
                timestamp,
                status: 'success',
                error: null,
            };
        }
    },
    [createTenderInsights.rejected]: (state, { meta, error }) => {
        const { tenderId } = meta.arg;
        state.insights[tenderId] = {
            ...state.insights[tenderId],
            status: 'error',
            error: error.message || 'Failed to create tender insights',
        };
    },
};

export { fetchTenderInsights, createTenderInsights };
