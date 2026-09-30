import 'regenerator-runtime/runtime';
import 'bootstrap';
import 'bootstrap/scss/bootstrap.scss';
import 'v2/helpers/i18n';
import 'v2/helpers/i18n/changeLangOnLoad';
import './public/styles/index.scss';
import listenCookieChange from 'v2/helpers/session';
import { LicenseInfo } from '@mui/x-license';
import setClarity from 'v2/helpers/clarity';
import { goTo } from 'v2/helpers/url';
import { PHPAppClinkGloblals } from 'v2/helpers/php-globals';

const config = PHPAppClinkGloblals();
const hasInfo = config && config.info && config.info.id;

if (ENV && ENV !== 'development') {
  listenCookieChange(() => goTo('/login'));
}

let envs = ['production'];
if (CLARITY && CLARITY.DEBUG) {
  envs = ['staging', 'uat', 'production'];
}

if (CLARITY && CLARITY.PROJECT_ID && ENV && envs.includes(ENV)) {
  const set = () => {
    clarity('set', 'environment', ENV);
    clarity('set', 'account_id', String(hasInfo));
    clarity('set', 'app', 'app.c-link');
  };
  setClarity(set);
}

if (LICENSES && LICENSES.MUI_PRO) {
  LicenseInfo.setLicenseKey(LICENSES.MUI_PRO);
}
