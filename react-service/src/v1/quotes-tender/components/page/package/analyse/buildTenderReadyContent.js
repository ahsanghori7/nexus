import i18next from 'v2/helpers/i18n';
import formatAnalysisGeneratedAt from './formatAnalysisGeneratedAt';

const buildTenderReadyContent = (data, quoteCount = 0) => {
  const summary = data?.analysis_results?.executive_summary;
  const parts = [];

  const findingsCount = summary?.key_findings?.length ?? 0;
  if (findingsCount > 0) {
    parts.push(
      i18next.t('analysis-tool-tender-ready-findings', { count: findingsCount }),
    );
  }

  const scoredCount = summary?.quote_quality_assessment?.length ?? quoteCount;
  if (scoredCount > 0) {
    parts.push(
      i18next.t('analysis-tool-tender-ready-scored', { count: scoredCount }),
    );
  }

  const recommendationsCount = summary?.recommendations?.length ?? 0;
  if (recommendationsCount > 0) {
    parts.push(
      i18next.t('analysis-tool-tender-ready-recommendations', {
        count: recommendationsCount,
      }),
    );
  }

  const generatedAt = formatAnalysisGeneratedAt(data?.completed_at);
  const footer = generatedAt
    ? i18next.t('analysis-tool-generated-at', { date: generatedAt })
    : null;

  return {
    summary: parts.length > 0 ? parts.join(' · ') : null,
    footer,
  };
};

export default buildTenderReadyContent;
