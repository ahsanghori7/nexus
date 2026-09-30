import { changeProsper } from './func';

const blockedUrls = [
  'login',
  'sign-up',
  'account/password',
  'request_login',
  'account/activation',
  'promo',
  'inbox',
  'inbox-app',
];
const found = blockedUrls.filter((u) => window.location.href.includes(u));

if (!found.length) {
  changeProsper();
}
