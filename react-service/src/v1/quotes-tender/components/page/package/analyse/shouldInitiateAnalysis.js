import { isInProgressJobStatus, jobBelongsToPackage } from './packageJobScope';

/**
 * PATCH when starting/re-running; GET-only when resuming poll for an in-progress QSAI job.
 * Ignores localStorage — stale "started" flags must not skip PATCH after GET 404.
 */
const shouldInitiateAnalysis = ({ reset, packageData, tid }) => {
  if (reset) {
    return true;
  }
  if (!jobBelongsToPackage(packageData, tid)) {
    return true;
  }
  return !isInProgressJobStatus(packageData.status);
};

export default shouldInitiateAnalysis;
