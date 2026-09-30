import React from 'react';
import { Login as LoginComponent, Page } from 'clink-components';
import Loading from 'v2/apps/shared/components/Loading';
import PHPGloblals from 'v2/helpers/php-globals';

function Login(props) {
  const conf = PHPGloblals();
  let csfr = false;
  let message = null;
  if (conf && conf.csfr) {
    csfr = {
      name: 'csfr_token',
      value: conf.csfr,
    };
  }
  if (conf && conf.messages && conf.messages.error) {
    message = conf.messages.error;
  }
  const requestLogin = `${BASE_URLS.PROSPER}/account/request_login`;
  return (
    <Page noMarginTop>
      {message && <Loading status="error" message={message} />}
      <LoginComponent
        theme={props.theme}
        method="post"
        action="login/validate"
        csrf={csfr}
        app={props.app}
        forgotPasswordLink={`${BASE_URLS.PROSPER}${BASE_URLS.PROSPER_PASSWORD}/reset`}
        requestLoginLink={requestLogin}
      />
    </Page>
  );
}

export default Login;
