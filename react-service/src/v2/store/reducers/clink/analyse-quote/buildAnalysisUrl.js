import { QUOTE_LEVELING } from './analysisTypes';

const buildAnalysisUrl = (tid, { type, reset } = {}) => {
  const params = new URLSearchParams();
  if (type === QUOTE_LEVELING) {
    params.set('type', QUOTE_LEVELING);
  }
  if (reset) {
    params.set('reset', 'true');
  }
  const query = params.toString();
  return `ai/quote_analysis/initiate/${tid}${query ? `?${query}` : ''}`;
};

export default buildAnalysisUrl;
