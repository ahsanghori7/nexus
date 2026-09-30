import buildAnalysisUrl from './buildAnalysisUrl';
import { QUOTE_LEVELING } from './analysisTypes';

describe('buildAnalysisUrl', () => {
  it('builds base url without type for default tender analysis', () => {
    expect(buildAnalysisUrl('99')).toBe('ai/quote_analysis/initiate/99');
  });

  it('appends type=tender_levelling when requested', () => {
    expect(buildAnalysisUrl('99', { type: QUOTE_LEVELING })).toBe(
      'ai/quote_analysis/initiate/99?type=tender_levelling',
    );
  });

  it('appends reset without type for tender analysis restart', () => {
    expect(buildAnalysisUrl('99', { reset: true })).toBe(
      'ai/quote_analysis/initiate/99?reset=true',
    );
  });
});
