/**
 * @jest-environment node
 */
import reducer, { clearInsights } from './index';

describe('Tender Insights Reducer', () => {
    const initialState = {
        insights: {},
    };

    it('should return the initial state', () => {
        expect(reducer(undefined, {})).toEqual(initialState);
    });

    it('should handle clearInsights for a specific tenderId', () => {
        const state = {
            insights: {
                123: { status: 'success', data: {} },
                456: { status: 'loading' },
            },
        };

        const action = clearInsights({ tenderId: 123 });
        const newState = reducer(state, action);

        expect(newState.insights[123]).toBeUndefined();
        expect(newState.insights[456]).toBeDefined();
        expect(newState.insights[456]).toEqual({ status: 'loading' });
    });

    it('should handle clearInsights for all insights when tenderId is not provided', () => {
        const state = {
            insights: {
                123: { status: 'success', data: {} },
                456: { status: 'loading' },
            },
        };

        const action = clearInsights({});
        const newState = reducer(state, action);

        expect(newState.insights).toEqual({});
    });

    it('should handle clearInsights for all insights when tenderId is undefined', () => {
        const state = {
            insights: {
                123: { status: 'success', data: {} },
                456: { status: 'loading' },
            },
        };

        const action = clearInsights({ tenderId: undefined });
        const newState = reducer(state, action);

        expect(newState.insights).toEqual({});
    });
});
