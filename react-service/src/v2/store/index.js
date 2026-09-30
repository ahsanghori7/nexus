import { configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
// eslint-disable-next-line import/no-extraneous-dependencies
import loggerMiddleware from 'redux-logger';
import monitorReducersEnhancer from './enhancers/monitorReducers';
import rootReducer from './reducers';

// TODO: Organize reducers folder
const developmentEnvs = ['development', 'staging', 'uat'];
export default function configureAppStore(app = 'admin', preloadedState = {}) {
  const middleware = [];
  const enhancers = [];
  if (developmentEnvs.includes(ENV)) {
    middleware.push(loggerMiddleware);
    enhancers.push(monitorReducersEnhancer);
  }
  return configureStore({
    reducer: rootReducer(app),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk,
      }).concat(middleware),
    preloadedState,
    enhancers,
  });
}
