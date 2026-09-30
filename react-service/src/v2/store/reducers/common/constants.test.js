import constants from './constants';

describe('common constants', () => {
  // Add tests here based on the constants
  it('should export IDLE_STATUS with the correct value', () => {
    expect(constants.IDLE_STATUS).toBe('idle');
  });

  it('should export LOADING_STATUS with the correct value', () => {
    expect(constants.LOADING_STATUS).toBe('loading');
  });

  it('should export SUCCESS_STATUS with the correct value', () => {
    expect(constants.SUCCESS_STATUS).toBe('success');
  });

  it('should export FAILURE_STATUS with the correct value', () => {
    expect(constants.FAILURE_STATUS).toBe('failure');
  });
});
