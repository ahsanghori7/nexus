import i18next from 'v2/helpers/i18n';
import formatAnalysisGeneratedAt from './formatAnalysisGeneratedAt';

const buildLevelingReadyContent = (data) => {
  const generatedAt = formatAnalysisGeneratedAt(data?.completed_at);

  const footer = generatedAt
    ? i18next.t('analysis-tool-generated-at', { date: generatedAt })
    : null;

  return {
    description: i18next.t('analysis-tool-leveling-ready-description'),
    descriptionEmphasis: i18next.t('analysis-tool-leveling-ready-description-emphasis'),
    footer,
  };
};

export default buildLevelingReadyContent;
