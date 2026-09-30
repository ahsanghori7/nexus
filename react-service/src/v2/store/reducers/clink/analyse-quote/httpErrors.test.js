import {
  isAnalysisNotFoundError,
  isRateLimitError,
  isValidationError,
  resolveAnalysisErrorMessage,
  RATE_LIMIT_ERROR_CODE,
} from './httpErrors';

describe('httpErrors', () => {
  describe('isAnalysisNotFoundError', () => {
    it('returns true for httpStatus 404 on payload', () => {
      expect(
        isAnalysisNotFoundError({ httpStatus: 404, error: { message: 'Not Found' } }, null),
      ).toBe(true);
    });

    it('returns true for NOT_FOUND error code', () => {
      expect(
        isAnalysisNotFoundError(
          { error: { code: 'NOT_FOUND', message: 'Analysis not found' } },
          null,
        ),
      ).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(
        isAnalysisNotFoundError(
          { error: { code: 'UNKNOWN_ERROR', message: 'Server error' } },
          'Server error',
        ),
      ).toBe(false);
    });
  });

  describe('isRateLimitError', () => {
    it('returns true for rate limit code', () => {
      expect(
        isRateLimitError({
          error: { code: RATE_LIMIT_ERROR_CODE },
        }),
      ).toBe(true);
    });
  });

  describe('isValidationError', () => {
    it('returns true for validation_error type', () => {
      expect(
        isValidationError({
          httpStatus: 400,
          error: { code: 'VALIDATION_ERROR', type: 'validation_error' },
        }),
      ).toBe(true);
    });
  });

  describe('resolveAnalysisErrorMessage', () => {
    it('returns nested error message from structured payload', () => {
      expect(
        resolveAnalysisErrorMessage(
          {
            error: { message: 'Missing tender_data field' },
          },
          null,
        ),
      ).toBe('Missing tender_data field');
    });
  });
});
