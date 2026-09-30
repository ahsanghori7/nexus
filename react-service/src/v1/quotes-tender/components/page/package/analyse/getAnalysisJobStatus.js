import {
  isFailureJobStatus,
  isInProgressJobStatus,
  isSuccessJobStatus,
  jobBelongsToPackage,
} from './packageJobScope';
import {
  isRateLimitError,
  isAnalysisNotFoundError,
} from 'v2/store/reducers/clink/analyse-quote/httpErrors';

/**
 * Card status for quote levelling.
 * `data` must already be this package's job from selectPackageJob.
 * @returns {'not_run' | 'running' | 'ready' | 'failed'}
 */
const getAnalysisJobStatus = ({
  tid,
  data: packageData,
  error,
  analysisStarted,
  errorPayload,
  seconds = -1,
}) => {
  const status = packageData?.status;
  const belongsToPackage = jobBelongsToPackage(packageData, tid);

  if (
    isRateLimitError(errorPayload) &&
    seconds > 0 &&
    belongsToPackage &&
    isInProgressJobStatus(status)
  ) {
    return 'running';
  }

  if (error && !isAnalysisNotFoundError(errorPayload, error)) {
    return 'failed';
  }

  if (belongsToPackage && isFailureJobStatus(status)) {
    return 'failed';
  }
  if (belongsToPackage && isSuccessJobStatus(status)) {
    return 'ready';
  }
  if (belongsToPackage && isInProgressJobStatus(status)) {
    return 'running';
  }
  if (analysisStarted) {
    return 'not_run';
  }
  return 'not_run';
};

export default getAnalysisJobStatus;
