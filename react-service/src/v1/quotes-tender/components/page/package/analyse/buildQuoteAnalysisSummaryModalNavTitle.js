import i18next from 'v2/helpers/i18n';

export const QUOTE_ANALYSIS_SUMMARY_MODAL_TITLE_KEY =
  'analysis-tool-quote-summary-modal-title';
export const QUOTE_ANALYSIS_SUMMARY_PACKAGE_FALLBACK_KEY =
  'analysis-tool-quote-summary-package-fallback';

export const resolveQuoteAnalysisPackageName = (packageName) => {
  const trimmed = typeof packageName === 'string' ? packageName.trim() : '';
  return trimmed || i18next.t(QUOTE_ANALYSIS_SUMMARY_PACKAGE_FALLBACK_KEY);
};

const buildQuoteAnalysisSummaryModalNavTitle = (packageName) => {
  const resolvedName = resolveQuoteAnalysisPackageName(packageName);

  return {
    navTitle: QUOTE_ANALYSIS_SUMMARY_MODAL_TITLE_KEY,
    navTitleInterpolation: { packageName: resolvedName },
    packageName: resolvedName,
  };
};

export default buildQuoteAnalysisSummaryModalNavTitle;

/** Merge live analysis status into the AI modal config (open state is set once from AnalyseQuote). */
export const resolveAnalysisModalOpen = (openModal, { hasData }) => {
  if (!openModal || typeof openModal !== 'object') return openModal;
  if (openModal.id !== 'analyse-quote-with-ai') return openModal;
  if (hasData) {
    const packageName = openModal.packageName ?? openModal.title;
    return {
      ...openModal,
      ...buildQuoteAnalysisSummaryModalNavTitle(packageName),
      description: 'ai-quote-analysis-complete-description',
    };
  }
  return {
    ...openModal,
    navTitle: 'ai-analysis-in-progress',
  };
};
