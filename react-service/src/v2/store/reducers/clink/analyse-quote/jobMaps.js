import { getJobStateKeys, isQuoteLevelingType } from './analysisTypes';
import { readAnalysisStarted } from './analysisStorage';

export const getJobsMapKey = (type) =>
  isQuoteLevelingType(type) ? 'quoteLevelingJobsByPackageId' : 'tenderJobsByPackageId';

export const getJobMetaMapsKeys = (type) =>
  isQuoteLevelingType(type)
    ? {
        errorsMapKey: 'quoteLevelingErrorsByPackageId',
        errorPayloadsMapKey: 'quoteLevelingErrorPayloadsByPackageId',
        secondsMapKey: 'quoteLevelingSecondsByPackageId',
      }
    : {
        errorsMapKey: 'tenderErrorsByPackageId',
        errorPayloadsMapKey: 'tenderErrorPayloadsByPackageId',
        secondsMapKey: 'tenderSecondsByPackageId',
      };

const toPackageId = (packageId) => {
  const id = Number(packageId);
  return Number.isFinite(id) ? id : null;
};

export const resolvePackageId = (payload, tid) => {
  if (payload?.package_id != null) {
    return Number(payload.package_id);
  }
  if (tid != null && tid !== '') {
    return Number(tid);
  }
  return null;
};

const matchLegacyJob = (packageId, data, currentTender, type) => {
  if (!data) {
    return null;
  }
  if (data.package_id != null) {
    return Number(data.package_id) === Number(packageId) ? data : null;
  }
  if (currentTender != null && Number(packageId) === Number(currentTender)) {
    return data;
  }
  if (readAnalysisStarted(packageId, type)) {
    return data;
  }
  return null;
};

export const readPackageJob = (state, packageId, type) => {
  const mapKey = getJobsMapKey(type);
  const mapped = state[mapKey]?.[Number(packageId)];
  if (mapped) {
    return mapped;
  }
  const { dataKey } = getJobStateKeys(type);
  return matchLegacyJob(packageId, state[dataKey], state.currentTender, type);
};

export const writePackageJob = (state, payload, type, tid) => {
  const packageId = resolvePackageId(payload, tid);
  if (packageId != null) {
    const mapKey = getJobsMapKey(type);
    state[mapKey][packageId] = payload;
  }
};

export const readPackageJobMeta = (state, packageId, type) => {
  const id = toPackageId(packageId);
  if (id == null) {
    return { error: null, errorPayload: null, seconds: -1 };
  }
  const { errorsMapKey, errorPayloadsMapKey, secondsMapKey } = getJobMetaMapsKeys(type);
  return {
    error: state[errorsMapKey]?.[id] ?? null,
    errorPayload: state[errorPayloadsMapKey]?.[id] ?? null,
    seconds: state[secondsMapKey]?.[id] ?? -1,
  };
};

export const writePackageJobMeta = (
  state,
  packageId,
  type,
  { error, errorPayload, seconds } = {},
) => {
  const id = toPackageId(packageId);
  if (id == null) {
    return;
  }
  const { errorsMapKey, errorPayloadsMapKey, secondsMapKey } = getJobMetaMapsKeys(type);

  if (error !== undefined) {
    if (error == null) {
      delete state[errorsMapKey][id];
    } else {
      state[errorsMapKey][id] = error;
    }
  }
  if (errorPayload !== undefined) {
    if (errorPayload == null) {
      delete state[errorPayloadsMapKey][id];
    } else {
      state[errorPayloadsMapKey][id] = errorPayload;
    }
  }
  if (seconds !== undefined) {
    if (seconds < 0) {
      delete state[secondsMapKey][id];
    } else {
      state[secondsMapKey][id] = seconds;
    }
  }
};

export const clearPackageJobMetaEntry = (state, packageId, type) => {
  const id = toPackageId(packageId);
  if (id == null) {
    return;
  }
  writePackageJobMeta(state, id, type, {
    error: null,
    errorPayload: null,
    seconds: -1,
  });
};

export const clearPackageJobEntry = (state, packageId, type) => {
  const id = toPackageId(packageId);
  if (id == null) {
    return;
  }
  const mapKey = getJobsMapKey(type);
  delete state[mapKey][id];
  clearPackageJobMetaEntry(state, id, type);
  const { dataKey } = getJobStateKeys(type);
  const legacy = state[dataKey];
  if (legacy && resolvePackageId(legacy, id) === id) {
    state[dataKey] = null;
  }
};
