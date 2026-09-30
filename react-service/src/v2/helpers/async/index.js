import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';
import Relay from 'v2/services/relay';
import i18next from 'v2/helpers/i18n';

const messages1 = {
  company_name: 'The company name already exists',
  company_email: 'The company email already exists',
  email: 'The email already exists',
};
const messages2 = {
  company_name: 'profile-company-name',
  company_email: 'profile-company-email',
  email: 'email',
};
const resource = {
  company_email: 'company_checks/email_exists',
  email: 'company_checks/email_exists',
};
const callCompanies = async (value, setOptions = null) => {
  const companyNameFormatted = encodeURI(value.trim()).replaceAll('%20', '+');
  const results = await new Relay(
    `company_checks/search/${companyNameFormatted}`,
    '',
    ''
  ).getJson();

  if (results && results.found) {
    setOptions(results.companies);
  }
};
const checkCompanies = debounce(callCompanies, 250);
const callValid = async (
  value,
  name,
  setError,
  setValue,
  setOptions = null,
  pattern = null
) => {
  if (isEmpty(value)) {
    setError(`${i18next.t(messages2[name])} required`);
    return;
  }
  if (pattern) {
    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      setError('The email is not valid');
      return;
    }
  }
  let validation = { exists: false };
  if (resource[name]) {
    validation = await new Relay(
      `${resource[name]}/${value}`,
      '',
      ''
    ).getJson();
    if (
      !validation ||
      (validation &&
        !validation.exists &&
        (validation.status || validation.statusCode))
    ) {
      setError('Validation with the server failed');
      return;
    }
    if (validation && validation.exists) {
      setError(messages1[name]);
      return;
    }
  }
  setError(false);
  setValue();
  if (setOptions) {
    checkCompanies(value, setOptions);
  }
};
const checkValid = debounce(callValid, 250);

export { checkValid, messages1 };
