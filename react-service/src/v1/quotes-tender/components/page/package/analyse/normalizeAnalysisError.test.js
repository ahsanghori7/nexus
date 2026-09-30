import normalizeAnalysisError from './normalizeAnalysisError';

describe('normalizeAnalysisError', () => {
  const fallbackMessage = 'The analysis could not be completed.';

  const fallbackShape = {
    status: 'unknown',
    primaryMessage: fallbackMessage,
    suggestions: [],
    canRetry: true,
    errorType: undefined,
    technicalDetails: undefined,
  };

  it('returns fallback view model for null/undefined', () => {
    expect(normalizeAnalysisError(null)).toEqual(fallbackShape);
    expect(normalizeAnalysisError(undefined)).toEqual(fallbackShape);
  });

  it('returns fallback for non-object input', () => {
    expect(normalizeAnalysisError('string')).toEqual(fallbackShape);
  });

  it('returns fallback for array input', () => {
    expect(normalizeAnalysisError([])).toEqual(fallbackShape);
  });

  it('normalizes FAILURE with full structured payload (token_limit)', () => {
    const data = {
      analysis_id: 123,
      package_id: 456,
      status: 'FAILURE',
      error_type: 'token_limit',
      user_message:
        'The combined content of your documents is too large to process.',
      can_retry: false,
      suggestions: [
        'Remove non-essential pages (cover pages, appendices)',
        'Extract and upload only the pricing/commercial sections',
      ],
      error_message: 'input length and max_tokens exceed context limit',
    };
    expect(normalizeAnalysisError(data)).toEqual({
      status: 'FAILURE',
      primaryMessage: data.user_message,
      suggestions: data.suggestions,
      canRetry: true,
      errorType: 'token_limit',
      technicalDetails: data.error_message,
    });
  });

  it('normalizes FAILURE with can_retry false as always retryable in UI', () => {
    const data = {
      status: 'FAILURE',
      error_type: 'token_limit',
      user_message: 'Too large.',
      can_retry: false,
      suggestions: [],
    };
    expect(normalizeAnalysisError(data).canRetry).toBe(true);
  });

  it('normalizes FAILURE with ai_service (can_retry true)', () => {
    const data = {
      status: 'FAILURE',
      error_type: 'ai_service',
      user_message:
        'The AI service is temporarily unavailable. Please try again in a few minutes.',
      can_retry: true,
      suggestions: ['Wait a few minutes before retrying'],
      error_message: 'Error code: 529 - Overloaded',
    };
    expect(normalizeAnalysisError(data)).toEqual({
      status: 'FAILURE',
      primaryMessage: data.user_message,
      suggestions: data.suggestions,
      canRetry: true,
      errorType: 'ai_service',
      technicalDetails: data.error_message,
    });
  });

  it('normalizes UNPROCESSABLE status', () => {
    const data = {
      status: 'UNPROCESSABLE',
      user_message: 'The request could not be processed.',
      can_retry: false,
    };
    expect(normalizeAnalysisError(data)).toEqual({
      status: 'UNPROCESSABLE',
      primaryMessage: data.user_message,
      suggestions: [],
      canRetry: true,
      errorType: undefined,
      technicalDetails: undefined,
    });
  });

  it('normalizes legacy error (no error_type)', () => {
    const data = {
      status: 'FAILURE',
      user_message: 'The analysis could not be completed.',
      suggestions: ['If the issue persists, please contact support.'],
      can_retry: false,
    };
    expect(normalizeAnalysisError(data)).toMatchObject({
      status: 'FAILURE',
      primaryMessage: data.user_message,
      suggestions: data.suggestions,
      canRetry: true,
    });
  });

  it('uses fallback when user_message is missing or empty', () => {
    expect(
      normalizeAnalysisError({ status: 'FAILURE', user_message: '' }),
    ).toMatchObject({ status: 'FAILURE', primaryMessage: fallbackMessage });
    expect(
      normalizeAnalysisError({ status: 'FAILURE' }),
    ).toMatchObject({ status: 'FAILURE', primaryMessage: fallbackMessage });
  });

  it('omits technicalDetails when error_message is empty/whitespace', () => {
    const data = {
      status: 'FAILURE',
      user_message: 'Some error',
      error_message: '   ',
    };
    expect(normalizeAnalysisError(data).technicalDetails).toBeUndefined();
  });

  it('filters non-string and empty suggestions and trims strings', () => {
    const data = {
      status: 'FAILURE',
      user_message: 'Error',
      suggestions: ['Valid', 123, '', '  Also valid  ', '  '],
    };
    expect(normalizeAnalysisError(data).suggestions).toEqual([
      'Valid',
      'Also valid',
    ]);
  });

  it('treats non-FAILURE/UNPROCESSABLE status as other', () => {
    expect(normalizeAnalysisError({ status: 'SUCCESS' }).status).toBe('other');
  });
});
