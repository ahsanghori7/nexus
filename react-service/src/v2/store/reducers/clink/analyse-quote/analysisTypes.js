export const TENDER_ANALYSIS = 'tender_analysis';
export const QUOTE_LEVELING = 'tender_levelling';

export const ANALYSIS_STORAGE_KEYS = {
  [TENDER_ANALYSIS]: 'analyseQuote',
  [QUOTE_LEVELING]: 'quoteLeveling',
};

export const isQuoteLevelingType = (type) => type === QUOTE_LEVELING;

export const getJobStateKeys = (type) => {
  if (isQuoteLevelingType(type)) {
    return {
      dataKey: 'quoteLevelingData',
      errorKey: 'quoteLevelingError',
      errorPayloadKey: 'quoteLevelingErrorPayload',
      secondsKey: 'quoteLevelingSeconds',
    };
  }
  return {
    dataKey: 'data',
    errorKey: 'error',
    errorPayloadKey: 'errorPayload',
    secondsKey: 'seconds',
  };
};
