import getAnalysisProgress from './getAnalysisProgress';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key, params) => `${key}:${params.current}/${params.total}`),
}));

describe('getAnalysisProgress', () => {
  it('returns hasSteps and percent when steps are valid', () => {
    const result = getAnalysisProgress({ current_step: 3, total_steps: 10 });
    expect(result.hasSteps).toBe(true);
    expect(result.percent).toBe(30);
    expect(result.stageLabel).toBe('ai-quote-analysis-step-of:3/10');
  });

  it('clamps percent between 0 and 100', () => {
    expect(getAnalysisProgress({ current_step: 12, total_steps: 10 }).percent).toBe(100);
    expect(getAnalysisProgress({ current_step: -1, total_steps: 10 }).hasSteps).toBe(false);
  });

  it('returns isSingleStep when total_steps is 1', () => {
    const result = getAnalysisProgress({ current_step: 0, total_steps: 1 });
    expect(result.isSingleStep).toBe(true);
    expect(result.hasSteps).toBe(true);
  });

  it('returns null stage when steps are missing', () => {
    const result = getAnalysisProgress({ status: 'STARTED' });
    expect(result.hasSteps).toBe(false);
    expect(result.stageLabel).toBeNull();
    expect(result.percent).toBeNull();
  });
});
