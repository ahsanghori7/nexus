import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'store';
import Router from './router';
import SessionExpiredModal from 'v2/apps/shared/components/SessionExpiredModal';

const store = configureStore(BASE_DIRS.V2.PROSPER);

const App = () => (
  <Provider store={store}>
    <Router />
    <SessionExpiredModal />
  </Provider>
);

export default App;
