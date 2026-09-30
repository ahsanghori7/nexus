import 'reset-css';
import 'v2/helpers/i18n';
import 'assets/styles/index.scss';
import listenCookieChange from 'v2/helpers/session';
import { LicenseInfo } from '@mui/x-license';
import { goTo } from 'v2/helpers/url';

if (ENV && ENV !== 'development') {
  listenCookieChange(() => goTo('/login'));
}

if (LICENSES && LICENSES.MUI_PRO) {
  LicenseInfo.setLicenseKey(LICENSES.MUI_PRO);
}
