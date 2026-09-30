import { analyseFetch, analyseStart } from './asyncThunk';
import { getJobStateKeys } from './jobState';
import { resolvePackageId, writePackageJob, writePackageJobMeta, clearPackageJobEntry } from './jobMaps';
import { isRateLimitError, isAnalysisNotFoundError } from 'v2/store/reducers/clink/analyse-quote/httpErrors';
import { clearAnalysisStarted } from './analysisStorage';

const isEmptyAnalysisPayload = (payload) =>
  payload == null ||
  (typeof payload === 'object' &&
    !Array.isArray(payload) &&
    Object.keys(payload).length === 0);

const applyJobFulfilled = (state, payload, type, tid) => {
  const { dataKey } = getJobStateKeys(type);
  const packageId = resolvePackageId(payload, tid);

  if (isEmptyAnalysisPayload(payload)) {
    state[dataKey] = null;
    if (packageId != null) {
      writePackageJobMeta(state, packageId, type, {
        error: null,
        errorPayload: null,
      });
    }
    return;
  }

  writePackageJob(state, payload, type, tid);
  state[dataKey] = payload;
  if (packageId != null) {
    writePackageJobMeta(state, packageId, type, {
      error: null,
      errorPayload: null,
    });
  }
};

const applyJobRejected = (state, action, type) => {
  const { error, payload } = action;
  const { dataKey, secondsKey } = getJobStateKeys(type);
  const tid = action.meta?.arg?.tid;
  const packageId = resolvePackageId(payload, tid);
  const isFetchRejection = action.type === analyseFetch.rejected.type;
  const errorMessage =
    payload?.error?.message ?? error?.message ?? 'Failed to process analysis';

  if (
    isFetchRejection &&
    isAnalysisNotFoundError(payload, errorMessage)
  ) {
    state[dataKey] = null;
    state[secondsKey] = -1;
    const resolvedId = packageId ?? tid;
    if (resolvedId != null) {
      clearAnalysisStarted(resolvedId, type);
      clearPackageJobEntry(state, resolvedId, type);
      writePackageJobMeta(state, resolvedId, type, {
        error: null,
        errorPayload: null,
        seconds: -1,
      });
    }
    return;
  }

  if (
    isRateLimitError(payload) &&
    typeof payload?.error?.retry_after_seconds === 'number' &&
    payload.error.retry_after_seconds > 0 &&
    packageId != null
  ) {
    const isStartRejection = action.type === analyseStart.rejected.type;
    const retryAfterSeconds = payload.error.retry_after_seconds;
    writePackageJobMeta(state, packageId, type, {
      error: errorMessage,
      errorPayload: payload,
      seconds: isStartRejection ? -1 : retryAfterSeconds,
    });
    if (!isStartRejection) {
      state[secondsKey] = retryAfterSeconds;
    }
    return;
  }

  state[dataKey] = null;
  state[secondsKey] = -1;
  if (packageId != null) {
    writePackageJobMeta(state, packageId, type, {
      error: errorMessage,
      errorPayload: payload ?? null,
      seconds: -1,
    });
  }
};

const getTypeFromAction = (action) => action.meta?.arg?.type;

export default {
  [analyseFetch.pending]: () => {},
  [analyseFetch.fulfilled]: (state, action) => {
    applyJobFulfilled(
      state,
      action.payload,
      getTypeFromAction(action),
      action.meta?.arg?.tid,
    );
  },
  [analyseFetch.rejected]: (state, action) => {
    applyJobRejected(state, action, getTypeFromAction(action));
  },
  [analyseStart.pending]: () => {},
  [analyseStart.fulfilled]: (state, action) => {
    applyJobFulfilled(
      state,
      action.payload,
      getTypeFromAction(action),
      action.meta?.arg?.tid,
    );
  },
  [analyseStart.rejected]: (state, action) => {
    applyJobRejected(state, action, getTypeFromAction(action));
  },
};
export { analyseFetch, analyseStart };
