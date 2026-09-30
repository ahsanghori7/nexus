import React from 'react';
import { Error404 } from 'clink-components';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'store';
import routerConfig from './router';
import useFeatureFlag from 'v2/hooks/useFeatureFlag';
import { SnackbarProvider } from 'v2/contexts/SnackbarContext';
import GlobalSnackbar from 'v2/components/GlobalSnackbar';
import SessionExpiredModal from 'v2/apps/shared/components/SessionExpiredModal';

const constextName = BASE_DIRS.V2.CLINK;
const store = configureStore(constextName);

const ErrorComponent = () => (
  <Error404
    theme="clink"
    error="An Error has occurred"
    title="Unfortunately the page you are looking for is no longer available"
    href="/main-contractor"
    whoops={false}
    parragraph={null}
  />
);

const Router = () => {
  const { checkFeature } = useFeatureFlag();
  const includeTenderRoutes = checkFeature('TENDER_RECOMMENDATION');

  return (
    <BrowserRouter>
      <Routes>
        {routerConfig.map((routeConf) => {
          const { path } = routeConf;
          const flattenRoutes =
            (routeConf.routes &&
              routeConf.routes.flatMap((route) => {
                const subRoutes = route.routes || [];
                const subRoutesFormatted = subRoutes.map((subRoute) => ({
                  ...subRoute,
                  path: `${path}/${route.path}/${subRoute.path}`,
                }));
                return [
                  { ...route, path: `${path}/${route.path}` },
                  ...subRoutesFormatted,
                ];
              })) ||
            [];

          const filteredRoutes = flattenRoutes.filter((route) => {
            if (route.path.includes('tender_recommendations')) {
              return includeTenderRoutes;
            }
            return true;
          });

          return (
            <Route key={routeConf.path} path={routeConf.path}>
              {filteredRoutes.map((route) => (
                <Route
                  key={route.path || `${routeConf.path}-index`}
                  index={route.index}
                  path={route.path}
                  element={route.element}
                />
              ))}
            </Route>
          );
        })}
        <Route path="*" element={<ErrorComponent />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <SnackbarProvider>
        <Router />
        <GlobalSnackbar />
        <SessionExpiredModal />
      </SnackbarProvider>
    </Provider>
  );
};
export default App;
