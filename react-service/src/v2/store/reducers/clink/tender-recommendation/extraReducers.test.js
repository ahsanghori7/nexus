const reducersModule = require('v2/store/reducers/clink/tender-recommendation/extraReducers');

const reducers = reducersModule.default;

describe('tender recommendation extra reducers', () => {
  it('updates state for fulfilled actions', () => {
    const state = {
      recommendations: [],
      tenderRecommendationForm: null,
      tenderRecommendationById: { id: 1, value: 'old' },
      pricingSummary: [{ transaction_id: 5, forecast: 0 }],
    };

    reducers[reducersModule.getTenderRecommendations.fulfilled](state, {
      payload: ['item'],
    });
    expect(state.recommendations).toEqual(['item']);

    reducers[reducersModule.createTenderRecommendationForm.fulfilled](state, {
      payload: { id: 2 },
    });
    expect(state.tenderRecommendationForm).toEqual({ id: 2 });

    reducers[reducersModule.getTenderRecommendationById.fulfilled](state, {
      payload: { id: 3 },
    });
    expect(state.tenderRecommendationById).toEqual({ id: 3 });

    reducers[reducersModule.updateTenderRecommendationById.fulfilled](state, {
      payload: { value: 'new' },
    });
    expect(state.tenderRecommendationById).toEqual({ id: 3, value: 'new' });

    reducers[reducersModule.getTenderRecommendationPricingSummary.fulfilled](
      state,
      { payload: [{ transaction_id: 5 }] },
    );
    expect(state.pricingSummary).toEqual([{ transaction_id: 5 }]);

    reducers[reducersModule.updateTenderRecommendationPricingSummary.fulfilled](
      state,
      {
        meta: { arg: { transaction_id: 5, data: { forecast: 100 } } },
      },
    );
    expect(state.pricingSummary).toEqual([
      { transaction_id: 5, forecast: 100 },
    ]);
  });

  it('executes no-op reducers without throwing', () => {
    const state = {};
    const payload = { payload: null, meta: { arg: {} } };
    Object.values(reducers).forEach((reducer) => {
      if (typeof reducer === 'function') {
        reducer(state, payload);
      }
    });
  });
});

describe('tender recommendation extra reducers - edge cases', () => {
  it('merges meta.arg.data and payload with correct precedence in updateTenderRecommendationById.fulfilled', () => {
    const state = {
      tenderRecommendationById: { existing: true, a: 1 },
    };

    reducers[reducersModule.updateTenderRecommendationById.fulfilled](state, {
      meta: { arg: { data: { a: 2, b: 3 } } },
      payload: { a: 4, c: 5 },
    });

    // Order in reducer: existing, meta.arg.data, payload => payload wins on conflicts
    expect(state.tenderRecommendationById).toEqual({
      existing: true,
      a: 4,
      b: 3,
      c: 5,
    });
  });

  it('applies only meta.arg.data when payload is undefined in updateTenderRecommendationById.fulfilled', () => {
    const state = {
      tenderRecommendationById: { base: 'ok' },
    };

    reducers[reducersModule.updateTenderRecommendationById.fulfilled](state, {
      meta: { arg: { data: { x: 1, y: 2 } } },
      payload: undefined,
    });

    expect(state.tenderRecommendationById).toEqual({ base: 'ok', x: 1, y: 2 });
  });

  it('updates only the matching transaction_id in pricingSummary', () => {
    const state = {
      pricingSummary: [
        { transaction_id: 1, forecast: 10, keep: 'a' },
        { transaction_id: 2, forecast: 20, keep: 'b' },
        { transaction_id: 3, forecast: 30, keep: 'c' },
      ],
    };

    reducers[reducersModule.updateTenderRecommendationPricingSummary.fulfilled](
      state,
      {
        meta: { arg: { transaction_id: 2, data: { forecast: 99 } } },
      },
    );

    expect(state.pricingSummary).toEqual([
      { transaction_id: 1, forecast: 10, keep: 'a' },
      { transaction_id: 2, forecast: 99, keep: 'b' },
      { transaction_id: 3, forecast: 30, keep: 'c' },
    ]);
  });

  it('does nothing when pricingSummary is undefined or not an array', () => {
    const state1 = { pricingSummary: undefined };
    reducers[reducersModule.updateTenderRecommendationPricingSummary.fulfilled](
      state1,
      {
        meta: { arg: { transaction_id: 123, data: { forecast: 456 } } },
      },
    );
    expect(state1.pricingSummary).toBeUndefined();

    const state2 = { pricingSummary: null };
    reducers[reducersModule.updateTenderRecommendationPricingSummary.fulfilled](
      state2,
      {
        meta: { arg: { transaction_id: 123, data: { forecast: 456 } } },
      },
    );
    expect(state2.pricingSummary).toBeNull();

    const state3 = { pricingSummary: { some: 'object' } };
    reducers[reducersModule.updateTenderRecommendationPricingSummary.fulfilled](
      state3,
      {
        meta: { arg: { transaction_id: 123, data: { forecast: 456 } } },
      },
    );
    expect(state3.pricingSummary).toEqual({ some: 'object' });
  });
});
