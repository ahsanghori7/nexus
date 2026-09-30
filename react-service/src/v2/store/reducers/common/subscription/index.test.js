import reducer, { fetchSubscriptions, changeSubscription } from './index';

describe('common subscription reducer', () => {
  const initialState = {
    subscriptionsList: [],
  };

  it('should handle initial state', () => {
    const newState = reducer(undefined, { type: 'unknown' });
    expect(newState).toEqual(initialState);
  });

  it('should export fetchSubscriptions action creator', () => {
    expect(fetchSubscriptions).toBeDefined();
    expect(typeof fetchSubscriptions).toBe('function');
  });

  it('should export changeSubscription action creator', () => {
    expect(changeSubscription).toBeDefined();
    expect(typeof changeSubscription).toBe('function');
  });

  it('should maintain state for unknown actions', () => {
    const currentState = { subscriptionsList: ['test'] };
    const newState = reducer(currentState, { type: 'unknown' });
    expect(newState).toEqual(currentState);
  });
});
