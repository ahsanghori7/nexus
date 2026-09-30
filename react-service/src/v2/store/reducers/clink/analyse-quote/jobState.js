import { getJobStateKeys } from './analysisTypes';
import { readPackageJob, readPackageJobMeta } from './jobMaps';

export { getJobStateKeys } from './analysisTypes';

export const selectJobSlice = (analysisState, type) => {
  const keys = getJobStateKeys(type);
  return {
    data: analysisState[keys.dataKey],
    error: analysisState[keys.errorKey],
    errorPayload: analysisState[keys.errorPayloadKey],
    seconds: analysisState[keys.secondsKey],
  };
};

/** Job for a specific package (per-package map + legacy global slot). */
export const selectPackageJob = (analysisState, packageId, type) => {
  const meta = readPackageJobMeta(analysisState, packageId, type);
  return {
    data: readPackageJob(analysisState, packageId, type),
    error: meta.error,
    errorPayload: meta.errorPayload,
    seconds: meta.seconds,
  };
};
