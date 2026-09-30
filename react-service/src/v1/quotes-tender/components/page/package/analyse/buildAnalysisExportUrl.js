import { QUOTE_LEVELING } from 'v2/store/reducers/clink/analyse-quote/analysisTypes';

const buildAnalysisExportUrl = (packageId, format, type) => {
  const params = new URLSearchParams();
  if (type === QUOTE_LEVELING) {
    params.set('type', QUOTE_LEVELING);
  }
  const query = params.toString();
  return `ai/quote_analysis/export/${packageId}/${format}${query ? `?${query}` : ''}`;
};

export default buildAnalysisExportUrl;
