import {
  AI_LIFECYCLE_STATUS,
  isAiLifecycleFailure,
  normalizeAiLifecycleStatus,
} from './boqAiStatus';

describe('boqAiStatus', () => {
  it('normalizes status to uppercase', () => {
    expect(normalizeAiLifecycleStatus('failure')).toBe('FAILURE');
    expect(normalizeAiLifecycleStatus('  success ')).toBe('SUCCESS');
  });

  it('detects FAILURE as Smart BoQ processing error', () => {
    expect(isAiLifecycleFailure('FAILURE')).toBe(true);
    expect(isAiLifecycleFailure('failure')).toBe(true);
    expect(isAiLifecycleFailure(AI_LIFECYCLE_STATUS.ERROR)).toBe(false);
    expect(isAiLifecycleFailure(AI_LIFECYCLE_STATUS.SUCCESS)).toBe(false);
  });
});
