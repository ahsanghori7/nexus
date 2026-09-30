import { getRelayUrl } from 'v2/helpers/url';
import { handleUnauthorized } from 'v2/helpers/session';

const fetchExistValidation = async (url) => {
  return new Promise((resolve) => {
    fetch(url)
      .then((response) => {
        if (response.status === 401) {
          handleUnauthorized();
          resolve(false);
          return null;
        }
        return response.json();
      })
      .then((json) => {
        if (!json) return;
        const { exists } = json;
        resolve(!exists);
      })
      .catch(() => {
        resolve(false);
      });
  });
};

const companyExistsAsync = (basicText) =>
  basicText.test({
    message: 'Company already exists',
    test: async (companyValue) => {
      if (companyValue) {
        const url = getRelayUrl('account', 'companyExists', {
          company: companyValue,
        });
        return fetchExistValidation(url);
      }
      return false;
    },
  });

const emailExistsAsync = (email) =>
  email.test({
    message: 'Email already exists',
    test: async (emailValue) => {
      if (emailValue) {
        const url = getRelayUrl('account', 'emailExists', {
          email: emailValue,
        });
        return fetchExistValidation(url);
      }
      return false;
    },
  });

export { companyExistsAsync, emailExistsAsync };
