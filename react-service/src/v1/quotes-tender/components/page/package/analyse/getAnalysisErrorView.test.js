import getAnalysisErrorView from './getAnalysisErrorView';

describe('getAnalysisErrorView', () => {
  it('returns null when status is not failed', () => {
    expect(getAnalysisErrorView({ status: 'ready', packageData: null })).toBeNull();
  });

  it('normalizes package FAILURE payload', () => {
    const view = getAnalysisErrorView({
      status: 'failed',
      packageData: {
        status: 'FAILURE',
        user_message: 'Files missing',
        can_retry: true,
      },
    });
    expect(view.primaryMessage).toBe('Files missing');
  });

  it('uses reject payload message when job data was cleared', () => {
    const view = getAnalysisErrorView({
      status: 'failed',
      packageData: null,
      error: 'Error fetching tender data',
      errorPayload: { message: 'No Package found' },
    });
    expect(view.primaryMessage).toBe('No Package found');
    expect(view.canRetry).toBe(true);
  });

  it('normalizes 429 rate limit payload', () => {
    const view = getAnalysisErrorView({
      status: 'failed',
      packageData: null,
      errorPayload: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          type: 'rate_limit',
          message: 'Please wait 29 seconds before trying again.',
          retry_after_seconds: 29,
        },
      },
    });
    expect(view.primaryMessage).toBe('Please wait 29 seconds before trying again.');
    expect(view.errorType).toBe('rate_limit');
    expect(view.canRetry).toBe(true);
    expect(view.retryAfterSeconds).toBe(29);
  });

  it('normalizes 500 server error payload', () => {
    const view = getAnalysisErrorView({
      status: 'failed',
      packageData: null,
      errorPayload: {
        error: {
          code: 'UNKNOWN_ERROR',
          type: 'system_error',
          message: 'Something went wrong on our side.',
        },
      },
    });
    expect(view.primaryMessage).toBe('Something went wrong on our side.');
    expect(view.errorType).toBe('system_error');
    expect(view.canRetry).toBe(true);
  });

  it('shows HTTP error over cached SUCCESS when refresh fails', () => {
    const view = getAnalysisErrorView({
      status: 'failed',
      packageData: { status: 'SUCCESS', package_id: 1 },
      error: 'Please wait 40 seconds before trying again.',
      errorPayload: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          type: 'rate_limit',
          message: 'Please wait 40 seconds before trying again.',
          retry_after_seconds: 40,
        },
      },
    });
    expect(view.primaryMessage).toBe('Please wait 40 seconds before trying again.');
    expect(view.errorType).toBe('rate_limit');
  });

  it('normalizes 400 validation error payload', () => {
    const view = getAnalysisErrorView({
      status: 'failed',
      packageData: null,
      error: 'Missing analysis_type field',
      errorPayload: {
        httpStatus: 400,
        error: {
          code: 'VALIDATION_ERROR',
          type: 'validation_error',
          message: 'Missing analysis_type field',
        },
      },
    });
    expect(view.primaryMessage).toBe('Missing analysis_type field');
    expect(view.status).toBe('validation');
    expect(view.canRetry).toBe(true);
  });

  it('shows HTTP 429 over cached FAILURE job body', () => {
    const view = getAnalysisErrorView({
      status: 'failed',
      packageData: {
        status: 'FAILURE',
        user_message: 'The analysis could not be completed. Please try again or contact support.',
        suggestions: ['Try again once', 'Contact support if the issue continues'],
        can_retry: true,
      },
      error: 'An analysis for this package was started recently. Please wait 40 seconds before trying again.',
      errorPayload: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          type: 'rate_limit',
          message:
            'An analysis for this package was started recently. Please wait 40 seconds before trying again.',
          retry_after_seconds: 40,
        },
      },
    });
    expect(view.primaryMessage).toBe(
      'An analysis for this package was started recently. Please wait 40 seconds before trying again.',
    );
    expect(view.suggestions).toEqual(['Wait 40 seconds before trying again.']);
    expect(view.errorType).toBe('rate_limit');
  });

  it('always allows retry in UI when API sets can_retry false', () => {
    const view = getAnalysisErrorView({
      status: 'failed',
      packageData: {
        status: 'FAILURE',
        user_message: 'Could not parse file.',
        can_retry: false,
      },
    });
    expect(view.canRetry).toBe(true);
  });

  it('uses stored error string when reject payload is missing nested error', () => {
    const view = getAnalysisErrorView({
      status: 'failed',
      packageData: {
        status: 'FAILURE',
        user_message: 'The analysis could not be completed.',
      },
      error:
        'An analysis for this package was started recently. Please wait 40 seconds before trying again.',
      errorPayload: null,
    });
    expect(view.primaryMessage).toBe(
      'An analysis for this package was started recently. Please wait 40 seconds before trying again.',
    );
    expect(view.canRetry).toBe(true);
  });
});
