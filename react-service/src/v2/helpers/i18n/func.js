import i18next from 'v2/helpers/i18n';
import { PHPAppClinkGloblals } from 'v2/helpers/php-globals';
import { handleUnauthorized } from 'v2/helpers/session';

/* eslint no-console: "off" */
const change = async () => {
  console.log('Checking language by region...');
  const config = PHPAppClinkGloblals();
  if (config?.info?.country?.code) {
    i18next.changeLanguage(config.info.country.code);
    console.log('Done');
  }
};

/* eslint no-console: "off" */
const changeProsper = async () => {
  console.log('Checking language by region...');
  return fetch('/subcontractor/info')
    .then((result) => {
      if (result.status === 401) {
        handleUnauthorized();
        return new Promise(() => {});
      }
      return result.json();
    })
    .then((payload) => {
      if (payload?.country?.code) {
        i18next.changeLanguage(payload.country.code);
        console.log('Done');
        return payload.country.code;
      }
      console.log("User doesn't have country code");
      return false;
    })
    .catch((e) => {
      console.error('Error calling user info endpoint:', e);
      return false;
    });
};

export { change, changeProsper };
