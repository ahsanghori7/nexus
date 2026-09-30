import reducer from './index';

describe('prosper token reducer', () => {
  // Add tests here based on the reducer logic
  it('should handle initial state', () => {
    const initialState = {}; // Define your initial state
    const newState = reducer(initialState, {}); // Pass an empty action
    expect(newState).toEqual(initialState);
  });
});
