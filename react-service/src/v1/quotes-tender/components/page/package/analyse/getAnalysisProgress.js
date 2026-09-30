import i18next from 'v2/helpers/i18n';

const getAnalysisProgress = (analysisData) => {
  const currentStepRaw = analysisData?.current_step;
  const totalStepsRaw = analysisData?.total_steps;

  const currentStep = Number.isFinite(Number(currentStepRaw))
    ? Number(currentStepRaw)
    : null;
  const totalSteps = Number.isFinite(Number(totalStepsRaw))
    ? Number(totalStepsRaw)
    : null;

  const hasSteps =
    currentStep !== null &&
    totalSteps !== null &&
    totalSteps > 0 &&
    currentStep >= 0;

  const percent = hasSteps
    ? Math.max(0, Math.min(100, Math.round((currentStep / totalSteps) * 100)))
    : null;

  return {
    hasSteps,
    isSingleStep: totalSteps === 1,
    currentStep,
    totalSteps,
    percent,
    stageLabel: hasSteps
      ? i18next.t('ai-quote-analysis-step-of', {
          current: currentStep,
          total: totalSteps,
        })
      : null,
  };
};

export default getAnalysisProgress;
