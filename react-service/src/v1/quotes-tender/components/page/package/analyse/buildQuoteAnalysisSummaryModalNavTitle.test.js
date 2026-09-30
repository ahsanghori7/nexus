import buildQuoteAnalysisSummaryModalNavTitle, {
  QUOTE_ANALYSIS_SUMMARY_MODAL_TITLE_KEY,
  resolveAnalysisModalOpen,
  resolveQuoteAnalysisPackageName,
} from './buildQuoteAnalysisSummaryModalNavTitle';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => (key === 'analysis-tool-quote-summary-package-fallback'
    ? 'Unknown Package'
    : key)),
}));

describe('buildQuoteAnalysisSummaryModalNavTitle', () => {
  it('builds nav title config with package name', () => {
    expect(buildQuoteAnalysisSummaryModalNavTitle('Carpentry - Second Fix')).toEqual({
      navTitle: QUOTE_ANALYSIS_SUMMARY_MODAL_TITLE_KEY,
      navTitleInterpolation: { packageName: 'Carpentry - Second Fix' },
      packageName: 'Carpentry - Second Fix',
    });
  });

  it('preserves special characters in package names', () => {
    expect(
      buildQuoteAnalysisSummaryModalNavTitle('Steel & Fabrication - Phase 1'),
    ).toEqual({
      navTitle: QUOTE_ANALYSIS_SUMMARY_MODAL_TITLE_KEY,
      navTitleInterpolation: { packageName: 'Steel & Fabrication - Phase 1' },
      packageName: 'Steel & Fabrication - Phase 1',
    });
  });

  it('falls back when package name is missing', () => {
    expect(resolveQuoteAnalysisPackageName('')).toBe('Unknown Package');
    expect(resolveQuoteAnalysisPackageName('   ')).toBe('Unknown Package');
    expect(resolveQuoteAnalysisPackageName(null)).toBe('Unknown Package');
    expect(buildQuoteAnalysisSummaryModalNavTitle(undefined)).toEqual({
      navTitle: QUOTE_ANALYSIS_SUMMARY_MODAL_TITLE_KEY,
      navTitleInterpolation: { packageName: 'Unknown Package' },
      packageName: 'Unknown Package',
    });
  });
});

describe('resolveAnalysisModalOpen', () => {
  it('returns openModal unchanged when falsy or not an analyse modal', () => {
    expect(resolveAnalysisModalOpen(null, { hasData: true })).toBeNull();
    expect(resolveAnalysisModalOpen(false, { hasData: true })).toBe(false);
    expect(
      resolveAnalysisModalOpen({ id: 'ai-warning' }, { hasData: true }),
    ).toEqual({ id: 'ai-warning' });
  });

  it('sets in-progress nav title when analysis is not ready', () => {
    const openModal = {
      id: 'analyse-quote-with-ai',
      packageId: 123,
      title: 'Carpentry - Second Fix',
    };

    expect(resolveAnalysisModalOpen(openModal, { hasData: false })).toEqual({
      ...openModal,
      navTitle: 'ai-analysis-in-progress',
    });
  });

  it('builds quote analysis summary header from stored packageName when ready', () => {
    const openModal = {
      id: 'analyse-quote-with-ai',
      packageId: 123,
      packageName: 'Carpentry - Second Fix',
      analysisData: { status: 'SUCCESS' },
    };

    expect(resolveAnalysisModalOpen(openModal, { hasData: true })).toEqual({
      ...openModal,
      navTitle: QUOTE_ANALYSIS_SUMMARY_MODAL_TITLE_KEY,
      navTitleInterpolation: { packageName: 'Carpentry - Second Fix' },
      packageName: 'Carpentry - Second Fix',
      description: 'ai-quote-analysis-complete-description',
    });
  });

  it('falls back to legacy title when packageName is missing', () => {
    const openModal = {
      id: 'analyse-quote-with-ai',
      packageId: 456,
      title: 'Steel & Fabrication - Phase 1',
    };

    expect(
      resolveAnalysisModalOpen(openModal, { hasData: true }).packageName,
    ).toBe('Steel & Fabrication - Phase 1');
  });

  it('uses unknown package fallback when no name is available', () => {
    const openModal = {
      id: 'analyse-quote-with-ai',
      packageId: 789,
    };

    expect(
      resolveAnalysisModalOpen(openModal, { hasData: true }).packageName,
    ).toBe('Unknown Package');
  });
});
