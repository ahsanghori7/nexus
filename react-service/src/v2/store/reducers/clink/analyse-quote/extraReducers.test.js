import { produce } from 'immer';
import extraReducers from './extraReducers';
import { analyseFetch, analyseStart } from './asyncThunk';
import { QUOTE_LEVELING } from './analysisTypes';

describe('analyse-quote extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      data: null,
      error: null,
      errorPayload: null,
      currentTender: 0,
      seconds: -1,
      tenderJobsByPackageId: {},
      tenderErrorsByPackageId: {},
      tenderErrorPayloadsByPackageId: {},
      tenderSecondsByPackageId: {},
      quoteLevelingData: null,
      quoteLevelingError: null,
      quoteLevelingErrorPayload: null,
      quoteLevelingSeconds: -1,
      quoteLevelingJobsByPackageId: {},
      quoteLevelingErrorsByPackageId: {},
      quoteLevelingErrorPayloadsByPackageId: {},
      quoteLevelingSecondsByPackageId: {},
    };
  });

  // Test analyseFetch.pending
  it('should handle analyseFetch.pending without state change', () => {
    const action = { type: analyseFetch.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseFetch.pending.type](draft, action);
    });
    expect(state).toEqual(initialState);
  });

  // Test analyseFetch.fulfilled
  it('should handle analyseFetch.fulfilled correctly', () => {
    const mockPayload = {
      analysis_id: 958,
      current_step: 6,
      package_id: 57263,
      status: 'STARTED',
      total_steps: 7,
    };
    const action = {
      type: analyseFetch.fulfilled.type,
      payload: mockPayload,
      meta: { arg: { tid: 57263 } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseFetch.fulfilled.type](draft, action);
    });
    expect(state.data).toEqual(mockPayload);
    expect(state.tenderJobsByPackageId[57263]).toEqual(mockPayload);
    expect(state.error).toBeNull();
    expect(state.errorPayload).toBeNull();
  });

  // Test analyseFetch.rejected
  it('should handle analyseFetch.rejected correctly', () => {
    const mockError = new Error('Failed to fetch analysis');
    const action = {
      type: analyseFetch.rejected.type,
      error: mockError,
      meta: { arg: { tid: 57263 } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseFetch.rejected.type](draft, action);
    });
    expect(state.data).toBeNull();
    expect(state.tenderErrorsByPackageId[57263]).toBe(mockError.message);
    expect(state.tenderErrorPayloadsByPackageId[57263]).toBeUndefined();
    expect(state.tenderSecondsByPackageId[57263]).toBeUndefined();
    expect(state.seconds).toBe(-1);
  });

  it('should ignore analyseFetch 404 and leave package without error', () => {
    localStorage.setItem('quoteLeveling', JSON.stringify([44410, 99999]));
    const staleJob = { status: 'PENDING', package_id: 44410 };
    const action = {
      type: analyseFetch.rejected.type,
      error: { message: 'Not Found' },
      meta: { arg: { tid: 44410, type: QUOTE_LEVELING } },
      payload: {
        httpStatus: 404,
        error: { code: 'NOT_FOUND', message: 'Not Found' },
      },
    };
    const state = produce(initialState, (draft) => {
      draft.quoteLevelingJobsByPackageId[44410] = staleJob;
      extraReducers[analyseFetch.rejected.type](draft, action);
    });
    expect(state.quoteLevelingData).toBeNull();
    expect(state.quoteLevelingJobsByPackageId[44410]).toBeUndefined();
    expect(state.quoteLevelingErrorsByPackageId[44410]).toBeUndefined();
    expect(state.quoteLevelingErrorPayloadsByPackageId[44410]).toBeUndefined();
    expect(JSON.parse(localStorage.getItem('quoteLeveling'))).toEqual([99999]);
  });

  it('should schedule retry on analyseFetch 429 rate limit', () => {
    const action = {
      type: analyseFetch.rejected.type,
      error: { message: 'Too many requests' },
      meta: { arg: { tid: 1, type: QUOTE_LEVELING } },
      payload: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          type: 'rate_limit',
          message: 'Please wait 29 seconds before trying again.',
          retry_after_seconds: 29,
        },
      },
    };
    const state = produce(initialState, (draft) => {
      draft.quoteLevelingJobsByPackageId[1] = { status: 'STARTED', package_id: 1 };
      extraReducers[analyseFetch.rejected.type](draft, action);
    });
    expect(state.quoteLevelingJobsByPackageId[1]).toEqual({
      status: 'STARTED',
      package_id: 1,
    });
    expect(state.quoteLevelingSecondsByPackageId[1]).toBe(29);
    expect(state.quoteLevelingErrorsByPackageId[1]).toBe(
      'Please wait 29 seconds before trying again.',
    );
    expect(state.quoteLevelingErrorPayloadsByPackageId[1]).toEqual(action.payload);
  });

  it('should store quote levelling 429 on the package that was started', () => {
    const action = {
      type: analyseStart.rejected.type,
      error: { message: 'Too many requests' },
      meta: { arg: { tid: 44411, type: QUOTE_LEVELING } },
      payload: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          type: 'rate_limit',
          message:
            'An analysis for this package was started recently. Please wait 37 seconds before trying again.',
          retry_after_seconds: 37,
        },
      },
    };
    const state = produce(initialState, (draft) => {
      draft.quoteLevelingJobsByPackageId[44411] = { status: 'SUCCESS', package_id: 44411 };
      extraReducers[analyseStart.rejected.type](draft, action);
    });
    expect(state.quoteLevelingErrorsByPackageId[44411]).toBe(
      'An analysis for this package was started recently. Please wait 37 seconds before trying again.',
    );
    expect(state.quoteLevelingSecondsByPackageId[44411]).toBeUndefined();
    expect(state.quoteLevelingErrorsByPackageId[99999]).toBeUndefined();
  });

  it('should store 400 bad request on analyseStart rejected', () => {
    const action = {
      type: analyseStart.rejected.type,
      error: { message: 'Missing analysis_type field' },
      meta: { arg: { tid: 43380, type: QUOTE_LEVELING } },
      payload: {
        httpStatus: 400,
        error: {
          code: 'VALIDATION_ERROR',
          type: 'validation_error',
          message: 'Missing analysis_type field',
        },
      },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseStart.rejected.type](draft, action);
    });
    expect(state.quoteLevelingErrorsByPackageId[43380]).toBe('Missing analysis_type field');
    expect(state.quoteLevelingErrorPayloadsByPackageId[43380]).toEqual(action.payload);
  });

  it('should treat empty 200 fetch payload as no job without error', () => {
    const action = {
      type: analyseFetch.fulfilled.type,
      payload: null,
      meta: { arg: { tid: 43380, type: QUOTE_LEVELING } },
    };
    const state = produce(initialState, (draft) => {
      draft.quoteLevelingJobsByPackageId[43380] = { status: 'PENDING', package_id: 43380 };
      extraReducers[analyseFetch.fulfilled.type](draft, action);
    });
    expect(state.quoteLevelingData).toBeNull();
    expect(state.quoteLevelingJobsByPackageId[43380]).toEqual({
      status: 'PENDING',
      package_id: 43380,
    });
    expect(state.quoteLevelingErrorsByPackageId[43380]).toBeUndefined();
  });

  it('should keep FAILURE job in state when GET returns 200 with failed status', () => {
    const mockPayload = {
      status: 'FAILURE',
      package_id: 43380,
      user_message: 'The analysis could not be completed.',
    };
    const action = {
      type: analyseFetch.fulfilled.type,
      payload: mockPayload,
      meta: { arg: { tid: 43380, type: QUOTE_LEVELING } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseFetch.fulfilled.type](draft, action);
    });
    expect(state.quoteLevelingJobsByPackageId[43380]).toEqual(mockPayload);
    expect(state.quoteLevelingErrorsByPackageId[43380]).toBeUndefined();
  });

  it('should not write per-package meta for an empty fulfilled payload without a resolvable package id', () => {
    const action = {
      type: analyseFetch.fulfilled.type,
      payload: null,
      meta: { arg: { type: QUOTE_LEVELING } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseFetch.fulfilled.type](draft, action);
    });
    expect(state.quoteLevelingData).toBeNull();
    expect(state.quoteLevelingErrorsByPackageId).toEqual({});
  });

  it('should clear per-package meta when an empty fulfilled payload resolves via tid', () => {
    const action = {
      type: analyseFetch.fulfilled.type,
      payload: null,
      meta: { arg: { tid: 43380, type: QUOTE_LEVELING } },
    };
    const state = produce(initialState, (draft) => {
      draft.quoteLevelingErrorsByPackageId[43380] = 'stale error';
      extraReducers[analyseFetch.fulfilled.type](draft, action);
    });
    expect(state.quoteLevelingData).toBeNull();
    expect(state.quoteLevelingErrorsByPackageId[43380]).toBeUndefined();
  });

  it('should fall back to a default message when rejected without error or payload message', () => {
    const action = {
      type: analyseFetch.rejected.type,
      error: {},
      meta: { arg: { tid: 57263 } },
      payload: { httpStatus: 500 },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseFetch.rejected.type](draft, action);
    });
    expect(state.tenderErrorsByPackageId[57263]).toBe('Failed to process analysis');
  });

  it('should not touch storage when a 404 rejection resolves to no package id', () => {
    const action = {
      type: analyseFetch.rejected.type,
      error: { message: 'Not Found' },
      meta: { arg: { type: QUOTE_LEVELING } },
      payload: {
        httpStatus: 404,
        error: { code: 'NOT_FOUND', message: 'Not Found' },
      },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseFetch.rejected.type](draft, action);
    });
    expect(state.quoteLevelingData).toBeNull();
    expect(state.quoteLevelingSeconds).toBe(-1);
  });

  it('should clear per-package meta on generic rejection resolved via tid', () => {
    const action = {
      type: analyseStart.rejected.type,
      error: { message: 'Server error' },
      meta: { arg: { tid: 57263, type: QUOTE_LEVELING } },
      payload: { httpStatus: 500, error: { code: 'UNKNOWN_ERROR', message: 'Server error' } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseStart.rejected.type](draft, action);
    });
    expect(state.quoteLevelingErrorsByPackageId[57263]).toBe('Server error');
  });

  it('should not write per-package meta on generic rejection without a package id', () => {
    const action = {
      type: analyseStart.rejected.type,
      error: { message: 'Server error' },
      meta: { arg: { type: QUOTE_LEVELING } },
      payload: { httpStatus: 500, error: { code: 'UNKNOWN_ERROR', message: 'Server error' } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseStart.rejected.type](draft, action);
    });
    expect(state.quoteLevelingData).toBeNull();
    expect(state.quoteLevelingSeconds).toBe(-1);
  });

  it('should store quote levelling fetch result in quoteLevelingData', () => {
    const mockPayload = { status: 'STARTED', current_step: 1, total_steps: 5 };
    const action = {
      type: analyseFetch.fulfilled.type,
      payload: mockPayload,
      meta: { arg: { tid: '1', type: QUOTE_LEVELING } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseFetch.fulfilled.type](draft, action);
    });
    expect(state.quoteLevelingData).toEqual(mockPayload);
    expect(state.data).toBeNull();
  });

  // Test analyseStart.pending
  it('should handle analyseStart.pending without state change', () => {
    const action = { type: analyseStart.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseStart.pending.type](draft, action);
    });
    expect(state).toEqual(initialState);
  });

  // Test analyseStart.fulfilled
  it('should handle analyseStart.fulfilled correctly', () => {
    const mockPayload = { started: true };
    const action = {
      type: analyseStart.fulfilled.type,
      payload: mockPayload,
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseStart.fulfilled.type](draft, action);
    });
    expect(state.data).toEqual(mockPayload);
    expect(state.error).toBeNull();
    expect(state.errorPayload).toBeNull();
  });

  // Test analyseStart.rejected
  it('should handle analyseStart.rejected correctly', () => {
    const mockError = new Error('Failed to start analysis');
    const action = {
      type: analyseStart.rejected.type,
      error: mockError,
      meta: { arg: { tid: 57263 } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[analyseStart.rejected.type](draft, action);
    });
    expect(state.data).toBeNull();
    expect(state.tenderErrorsByPackageId[57263]).toBe(mockError.message);
    expect(state.tenderErrorPayloadsByPackageId[57263]).toBeUndefined();
    expect(state.seconds).toBe(-1);
  });
});
