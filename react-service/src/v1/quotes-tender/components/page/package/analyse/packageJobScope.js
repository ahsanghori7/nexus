/**
 * Redux tender/leveling job state is global — match jobs to a package via package_id.
 * Polling still uses currentTender (see useTenderAnalysisPoll).
 */
export const getJobDataForPackage = (tid, data, currentTender) => {
  if (!data) {
    return null;
  }
  if (data.package_id != null) {
    return Number(data.package_id) === Number(tid) ? data : null;
  }
  if (currentTender != null && Number(tid) === Number(currentTender)) {
    return data;
  }
  return null;
};

export const normalizeJobStatus = (status) => {
  if (typeof status !== 'string') {
    return status;
  }
  if (status === 'Conflict') {
    return 'CONFLICT';
  }
  return status.toUpperCase();
};

/** When package_id is present it must match tid; legacy jobs without package_id are trusted. */
export const jobBelongsToPackage = (packageData, tid) => {
  if (!packageData) {
    return false;
  }
  const { package_id: packageId } = packageData;
  if (packageId == null || packageId === '') {
    return true;
  }
  return Number(packageId) === Number(tid);
};

export const isSuccessJobStatus = (status) =>
  normalizeJobStatus(status) === 'SUCCESS';

export const isInProgressJobStatus = (status) => {
  const normalized = normalizeJobStatus(status);
  return normalized === 'PENDING' || normalized === 'STARTED' || normalized === 'CONFLICT';
};

export const isFailureJobStatus = (status) => {
  const normalized = normalizeJobStatus(status);
  return normalized === 'FAILURE' || normalized === 'UNPROCESSABLE';
};

export const getScopedTenderJob = (tid, currentTender, data, error) => {
  const packageData = getJobDataForPackage(tid, data, currentTender);
  if (packageData) {
    return {
      data: packageData,
      error: Number(tid) === Number(currentTender) ? error : null,
    };
  }
  if (Number(tid) === Number(currentTender)) {
    return { data, error };
  }
  return { data: null, error: null };
};

export default getJobDataForPackage;
