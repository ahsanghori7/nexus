/**
 * @jest-environment node
 */
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import extraReducers, {
    fetchTenderInsights,
    createTenderInsights,
} from './extraReducers';
import { httpHelperV2 as httpRequest } from 'v2/services/httpHelper';

jest.mock('v2/services/httpHelper');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Tender Insights Async Thunks', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchTenderInsights', () => {
        it('should fetch tender insights successfully without documentId', async () => {
            const mockResponse = {
                keyDates: [{ label: 'PERMISSION DATE', value: '01/02/2025' }],
            };

            httpRequest.mockResolvedValue(mockResponse);

            const store = mockStore({});
            const tenderId = 123;

            await store.dispatch(fetchTenderInsights({ tenderId }));

            const actions = store.getActions();
            expect(actions[0].type).toBe('tenderInsights/fetch/pending');
            expect(actions[1].type).toBe('tenderInsights/fetch/fulfilled');
            expect(actions[1].payload.tenderId).toBe(tenderId);
            expect(actions[1].payload.data).toEqual(mockResponse);
            expect(httpRequest).toHaveBeenCalledWith({
                url: `ai/tender-insights/${tenderId}`,
                method: 'GET',
            });
        });

        it('should fetch tender insights successfully with documentId', async () => {
            const mockResponse = { data: 'test' };
            httpRequest.mockResolvedValue(mockResponse);

            const store = mockStore({});
            const tenderId = 123;
            const documentId = 456;

            await store.dispatch(fetchTenderInsights({ tenderId, documentId }));

            expect(httpRequest).toHaveBeenCalledWith({
                url: `ai/tender-insights/${tenderId}?document_id=${documentId}`,
                method: 'GET',
            });
        });

        it('should handle fetch error', async () => {
            const errorMessage = 'Network error';
            httpRequest.mockRejectedValue(new Error(errorMessage));

            const store = mockStore({});
            const tenderId = 123;

            await store.dispatch(fetchTenderInsights({ tenderId }));

            const actions = store.getActions();
            expect(actions[1].type).toBe('tenderInsights/fetch/rejected');
        });
    });

    describe('createTenderInsights', () => {
        it('should create tender insights successfully without documentId', async () => {
            const mockResponse = {
                keyDates: [{ label: 'PERMISSION DATE', value: '01/02/2025' }],
            };

            httpRequest.mockResolvedValue(mockResponse);

            const store = mockStore({});
            const tenderId = 123;

            await store.dispatch(createTenderInsights({ tenderId }));

            const actions = store.getActions();
            expect(actions[0].type).toBe('tenderInsights/create/pending');
            expect(actions[1].type).toBe('tenderInsights/create/fulfilled');
            expect(httpRequest).toHaveBeenCalledWith({
                url: `ai/tender-insights/${tenderId}`,
                method: 'POST',
            });
        });

        it('should create tender insights successfully with documentId', async () => {
            const mockResponse = { data: 'test' };
            httpRequest.mockResolvedValue(mockResponse);

            const store = mockStore({});
            const tenderId = 123;
            const documentId = 456;

            await store.dispatch(createTenderInsights({ tenderId, documentId }));

            expect(httpRequest).toHaveBeenCalledWith({
                url: `ai/tender-insights/${tenderId}?document_id=${documentId}`,
                method: 'POST',
            });
        });
    });

    describe('Reducers', () => {
        let initialState;

        beforeEach(() => {
            initialState = {
                insights: {},
            };
        });

        it('should handle fetchTenderInsights.pending', () => {
            const action = {
                type: fetchTenderInsights.pending.type,
                meta: { arg: { tenderId: 123 } },
            };
            const expectedState = {
                insights: {
                    123: { status: 'loading', error: null },
                },
            };

            // Allow mutation for Immer
            const nextState = { ...initialState };
            extraReducers[fetchTenderInsights.pending](nextState, action);
            expect(nextState).toEqual(expectedState);
        });

        it('should handle fetchTenderInsights.fulfilled with valid insights', () => {
            const mockData = {
                headline_dates: { some: 'date' },
            };
            const action = {
                type: fetchTenderInsights.fulfilled.type,
                payload: { tenderId: 123, data: mockData },
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[fetchTenderInsights.fulfilled](nextState, action);

            expect(nextState.insights[123]).toEqual({
                data: mockData,
                files: null,
                timestamp: undefined,
                status: 'success',
                error: null,
            });
        });

        it('should handle fetchTenderInsights.fulfilled with invalid insights but PENDING status', () => {
            const mockData = { status: 'PENDING' };
            const action = {
                type: fetchTenderInsights.fulfilled.type,
                payload: { tenderId: 123, data: mockData },
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[fetchTenderInsights.fulfilled](nextState, action);

            expect(nextState.insights[123].status).toBe('PENDING');
            expect(nextState.insights[123].error).toBeNull();
        });

        it('should handle fetchTenderInsights.fulfilled with invalid insights (error state)', () => {
            const mockData = { some: 'garbage' }; // No valid sections
            const action = {
                type: fetchTenderInsights.fulfilled.type,
                payload: { tenderId: 123, data: mockData },
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[fetchTenderInsights.fulfilled](nextState, action);

            expect(nextState.insights[123].status).toBe('error');
            expect(nextState.insights[123].error).toBe('No insights were generated from the tender document.');
        });

        it('should handle fetchTenderInsights.rejected', () => {
            const action = {
                type: fetchTenderInsights.rejected.type,
                meta: { arg: { tenderId: 123 } },
                error: { message: 'Fetch failed' },
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[fetchTenderInsights.rejected](nextState, action);

            expect(nextState.insights[123].status).toBe('error');
            expect(nextState.insights[123].error).toBe('Fetch failed');
        });

        it('should handle fetchTenderInsights.fulfilled with invalid insights but STARTED status', () => {
            const mockData = { status: 'STARTED' };
            const action = {
                type: fetchTenderInsights.fulfilled.type,
                payload: { tenderId: 123, data: mockData },
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[fetchTenderInsights.fulfilled](nextState, action);

            expect(nextState.insights[123].status).toBe('PENDING');
            expect(nextState.insights[123].error).toBeNull();
        });

        it('should handle fetchTenderInsights.fulfilled with data.result.data structure', () => {
            const mockData = {
                result: { data: { payment_terms: { key: 'value' } } },
                completed_at: '2025-01-15T10:00:00Z',
            };
            const action = {
                type: fetchTenderInsights.fulfilled.type,
                payload: { tenderId: 123, data: mockData },
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[fetchTenderInsights.fulfilled](nextState, action);

            expect(nextState.insights[123]).toEqual({
                data: { payment_terms: { key: 'value' } },
                files: null,
                timestamp: '2025-01-15T10:00:00Z',
                status: 'success',
                error: null,
            });
        });

        it('should handle fetchTenderInsights.rejected with fallback when error has no message', () => {
            const action = {
                type: fetchTenderInsights.rejected.type,
                meta: { arg: { tenderId: 123 } },
                error: {},
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[fetchTenderInsights.rejected](nextState, action);

            expect(nextState.insights[123].status).toBe('error');
            expect(nextState.insights[123].error).toBe('Failed to fetch tender insights');
        });

        it('should handle createTenderInsights.pending', () => {
            const action = {
                type: createTenderInsights.pending.type,
                meta: { arg: { tenderId: 123 } },
            };
            const nextState = { ...initialState };
            extraReducers[createTenderInsights.pending](nextState, action);
            expect(nextState.insights[123].status).toBe('creating');
        });

        it('should handle createTenderInsights.fulfilled with valid insights', () => {
            const mockData = {
                scope_of_works: { description: 'test scope' },
            };
            const action = {
                type: createTenderInsights.fulfilled.type,
                payload: { tenderId: 123, data: mockData, timestamp: '2025-01-15T12:00:00Z' },
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[createTenderInsights.fulfilled](nextState, action);

            expect(nextState.insights[123]).toEqual({
                data: mockData,
                files: null,
                timestamp: '2025-01-15T12:00:00Z',
                status: 'success',
                error: null,
            });
        });

        it('should handle createTenderInsights.fulfilled with invalid insights but PENDING status', () => {
            const mockData = { status: 'PENDING' };
            const action = {
                type: createTenderInsights.fulfilled.type,
                payload: { tenderId: 123, data: mockData },
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[createTenderInsights.fulfilled](nextState, action);

            expect(nextState.insights[123].status).toBe('PENDING');
            expect(nextState.insights[123].error).toBeNull();
        });

        it('should handle createTenderInsights.fulfilled with invalid insights but STARTED status', () => {
            const mockData = { status: 'STARTED' };
            const action = {
                type: createTenderInsights.fulfilled.type,
                payload: { tenderId: 123, data: mockData },
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[createTenderInsights.fulfilled](nextState, action);

            expect(nextState.insights[123].status).toBe('PENDING');
            expect(nextState.insights[123].error).toBeNull();
        });

        it('should handle createTenderInsights.fulfilled with invalid insights (error state)', () => {
            const mockData = { other: 'data' };
            const action = {
                type: createTenderInsights.fulfilled.type,
                payload: { tenderId: 123, data: mockData },
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[createTenderInsights.fulfilled](nextState, action);

            expect(nextState.insights[123].status).toBe('error');
            expect(nextState.insights[123].error).toBe('No insights were generated from the tender document.');
        });

        it('should handle createTenderInsights.rejected', () => {
            const action = {
                type: createTenderInsights.rejected.type,
                meta: { arg: { tenderId: 123 } },
                error: { message: 'Create failed' },
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[createTenderInsights.rejected](nextState, action);

            expect(nextState.insights[123].status).toBe('error');
            expect(nextState.insights[123].error).toBe('Create failed');
        });

        it('should handle createTenderInsights.rejected with fallback when error has no message', () => {
            const action = {
                type: createTenderInsights.rejected.type,
                meta: { arg: { tenderId: 123 } },
                error: {},
            };

            const nextState = { ...initialState, insights: { 123: {} } };
            extraReducers[createTenderInsights.rejected](nextState, action);

            expect(nextState.insights[123].status).toBe('error');
            expect(nextState.insights[123].error).toBe('Failed to create tender insights');
        });
    });
});
