import getAnalysisJobStatus from './getAnalysisJobStatus';

describe('getAnalysisJobStatus', () => {
  it('returns not_run when never started', () => {
    expect(
      getAnalysisJobStatus({ tid: 1, data: null, error: null, analysisStarted: false }),
    ).toBe('not_run');
  });

  it('returns running for STARTED status', () => {
    expect(
      getAnalysisJobStatus({
        tid: 1,
        data: { status: 'STARTED', package_id: 1 },
        error: null,
        analysisStarted: true,
      }),
    ).toBe('running');
  });

  it('returns ready for SUCCESS', () => {
    expect(
      getAnalysisJobStatus({
        tid: 1,
        data: { status: 'SUCCESS', package_id: 1 },
        error: null,
        analysisStarted: true,
      }),
    ).toBe('ready');
  });

  it('returns not_run for SUCCESS on another package', () => {
    expect(
      getAnalysisJobStatus({
        tid: 1,
        data: { status: 'SUCCESS', package_id: 2 },
        error: null,
        analysisStarted: true,
      }),
    ).toBe('not_run');
  });

  it('returns failed for FAILURE', () => {
    expect(
      getAnalysisJobStatus({
        tid: 1,
        data: { status: 'FAILURE', package_id: 1 },
        error: null,
        analysisStarted: true,
      }),
    ).toBe('failed');
  });

  it('returns failed for FAILURE even when not marked started locally', () => {
    expect(
      getAnalysisJobStatus({
        tid: 1,
        data: {
          status: 'FAILURE',
          package_id: 1,
          user_message: 'We could not access files.',
          can_retry: true,
        },
        error: null,
        analysisStarted: false,
      }),
    ).toBe('failed');
  });

  it('returns running while waiting out a 429 rate limit', () => {
    expect(
      getAnalysisJobStatus({
        tid: 1,
        data: { status: 'STARTED', package_id: 1 },
        error: 'Please wait 29 seconds before trying again.',
        analysisStarted: true,
        errorPayload: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            type: 'rate_limit',
            retry_after_seconds: 29,
          },
        },
        seconds: 12,
      }),
    ).toBe('running');
  });

  it('returns not_run when GET initiate returns 404 (no QSAI job yet)', () => {
    expect(
      getAnalysisJobStatus({
        tid: 44410,
        data: null,
        error: 'Not Found',
        analysisStarted: false,
        errorPayload: {
          httpStatus: 404,
          error: { code: 'NOT_FOUND', message: 'Not Found' },
        },
      }),
    ).toBe('not_run');
  });

  it('returns failed for PATCH 429 even when cached SUCCESS exists', () => {
    expect(
      getAnalysisJobStatus({
        tid: 1,
        data: { status: 'SUCCESS', package_id: 1 },
        error: 'Please wait 40 seconds before trying again.',
        analysisStarted: true,
        errorPayload: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            type: 'rate_limit',
            retry_after_seconds: 40,
          },
        },
        seconds: -1,
      }),
    ).toBe('failed');
  });

  it('returns failed for start 429 on a ready job even if seconds were set', () => {
    expect(
      getAnalysisJobStatus({
        tid: 1,
        data: { status: 'SUCCESS', package_id: 1 },
        error:
          'An analysis for this package was started recently. Please wait 49 seconds before trying again.',
        analysisStarted: true,
        errorPayload: {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            type: 'rate_limit',
            retry_after_seconds: 49,
          },
        },
        seconds: 49,
      }),
    ).toBe('failed');
  });
});
