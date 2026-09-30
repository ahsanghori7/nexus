import React, { useState } from 'react';
import { Error404 } from 'clink-components';
import { connect } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from 'v2/apps/prosper/pages/sign-up/form';
import Qualification from 'v2/apps/prosper/pages/sign-up/qualification';
import EmailCheck from 'v2/apps/prosper/pages/sign-up/EmailCheck';
import ThankYou from 'v2/apps/prosper/pages/sign-up/ThankYou';
import AlreadyActive from 'v2/apps/prosper/pages/sign-up/AlreadyActive';
import ReferenceApproval from 'v2/apps/prosper/pages/references-approval';
import Layout from 'v2/apps/prosper/layout';
import Login from 'v2/apps/shared/components/Login';
import ForgotPassword from 'v2/apps/prosper/pages/forgot-password';
import SocialActivation from 'v2/apps/prosper/pages/social-activation';
import PromoToken from 'v2/apps/prosper/pages/promo-tokens';
import Config from './config';

const ErrorComponent = () => {
  return <Error404 theme="prosper" />;
};
const Router = (props) => {
  const { subcontractor } = props;
  const configObj = new Config(subcontractor);
  const config = configObj.getMain();
  const redirects = configObj.getRedirects();

  const [codeRegion, setCodeRegion] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        {redirects.map((r) => (
          <Route
            key={`${r.path}-${r.to}`}
            path={r.path}
            element={<Navigate to={r.to} />}
          />
        ))}
        <Route element={<Layout routerConfig={config} />}>
          {config.map((routeConf) => {
            let flattenRoutes =
              (routeConf.routes &&
                routeConf.routes.flatMap((route) => {
                  const subRoutes = route.routes || [];
                  const subRoutesFormatted = subRoutes.map((subRoute) => ({
                    ...subRoute,
                    path: `${route.path}/${subRoute.path}`,
                  }));
                  return [route, ...subRoutesFormatted];
                })) ||
              [];
            // We filter the routes according to the user subscription ID
            if (subcontractor && subcontractor.subscription_id) {
              flattenRoutes = flattenRoutes.filter(
                (elem) =>
                  elem.filter &&
                  !elem.filter.includes(subcontractor.subscription_id)
              );
            }
            // We filter the routes according to the user country code
            if (
              subcontractor &&
              subcontractor.country &&
              subcontractor.country.code
            ) {
              flattenRoutes = flattenRoutes.filter(
                (elem) =>
                  elem.filterCountry &&
                  !elem.filterCountry.includes(subcontractor.country.code)
              );
            }

            return (
              <Route key={routeConf.path} path={routeConf.path}>
                {flattenRoutes.map((route) => (
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
        </Route>
        <Route
          path={BASE_URLS.ADMIN_LOGIN}
          element={<Login theme="prosper" app="PROSPER" />}
        />
        <Route
          path={BASE_URLS.SIGN_UP}
          element={
            <Qualification
              codeRegion={codeRegion}
              setCodeRegion={setCodeRegion}
            />
          }
        />
        <Route
          path={`${BASE_URLS.SIGN_UP}/form`}
          element={<SignUp codeRegion={codeRegion} />}
        />
        <Route
          path={`${BASE_URLS.PROSPER}${RELAY.HOST}/${RELAY.VERSION}${BASE_URLS.REFERENCE}/token/:token`}
          element={<ReferenceApproval />}
        />
        <Route
          path={`${BASE_URLS.SIGN_UP}/email-check/:token`}
          element={<EmailCheck />}
        />
        <Route path={`${BASE_URLS.SIGN_UP}/thank-you`} element={<ThankYou />} />
        <Route
          path={`${BASE_URLS.SIGN_UP}/contact-already-active`}
          element={<AlreadyActive />}
        />
        <Route
          path={`${BASE_URLS.PROSPER}${BASE_URLS.PROSPER_PASSWORD}/reset`}
          element={<ForgotPassword theme="prosper" />}
        />
        <Route
          path={`${BASE_URLS.PROSPER}/account/request_login`}
          element={<ForgotPassword theme="prosper" />}
        />
        <Route
          path={`${BASE_URLS.PROSPER}${BASE_URLS.PROSPER_PASSWORD}/new/:token`}
          element={<ForgotPassword theme="prosper" />}
        />
        <Route
          path={`${BASE_URLS.PROSPER}${BASE_URLS.PROSPER_ACCOUNT_ACTIVATION}/`}
          element={<SocialActivation />}
        />
        <Route
          element={<PromoToken isValid />}
          path={`${BASE_URLS.PROSPER}/promo/valid_token`}
        />
        <Route
          element={<PromoToken />}
          path={`${BASE_URLS.PROSPER}/promo/invalid_token`}
        />
        <Route path="*" element={<ErrorComponent />} />
      </Routes>
    </BrowserRouter>
  );
};

const mapStateToProps = (state) => {
  return {
    subcontractor: state.subcontractor,
  };
};

export default connect(mapStateToProps)(Router);
