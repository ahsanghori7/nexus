import getTenderAnalysisCardStatus from './getTenderAnalysisCardStatus';

describe('getTenderAnalysisCardStatus', () => {
  it('returns not_run when never started', () => {
    expect(
      getTenderAnalysisCardStatus({
        tid: 1,
        currentTender: 0,
        data: null,
        error: null,
        analysisStarted: false,
      }),
    ).toBe('not_run');
  });

  it('returns failed when package has FAILURE status', () => {
    expect(
      getTenderAnalysisCardStatus({
        tid: 42755,
        currentTender: 0,
        data: {
          status: 'FAILURE',
          package_id: 42755,
          user_message: 'We could not access files',
          can_retry: true,
        },
        error: null,
        analysisStarted: true,
      }),
    ).toBe('failed');
  });

  it('returns running when package_id matches STARTED', () => {
    expect(
      getTenderAnalysisCardStatus({
        tid: 43788,
        currentTender: 0,
        data: { status: 'STARTED', package_id: 43788 },
        error: null,
        analysisStarted: true,
      }),
    ).toBe('running');
  });

  it('does not show ready for another package job', () => {
    expect(
      getTenderAnalysisCardStatus({
        tid: 42755,
        currentTender: 100,
        data: { status: 'SUCCESS', package_id: 100 },
        error: null,
        analysisStarted: true,
      }),
    ).toBe('not_run');
  });

  it('returns ready for SUCCESS without package_id (pre-scoped job from Redux map)', () => {
    expect(
      getTenderAnalysisCardStatus({
        tid: 42755,
        currentTender: 0,
        data: { status: 'SUCCESS', executive_summary: {} },
        error: null,
        analysisStarted: false,
      }),
    ).toBe('ready');
  });

  it('returns ready for lowercase success status', () => {
    expect(
      getTenderAnalysisCardStatus({
        tid: 42755,
        currentTender: 0,
        data: { status: 'success', package_id: 42755 },
        error: null,
        analysisStarted: false,
      }),
    ).toBe('ready');
  });

  it('returns failed when pre-scoped package data has FAILURE', () => {
    expect(
      getTenderAnalysisCardStatus({
        tid: 42755,
        currentTender: 999,
        data: {
          status: 'FAILURE',
          package_id: 42755,
          user_message: 'Failed',
          can_retry: true,
        },
        error: null,
        analysisStarted: false,
      }),
    ).toBe('failed');
  });

  it('returns ready only for SUCCESS on this package', () => {
    expect(
      getTenderAnalysisCardStatus({
        tid: 42755,
        currentTender: 42755,
        data: { status: 'SUCCESS', package_id: 42755 },
        error: null,
        analysisStarted: true,
      }),
    ).toBe('ready');
  });
});
