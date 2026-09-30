export const RATE_LIMIT_ERROR_CODE = 'RATE_LIMIT_EXCEEDED';

export const resolveApiError = (errorPayload) => {
  if (!errorPayload || typeof errorPayload !== 'object') {
    return null;
  }
  if (errorPayload.error && typeof errorPayload.error === 'object') {
    return errorPayload.error;
  }
  if (typeof errorPayload.code === 'string' && typeof errorPayload.message === 'string') {
    return errorPayload;
  }
  return null;
};

export const isRateLimitError = (errorPayload) => {
  const apiError = resolveApiError(errorPayload);
  return apiError?.code === RATE_LIMIT_ERROR_CODE;
};

export const isServerError = (errorPayload) => {
  const apiError = resolveApiError(errorPayload);
  const errorType = apiError?.type;
  const errorCode = apiError?.code;
  return (
    errorType === 'system_error' ||
    errorCode === 'UNKNOWN_ERROR' ||
    errorCode === 'SERVICE_UNAVAILABLE' ||
    Number(errorPayload?.httpStatus) >= 500
  );
};

export const isValidationError = (errorPayload) => {
  const apiError = resolveApiError(errorPayload);
  return (
    apiError?.type === 'validation_error' ||
    apiError?.code === 'VALIDATION_ERROR' ||
    Number(errorPayload?.httpStatus) === 422
  );
};

export const isBadRequestError = (errorPayload) =>
  Number(errorPayload?.httpStatus) === 400;

/** User-facing message from HTTP reject payload or legacy error string. */
export const resolveAnalysisErrorMessage = (
  errorPayload,
  error,
  fallback = 'The analysis could not be completed.',
) => {
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
  return fallback;
};

/** GET initiate returned 404 — no QSAI job exists yet for this package/type. */
export const isAnalysisNotFoundError = (errorPayload, errorMessage) => {
  if (errorPayload?.httpStatus === 404 || Number(errorPayload?.status) === 404) {
    return true;
  }

  const apiError = resolveApiError(errorPayload);
  const code = apiError?.code ?? errorPayload?.code;
  if (code === 'NOT_FOUND' || code === 'RESOURCE_NOT_FOUND') {
    return true;
  }

  const message = (
    apiError?.message ||
    errorPayload?.message ||
    errorMessage ||
    ''
  )
    .toString()
    .toLowerCase();

  return message.includes('not found') || message.includes('404');
};

const buildRateLimitSuggestions = (retryAfterSeconds) => {
  if (typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0) {
    return [`Wait ${retryAfterSeconds} seconds before trying again.`];
  }
  return [];
};

const resolveErrorStatus = (isRateLimit, isServer, isValidation) => {
  if (isRateLimit) {
    return 'rate_limit';
  }
  if (isServer) {
    return 'server_error';
  }
  if (isValidation) {
    return 'validation';
  }
  return 'other';
};

const resolveErrorSuggestions = (isRateLimit, retryAfterSeconds, apiError) => {
  if (isRateLimit) {
    return buildRateLimitSuggestions(retryAfterSeconds);
  }
  if (Array.isArray(apiError.suggestions)) {
    return apiError.suggestions.filter((s) => typeof s === 'string' && s.trim());
  }
  return [];
};

/**
 * Normalizes HTTP error bodies from quote analysis initiate GET/PATCH.
 */
const normalizeHttpAnalysisError = (errorPayload, error) => {
  const apiError = resolveApiError(errorPayload);
  if (!apiError || typeof apiError !== 'object') {
    return null;
  }

  const isRateLimit = isRateLimitError(errorPayload);
  const isServer = isServerError(errorPayload);
  const isValidation = isValidationError(errorPayload);
  const retryAfterSeconds =
    typeof apiError.retry_after_seconds === 'number'
      ? apiError.retry_after_seconds
      : undefined;

  return {
    status: resolveErrorStatus(isRateLimit, isServer, isValidation),
    primaryMessage: resolveAnalysisErrorMessage(errorPayload, error),
    suggestions: resolveErrorSuggestions(isRateLimit, retryAfterSeconds, apiError),
    canRetry: true,
    errorType: typeof apiError.type === 'string' ? apiError.type : undefined,
    retryAfterSeconds,
  };
};

export default normalizeHttpAnalysisError;
