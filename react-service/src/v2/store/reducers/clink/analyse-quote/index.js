import { createSlice } from '@reduxjs/toolkit';
import extraReducers, { analyseFetch, analyseStart } from './extraReducers';
import { isQuoteLevelingType } from './analysisTypes';
import { getJobStateKeys } from './jobState';
import { clearPackageJobEntry, writePackageJob, writePackageJobMeta, clearPackageJobMetaEntry } from './jobMaps';

export { TENDER_ANALYSIS, QUOTE_LEVELING } from './analysisTypes';
export { selectJobSlice, selectPackageJob } from './jobState';
export { readAnalysisStarted, markAnalysisStarted, clearAnalysisStarted } from './analysisStorage';
export { default as buildAnalysisUrl } from './buildAnalysisUrl';

const initialState = {
  data: null,
  error: null,
  errorPayload: null,
  currentTender: 0,
  seconds: -1,
  tenderJobsByPackageId: {},
  quoteLevelingData: null,
  quoteLevelingError: null,
  quoteLevelingErrorPayload: null,
  quoteLevelingSeconds: -1,
  quoteLevelingJobsByPackageId: {},
  quoteLevelingErrorsByPackageId: {},
  quoteLevelingErrorPayloadsByPackageId: {},
  quoteLevelingSecondsByPackageId: {},
  tenderErrorsByPackageId: {},
  tenderErrorPayloadsByPackageId: {},
  tenderSecondsByPackageId: {},
};

const analyseQuotesSlice = createSlice({
  name: 'analyseQuotes',
  initialState,
  reducers: {
    setAnalysisDataReset: (state, { payload }) => {
      const type = payload?.type;
      if (type && isQuoteLevelingType(type)) {
        state.quoteLevelingData = null;
        state.quoteLevelingError = null;
        state.quoteLevelingErrorPayload = null;
        state.quoteLevelingSeconds = -1;
        state.quoteLevelingJobsByPackageId = {};
        state.quoteLevelingErrorsByPackageId = {};
        state.quoteLevelingErrorPayloadsByPackageId = {};
        state.quoteLevelingSecondsByPackageId = {};
        return;
      }
      if (!type) {
        state.data = null;
        state.error = null;
        state.errorPayload = null;
        state.tenderJobsByPackageId = {};
        state.quoteLevelingData = null;
        state.quoteLevelingError = null;
        state.quoteLevelingErrorPayload = null;
        state.quoteLevelingSeconds = -1;
        state.quoteLevelingJobsByPackageId = {};
        state.quoteLevelingErrorsByPackageId = {};
        state.quoteLevelingErrorPayloadsByPackageId = {};
        state.quoteLevelingSecondsByPackageId = {};
        state.tenderErrorsByPackageId = {};
        state.tenderErrorPayloadsByPackageId = {};
        state.tenderSecondsByPackageId = {};
        return;
      }
      state.data = null;
      state.error = null;
      state.errorPayload = null;
      state.tenderJobsByPackageId = {};
    },
    setSeconds: (state, { payload }) => {
      const { seconds, type, tid } =
        typeof payload === 'object' ? payload : { seconds: payload, type: undefined };
      const { secondsKey } = getJobStateKeys(type);
      state[secondsKey] = seconds;
      if (tid != null) {
        writePackageJobMeta(state, tid, type, { seconds });
      }
    },
    setCurrentTender: (state, { payload }) => {
      state.currentTender = payload;
    },
    setTenderAnalysisData: (state, { payload }) => {
      writePackageJob(state, payload, undefined, payload?.package_id);
      state.data = payload;
      state.error = null;
      state.errorPayload = null;
    },
    clearTenderAnalysisError: (state) => {
      state.error = null;
      state.errorPayload = null;
    },
    clearPackageJob: (state, { payload }) => {
      const { tid, type } = payload ?? {};
      if (tid == null) {
        return;
      }
      clearPackageJobEntry(state, tid, type);
    },
    clearJobError: (state, { payload }) => {
      const { tid, type } = payload ?? {};
      if (tid == null) {
        const { errorKey, errorPayloadKey } = getJobStateKeys(type);
        state[errorKey] = null;
        state[errorPayloadKey] = null;
        return;
      }
      clearPackageJobMetaEntry(state, tid, type);
    },
  },
  extraReducers,
});

export const {
  setSeconds,
  setCurrentTender,
  setAnalysisDataReset,
  setTenderAnalysisData,
  clearTenderAnalysisError,
  clearPackageJob,
  clearJobError,
} = analyseQuotesSlice.actions;
export { analyseFetch, analyseStart };
export default analyseQuotesSlice.reducer;
