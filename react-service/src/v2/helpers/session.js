import Cookies from 'js-cookie';
import flag from 'v2/helpers/flags';
import { getUrlWithoutParamers } from 'v2/helpers/url';

const timeConfig = flag('SESSION_TIME') || 1000;
const tokenName = (ENV && `token_${ENV}`) || 'token_development';

export const SESSION_EXPIRED_KEY = 'session_expired_message';
export const SESSION_EXPIRED_EVENT = 'session:expired';
const DEFAULT_SESSION_EXPIRED_MESSAGE =
  'Your session has expired. Please log in again.';

/**
 * Called whenever a 401 Unauthorized response is received.
 * Stores the message in sessionStorage as a fallback for the login page,
 * then fires a DOM event so the mounted SessionExpiredModal can intercept
 * it and show a centred dialog before redirecting.
 * Guards against redirect loops by doing nothing when already on the
 * login or sign-up pages.
 */
export function handleUnauthorized(
  message = DEFAULT_SESSION_EXPIRED_MESSAGE,
) {
  const url = getUrlWithoutParamers();
  if (url.includes('login') || url.includes('sign-up')) {
    return;
  }
  sessionStorage.setItem(SESSION_EXPIRED_KEY, message);
  window.dispatchEvent(
    new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message } }),
  );
}

export default function listenCookieChange(
  callback = null,
  interval = timeConfig
) {
  const lastCookie = Cookies.get(tokenName);
  setInterval(() => {
    const url = getUrlWithoutParamers();
    if (!url.includes('sign-up') && !url.includes('login')) {
      const cookie = Cookies.get(tokenName);
      if (callback && cookie !== lastCookie) {
        callback();
      }
    }
  }, interval);
}
