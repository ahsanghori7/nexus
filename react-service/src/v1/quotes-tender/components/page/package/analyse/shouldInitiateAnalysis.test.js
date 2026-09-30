import shouldInitiateAnalysis from './shouldInitiateAnalysis';

describe('shouldInitiateAnalysis', () => {
  it('always PATCH on reset', () => {
    expect(
      shouldInitiateAnalysis({
        reset: true,
        packageData: { status: 'STARTED', package_id: 1 },
        tid: 1,
      }),
    ).toBe(true);
  });

  it('PATCH when no job data (e.g. GET 404 after localStorage started)', () => {
    expect(
      shouldInitiateAnalysis({
        reset: false,
        packageData: null,
        tid: 42755,
      }),
    ).toBe(true);
  });

  it('GET-only resume when job is in progress for this package', () => {
    expect(
      shouldInitiateAnalysis({
        reset: false,
        packageData: { status: 'PENDING', package_id: 42755 },
        tid: 42755,
      }),
    ).toBe(false);
  });

  it('PATCH when cached job belongs to another package', () => {
    expect(
      shouldInitiateAnalysis({
        reset: false,
        packageData: { status: 'STARTED', package_id: 99999 },
        tid: 42755,
      }),
    ).toBe(true);
  });
});
