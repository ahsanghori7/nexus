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
 * Card UI status for tender analysis.
 * `data` must already be this package's job from selectPackageJob / usePackageAnalysisJob.
 * @returns {'not_run' | 'running' | 'ready' | 'failed'}
 */
const getTenderAnalysisCardStatus = ({
  tid,
  data: packageData,
  error,
  analysisStarted,
  errorPayload,
  seconds = -1,
}) => {
  const analysisStatus = packageData?.status;
  const belongsToPackage = jobBelongsToPackage(packageData, tid);

  if (
    isRateLimitError(errorPayload) &&
    seconds > 0 &&
    belongsToPackage &&
    isInProgressJobStatus(analysisStatus)
  ) {
    return 'running';
  }

  if (error && !isAnalysisNotFoundError(errorPayload, error)) {
    return 'failed';
  }

  if (belongsToPackage && isFailureJobStatus(analysisStatus)) {
    return 'failed';
  }
  if (belongsToPackage && isSuccessJobStatus(analysisStatus)) {
    return 'ready';
  }
  if (belongsToPackage && isInProgressJobStatus(analysisStatus)) {
    return 'running';
  }
  if (analysisStarted) {
    return 'not_run';
  }
  return 'not_run';
};

export default getTenderAnalysisCardStatus;
