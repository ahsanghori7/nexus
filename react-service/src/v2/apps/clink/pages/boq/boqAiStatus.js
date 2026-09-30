/** Normalized ai/generate-boq lifecycle status from API (e.g. FAILURE, SUCCESS). */
export const normalizeAiLifecycleStatus = (status) =>
  String(status ?? '')
    .trim()
    .toUpperCase();

export const AI_LIFECYCLE_STATUS = {
  PENDING: 'PENDING',
  STARTED: 'STARTED',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  ERROR: 'ERROR',
  NOT_FOUND: 'NOT_FOUND',
};

/** Invalid/corrupt file or processing error — API returns `status: "FAILURE"`. */
export const isAiLifecycleFailure = (status) =>
  normalizeAiLifecycleStatus(status) === AI_LIFECYCLE_STATUS.FAILURE;
