import configureAppStore from './index';

// Mock dependencies
jest.mock('./reducers', () => ({
  __esModule: true,
  default: jest.fn(() => (action, state = {}) => state), // Mock rootReducer
}));

jest.mock('redux-logger', () => ({
  __esModule: true,
  default: jest.fn(() => () => (next) => (action) => next(action)), // Mock loggerMiddleware
}));

jest.mock('./enhancers/monitorReducers', () => ({
  __esModule: true,
  default: jest.fn((createStore) => (reducer, initialState, enhancer) => {
    const monitoredReducer = (state, action) => reducer(state, action);
    return createStore(monitoredReducer, initialState, enhancer);
  }), // Mock monitorReducersEnhancer
}));

describe('configureAppStore', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = global.ENV;
  });

  afterAll(() => {
    global.ENV = originalEnv;
  });

  it('should configure the store correctly in production environment', () => {
    global.ENV = 'production';
    const store = configureAppStore();
    expect(store).toBeDefined();
    // Add more specific assertions about middleware and enhancers if needed
  });

  it('should configure the store correctly in development environment', () => {
    global.ENV = 'development';
    const store = configureAppStore();
    expect(store).toBeDefined();
    // Add more specific assertions about middleware and enhancers if needed
  });
});
