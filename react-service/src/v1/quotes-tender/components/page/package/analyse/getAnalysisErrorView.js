import normalizeAnalysisError from './normalizeAnalysisError';
import normalizeHttpAnalysisError, {
  isRateLimitError,
  resolveApiError,
} from 'v2/store/reducers/clink/analyse-quote/httpErrors';
import { isFailureJobStatus } from './packageJobScope';

const messageFromPayload = (errorPayload, error) => {
  const apiError = resolveApiError(errorPayload);
  if (typeof apiError?.message === 'string' && apiError.message.trim()) {
    return apiError.message.trim();
  }
  if (typeof errorPayload?.message === 'string' && errorPayload.message.trim()) {
    return errorPayload.message.trim();
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }
  return null;
};

const resolveHttpRejectErrorView = (errorPayload, error) => {
  const httpError = normalizeHttpAnalysisError(errorPayload, error);
  if (httpError) {
    return httpError;
  }

  const primaryMessage = messageFromPayload(errorPayload, error);
  if (!primaryMessage) {
    return null;
  }

  const apiError = resolveApiError(errorPayload);
  return {
    status: isRateLimitError(errorPayload) ? 'rate_limit' : 'other',
    primaryMessage,
    suggestions: [],
    canRetry: true,
    errorType: typeof apiError?.type === 'string' ? apiError.type : undefined,
    retryAfterSeconds:
      typeof apiError?.retry_after_seconds === 'number'
        ? apiError.retry_after_seconds
        : undefined,
  };
};

const hasHttpReject = (error, errorPayload) =>
  Boolean(error || resolveApiError(errorPayload) || errorPayload?.message);

/**
 * Error view for failed analysis cards (API FAILURE body or start/fetch reject).
 */
const getAnalysisErrorView = ({ status, packageData, error, errorPayload }) => {
  if (status !== 'failed') {
    return null;
  }

  if (hasHttpReject(error, errorPayload)) {
    const httpRejectView = resolveHttpRejectErrorView(errorPayload, error);
    if (httpRejectView) {
      return httpRejectView;
    }
  }

  if (packageData && isFailureJobStatus(packageData.status)) {
    return normalizeAnalysisError(packageData);
  }

  if (packageData) {
    return normalizeAnalysisError(packageData);
  }

  return normalizeAnalysisError(null);
};

export { isRateLimitError };
export default getAnalysisErrorView;
