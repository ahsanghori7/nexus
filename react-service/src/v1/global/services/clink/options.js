import isEmpty from 'lodash/isEmpty';
import * as Yup from 'yup';

const defaultOptions = {
  mode: 'cors', // no-cors, *cors, same-origin
  cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  credentials: 'same-origin', // include, *same-origin, omit
  headers: {
    'Content-Type': 'application/json',
    // 'Content-Type': 'application/x-www-form-urlencoded',
  },
  redirect: 'follow', // manual, *follow, error
  referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
};

const fetchOptions = (data = {}, method = 'POST', options = null) => {
  const optionsObject =
    options === null
      ? {
          method,
          ...defaultOptions,
        }
      : {
          ...defaultOptions,
          ...options,
          method,
        };

  if (!isEmpty(data) && method !== 'GET') {
    optionsObject.body = JSON.stringify(data);
  }
  return optionsObject;
};

/* eslint no-console: "off" */
const defaultConfig = {
  initialValues: {},
  formFields: [],
  validationSchema: Yup.object(),
  submitUrl: 'https://pokeapi.co/api/v2/pokemon/ditto',
  method: 'GET',
  key: 'service',
};

const getConfig = (configValues = {}) => ({
  ...defaultConfig,
  ...configValues,
});

export { defaultOptions, fetchOptions, getConfig };
