/**
 * Normalizes analysis API error payload (FAILURE/UNPROCESSABLE or legacy) into a view model for the UI.
 * @param {Object} data - analysis.data from Redux (raw API response)
 * @returns {{ status: string, primaryMessage: string, suggestions: string[], canRetry: boolean, errorType?: string, technicalDetails?: string }}
 */
export default function normalizeAnalysisError(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      status: 'unknown',
      primaryMessage: 'The analysis could not be completed.',
      suggestions: [],
      canRetry: true,
    };
  }

  const status = data?.status === 'FAILURE' || data?.status === 'UNPROCESSABLE' ? data?.status : 'other';
  const primaryMessage =
    typeof data?.user_message === 'string' && data?.user_message?.trim()
      ? data.user_message.trim()
      : 'The analysis could not be completed.';
  const suggestions = Array.isArray(data?.suggestions)
    ? data?.suggestions
        .filter((s) => typeof s === 'string' && s?.trim()?.length > 0)
        .map((s) => s?.trim())
    : [];
  const errorType = typeof data?.error_type === 'string' ? data?.error_type : undefined;
  const technicalDetails =
    typeof data.error_message === 'string' && data?.error_message?.trim()
      ? data?.error_message?.trim()
      : undefined;

  return {
    status,
    primaryMessage,
    suggestions,
    canRetry: true,
    errorType,
    technicalDetails,
  };
}
