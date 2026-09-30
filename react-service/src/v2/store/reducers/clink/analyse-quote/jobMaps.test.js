import {
  readPackageJob,
  writePackageJob,
  writePackageJobMeta,
  readPackageJobMeta,
  clearPackageJobMetaEntry,
  clearPackageJobEntry,
} from './jobMaps';

describe('jobMaps', () => {
  it('stores and reads tender job by package id', () => {
    const state = {
      currentTender: 0,
      data: null,
      tenderJobsByPackageId: {},
      quoteLevelingJobsByPackageId: {},
      quoteLevelingData: null,
    };
    const payload = { status: 'SUCCESS', package_id: 43788 };

    writePackageJob(state, payload, undefined, 43788);

    expect(state.tenderJobsByPackageId[43788]).toEqual(payload);
    expect(readPackageJob(state, 43788)).toEqual(payload);
  });

  it('reads legacy SUCCESS without package_id when package was started locally', () => {
    localStorage.setItem('analyseQuote', JSON.stringify([42755]));
    const state = {
      currentTender: 0,
      data: { status: 'SUCCESS', executive_summary: {} },
      tenderJobsByPackageId: {},
      quoteLevelingJobsByPackageId: {},
      quoteLevelingData: null,
    };

    expect(readPackageJob(state, 42755)?.status).toBe('SUCCESS');
    localStorage.removeItem('analyseQuote');
  });

  it('keeps another package job when global data is overwritten', () => {
    const state = {
      currentTender: 42755,
      data: { status: 'FAILURE', package_id: 42755 },
      tenderJobsByPackageId: {
        43788: { status: 'SUCCESS', package_id: 43788 },
      },
      quoteLevelingJobsByPackageId: {},
      quoteLevelingData: null,
    };

    expect(readPackageJob(state, 43788)?.status).toBe('SUCCESS');
    expect(readPackageJob(state, 42755)?.status).toBe('FAILURE');
  });

  it('stores and reads per-package quote levelling errors', () => {
    const state = {
      quoteLevelingJobsByPackageId: {},
      quoteLevelingErrorsByPackageId: {},
      quoteLevelingErrorPayloadsByPackageId: {},
      quoteLevelingSecondsByPackageId: {},
    };

    writePackageJobMeta(state, 44411, 'tender_levelling', {
      error: 'Please wait 37 seconds before trying again.',
      errorPayload: { error: { code: 'RATE_LIMIT_EXCEEDED' } },
    });

    expect(readPackageJobMeta(state, 44411, 'tender_levelling').error).toBe(
      'Please wait 37 seconds before trying again.',
    );
    expect(readPackageJobMeta(state, 99999, 'tender_levelling').error).toBeNull();
  });

  it('returns null when a legacy job package_id does not match the requested package', () => {
    const state = {
      currentTender: 0,
      data: { status: 'SUCCESS', package_id: 99999 },
      tenderJobsByPackageId: {},
      quoteLevelingJobsByPackageId: {},
      quoteLevelingData: null,
    };

    expect(readPackageJob(state, 42755)).toBeNull();
  });

  it('reads legacy job matched by currentTender when it lacks a package_id', () => {
    const state = {
      currentTender: 42755,
      data: { status: 'STARTED' },
      tenderJobsByPackageId: {},
      quoteLevelingJobsByPackageId: {},
      quoteLevelingData: null,
    };

    expect(readPackageJob(state, 42755)).toEqual({ status: 'STARTED' });
  });

  it('returns null when a legacy job without package_id matches neither currentTender nor a started flag', () => {
    const state = {
      currentTender: 99999,
      data: { status: 'STARTED' },
      tenderJobsByPackageId: {},
      quoteLevelingJobsByPackageId: {},
      quoteLevelingData: null,
    };

    expect(readPackageJob(state, 42755)).toBeNull();
  });

  it('returns default meta for an invalid package id', () => {
    const state = {
      quoteLevelingErrorsByPackageId: {},
      quoteLevelingErrorPayloadsByPackageId: {},
      quoteLevelingSecondsByPackageId: {},
    };

    expect(readPackageJobMeta(state, undefined, 'tender_levelling')).toEqual({
      error: null,
      errorPayload: null,
      seconds: -1,
    });
  });

  it('clears previously stored error, errorPayload, and seconds when explicitly nulled', () => {
    const state = {
      quoteLevelingErrorsByPackageId: { 501: 'old error' },
      quoteLevelingErrorPayloadsByPackageId: { 501: { error: {} } },
      quoteLevelingSecondsByPackageId: { 501: 20 },
    };

    writePackageJobMeta(state, 501, 'tender_levelling', {
      error: null,
      errorPayload: null,
      seconds: -1,
    });

    expect(state.quoteLevelingErrorsByPackageId[501]).toBeUndefined();
    expect(state.quoteLevelingErrorPayloadsByPackageId[501]).toBeUndefined();
    expect(state.quoteLevelingSecondsByPackageId[501]).toBeUndefined();
  });

  it('writes only the provided meta fields, leaving the others untouched', () => {
    const state = {
      quoteLevelingErrorsByPackageId: { 501: 'old error' },
      quoteLevelingErrorPayloadsByPackageId: {},
      quoteLevelingSecondsByPackageId: {},
    };

    writePackageJobMeta(state, 501, 'tender_levelling', { seconds: 15 });

    expect(state.quoteLevelingErrorsByPackageId[501]).toBe('old error');
    expect(state.quoteLevelingSecondsByPackageId[501]).toBe(15);
  });

  it('is a no-op when writing meta without an options object', () => {
    const state = {
      quoteLevelingErrorsByPackageId: {},
      quoteLevelingErrorPayloadsByPackageId: {},
      quoteLevelingSecondsByPackageId: {},
    };

    writePackageJobMeta(state, 501, 'tender_levelling');

    expect(state.quoteLevelingErrorsByPackageId).toEqual({});
    expect(state.quoteLevelingSecondsByPackageId).toEqual({});
  });

  it('does nothing when writing meta for an invalid package id', () => {
    const state = {
      quoteLevelingErrorsByPackageId: {},
      quoteLevelingErrorPayloadsByPackageId: {},
      quoteLevelingSecondsByPackageId: {},
    };

    writePackageJobMeta(state, undefined, 'tender_levelling', { error: 'x' });

    expect(state.quoteLevelingErrorsByPackageId).toEqual({});
  });

  it('does nothing when clearing meta for an invalid package id', () => {
    const state = {
      quoteLevelingErrorsByPackageId: {},
      quoteLevelingErrorPayloadsByPackageId: {},
      quoteLevelingSecondsByPackageId: {},
    };

    clearPackageJobMetaEntry(state, undefined, 'tender_levelling');

    expect(state.quoteLevelingErrorsByPackageId).toEqual({});
  });

  it('does nothing when clearing a job entry for an invalid package id', () => {
    const state = {
      quoteLevelingJobsByPackageId: { 44411: { status: 'SUCCESS' } },
      quoteLevelingErrorsByPackageId: {},
      quoteLevelingErrorPayloadsByPackageId: {},
      quoteLevelingSecondsByPackageId: {},
      quoteLevelingData: null,
    };

    clearPackageJobEntry(state, undefined, 'tender_levelling');

    expect(state.quoteLevelingJobsByPackageId[44411]).toEqual({ status: 'SUCCESS' });
  });

  it('clears the legacy data slot when it matches the cleared package id', () => {
    const state = {
      quoteLevelingJobsByPackageId: { 44411: { status: 'SUCCESS', package_id: 44411 } },
      quoteLevelingErrorsByPackageId: {},
      quoteLevelingErrorPayloadsByPackageId: {},
      quoteLevelingSecondsByPackageId: {},
      quoteLevelingData: { status: 'SUCCESS', package_id: 44411 },
    };

    clearPackageJobEntry(state, 44411, 'tender_levelling');

    expect(state.quoteLevelingJobsByPackageId[44411]).toBeUndefined();
    expect(state.quoteLevelingData).toBeNull();
  });
});
