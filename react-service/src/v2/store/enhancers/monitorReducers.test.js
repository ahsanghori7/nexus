import monitorReducerEnhancer from './monitorReducers';
import { createStore } from 'redux';

describe('monitorReducerEnhancer', () => {
  let originalPerformanceNow;
  let originalConsoleLog;

  beforeAll(() => {
    originalPerformanceNow = performance.now;
    originalConsoleLog = console.log; // eslint-disable-line no-console
    performance.now = jest.fn();
    console.log = jest.fn(); // eslint-disable-line no-console
  });

  afterAll(() => {
    performance.now = originalPerformanceNow;
    console.log = originalConsoleLog; // eslint-disable-line no-console
  });

  it('should wrap the reducer and log processing time', () => {
    const mockReducer = jest.fn((state, action) => {
      if (action.type === 'TEST_ACTION') {
        return { ...state, test: true };
      }
      return state;
    });
    const mockInitialState = { initial: true };
    const mockEnhancer = (next) => (...args) => next(...args); // Basic mock enhancer

    performance.now.mockReturnValueOnce(100).mockReturnValueOnce(200);

    const store = createStore(mockReducer, mockInitialState, monitorReducerEnhancer(mockEnhancer));

    store.dispatch({ type: 'TEST_ACTION' });

    expect(mockReducer).toHaveBeenCalledTimes(2); // Called once for initial state, once for dispatch
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalledWith('reducer process time:', 100); // 200 - 100 = 100
    expect(store.getState()).toEqual({ initial: true, test: true });
  });
});
