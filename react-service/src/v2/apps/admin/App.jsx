import React from 'react';
import { Error404 } from 'clink-components';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'store';
import Login from 'v2/apps/shared/components/Login';
import Layout from './Layout';
import { routerAdminConfig, routerProsperConfig } from './router';
import { SnackbarProvider } from 'v2/contexts/SnackbarContext';
import GlobalSnackbar from 'v2/components/GlobalSnackbar';
import SessionExpiredModal from 'v2/apps/shared/components/SessionExpiredModal';

const store = configureStore(BASE_DIRS.V2.ADMIN);

const themeName = 'pegasus';
const ErrorComponent = () => <Error404 theme={themeName} />;
const App = () => {
  return (
    <Provider store={store}>
      <SnackbarProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout routerConfig={routerAdminConfig} />}>
              {routerAdminConfig.map((routeConf) => (
                <Route key={routeConf.path} path={routeConf.path}>
                  {routeConf.routes &&
                    routeConf.routes.map((route) => (
                      <Route
                        key={route.path || `${routeConf.path}-index`}
                        index={route.index}
                        path={route.path}
                        element={route.element}
                      />
                    ))}
                </Route>
              ))}
            </Route>
            <Route
              element={
                <Layout
                  routerConfig={routerProsperConfig}
                  contextType="adminProsper"
                />
              }
            >
              {routerProsperConfig.map((routeConf) => (
                <Route key={routeConf.path} path={routeConf.path}>
                  {routeConf.routes &&
                    routeConf.routes.map((route) => (
                      <Route
                        key={route.path || `${routeConf.path}-index`}
                        index={route.index}
                        path={route.path}
                        element={route.element}
                      />
                    ))}
                </Route>
              ))}
            </Route>
            <Route
              path={BASE_URLS.ADMIN_LOGIN}
              element={<Login theme={themeName} app="ADMIN" />}
            />
            <Route path="*" element={<ErrorComponent />} />
          </Routes>
        </BrowserRouter>
        <GlobalSnackbar />
        <SessionExpiredModal />
      </SnackbarProvider>
    </Provider>
  );
};

export default App;
