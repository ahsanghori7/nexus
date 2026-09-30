import { ANALYSIS_STORAGE_KEYS, TENDER_ANALYSIS } from './analysisTypes';

export const getAnalysisStorageKey = (type) =>
  ANALYSIS_STORAGE_KEYS[type] || ANALYSIS_STORAGE_KEYS[TENDER_ANALYSIS];

export const readAnalysisStarted = (tid, type) => {
  const existingData =
    JSON.parse(localStorage.getItem(getAnalysisStorageKey(type))) || [];
  return existingData.includes(tid);
};

export const markAnalysisStarted = (tid, type) => {
  const key = getAnalysisStorageKey(type);
  const existingData = JSON.parse(localStorage.getItem(key)) || [];
  if (!existingData.includes(tid)) {
    localStorage.setItem(key, JSON.stringify([...existingData, tid]));
  }
};

/** Remove package when QSAI has no job (GET 404) so Run triggers PATCH again. */
export const clearAnalysisStarted = (tid, type) => {
  const key = getAnalysisStorageKey(type);
  const existingData = JSON.parse(localStorage.getItem(key)) || [];
  const normalizedTid = Number(tid);
  const next = existingData.filter((id) => Number(id) !== normalizedTid);
  if (next.length === existingData.length) {
    return;
  }
  if (next.length === 0) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(next));
  }
};
