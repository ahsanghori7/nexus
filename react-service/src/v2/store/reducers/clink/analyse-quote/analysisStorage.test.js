import {
  readAnalysisStarted,
  markAnalysisStarted,
  clearAnalysisStarted,
} from './analysisStorage';
import { QUOTE_LEVELING } from './analysisTypes';

describe('analysisStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('marks and reads tender analysis started for a package', () => {
    markAnalysisStarted(42755);
    expect(readAnalysisStarted(42755)).toBe(true);
    expect(readAnalysisStarted(99999)).toBe(false);
  });

  it('clears package id when QSAI job not found', () => {
    localStorage.setItem('analyseQuote', JSON.stringify([42755, 43788]));
    localStorage.setItem('quoteLeveling', JSON.stringify([42755, 43380]));

    clearAnalysisStarted(42755);
    clearAnalysisStarted(42755, QUOTE_LEVELING);

    expect(readAnalysisStarted(42755)).toBe(false);
    expect(readAnalysisStarted(43788)).toBe(true);
    expect(readAnalysisStarted(42755, QUOTE_LEVELING)).toBe(false);
    expect(readAnalysisStarted(43380, QUOTE_LEVELING)).toBe(true);
  });
});
