import { createAsyncThunk } from '@reduxjs/toolkit';
import { httpHelperV2 as httpRequest } from 'v2/services/httpHelper';
import { readAnalysisStarted, markAnalysisStarted } from './analysisStorage';
import buildAnalysisUrl from './buildAnalysisUrl';
import parseAnalysisResponseBody from './parseAnalysisResponseBody';
import { isQuoteLevelingType, TENDER_ANALYSIS } from './analysisTypes';

const urlOptionsForType = (type) =>
  isQuoteLevelingType(type) ? { type } : {};

const requestAnalysis = async ({ url, method = 'GET' }) => {
  const text = await httpRequest({ url, method, responseType: 'text' });
  return parseAnalysisResponseBody(text);
};

const analyseFetch = createAsyncThunk(
  'ai/analyseFetch',
  async ({ tid, type = TENDER_ANALYSIS }, { rejectWithValue }) => {
    try {
      return await requestAnalysis({
        url: buildAnalysisUrl(tid, urlOptionsForType(type)),
      });
    } catch (err) {
      const response = err?.response;
      const payload =
        response && typeof response === 'object'
          ? { ...response, httpStatus: err?.status }
          : { error: { message: err?.message }, httpStatus: err?.status };
      return rejectWithValue(payload);
    }
  },
);

const analyseStart = createAsyncThunk(
  'ai/analyseStart',
  async ({ tid, reset, type = TENDER_ANALYSIS }, { rejectWithValue }) => {
    try {
      const res = await requestAnalysis({
        url: buildAnalysisUrl(tid, { ...urlOptionsForType(type), reset }),
        method: 'PATCH',
      });
      if (!readAnalysisStarted(tid, type)) {
        markAnalysisStarted(tid, type);
      }
      return res;
    } catch (err) {
      const response = err?.response;
      const payload =
        response && typeof response === 'object'
          ? { ...response, httpStatus: err?.status }
          : { error: { message: err?.message }, httpStatus: err?.status };
      return rejectWithValue(payload);
    }
  },
);

export { analyseFetch, analyseStart };
