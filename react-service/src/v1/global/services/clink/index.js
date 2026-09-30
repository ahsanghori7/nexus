import values from 'lodash/values';
import alertHelper from 'v1/global/helpers/alert';
import { getRelayUrl } from 'v2/helpers/url';
import { handleUnauthorized } from 'v2/helpers/session';
import { defaultOptions, fetchOptions, getConfig } from './options';
import ValidationSchemes from './validation-schemes';

class ClinkService {
  constructor(config = getConfig()) {
    const {
      initialValues,
      formFields,
      validationSchema,
      submitUrl,
      method,
      key,
    } = config;
    this._initialValues = initialValues;
    this._formFields = formFields;
    this._validationSchema = validationSchema;
    this._submitUrl = submitUrl;
    this._method = method;
    this._key = key;
    this._errorLogURL = `${BASE_URLS.CLINK_APP_HOST}/relay?action=util&method=error`;
    this._errorRef = `${key} Send Failure`;
    this._setError = null;
    this._setLoading = null;
    this.asyncCall = this.asyncCall.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.sendErrorObject = this.sendErrorObject.bind(this);
    this.submit = this.submit.bind(this);
    this.submitSuccess = this.submitSuccess.bind(this);
  }

  get initialValues() {
    return this._initialValues;
  }

  set initialValues(initialValues) {
    this._initialValues = initialValues;
  }

  get formFields() {
    return this._formFields;
  }

  set formFields(formFields) {
    this._formFields = formFields;
  }

  get validationSchema() {
    return this._validationSchema;
  }

  set validationSchema(validationSchema) {
    this._validationSchema = validationSchema;
  }

  get submitUrl() {
    return this._submitUrl;
  }

  set submitUrl(submitUrl) {
    this._submitUrl = submitUrl;
  }

  get method() {
    return this._method;
  }

  set method(method) {
    this._method = method;
  }

  get key() {
    return this._key;
  }

  set key(key) {
    this._key = key;
  }

  get errorLogURL() {
    return this._errorLogURL;
  }

  set errorLogURL(errorLogURL) {
    this._errorLogURL = errorLogURL;
  }

  get errorRef() {
    return this._errorRef;
  }

  set errorRef(errorRef) {
    this._errorRef = errorRef;
  }

  get setError() {
    return this._setError;
  }

  set setError(setError) {
    this._setError = setError;
  }

  get setLoading() {
    return this._setLoading;
  }

  set setLoading(setLoading) {
    this._setLoading = setLoading;
  }

  static transformToArray(object) {
    return typeof object === 'object' ? values(object) : object;
  }

  submitSuccess(response) {
    if (this.method === 'DELETE' && response.ok && response.status === 200) {
      return { success: true };
    }
    try {
      return response.json();
    } catch (errorMessage) {
      return this.sendErrorObject({ error: response }).then(() => {
        this.submitError({ error: errorMessage });
      });
    }
  }

  submitError(error) {
    return { error };
  }

  sendErrorObject(error) {
    return fetch(
      this.errorLogURL,
      fetchOptions(
        {
          error,
          ref: this.errorRef,
        },
        'POST'
      )
    )
      .then(() => {
        this.submitError(error);
      })
      .catch(this.submitError);
  }

  handleSubmit(data) {
    return data;
  }

  async asyncCall(data, options = null) {
    return fetch(this.submitUrl, fetchOptions(data, this.method, options))
      .then((response) => {
        if (response.status === 401) {
          handleUnauthorized();
          return new Promise(() => {});
        }
        return this.submitSuccess(response);
      })
      .catch(this.sendErrorObject);
  }

  makeRequest(data, resolve, loading = true) {
    const promise = this.asyncCall(data ?? {});
    if (loading && this.setLoading) {
      this.setLoading(true);
    }
    return promise.then(resolve).catch((error) => {
      if (this.setError) {
        this.setError(error);
      }
    });
  }

  // TODO: add error checking
  async submit(data = {}, actions = null, options = null) {
    const response = await this.asyncCall(data, options);
    actions.setSubmitting(false);
    return this.handleSubmit(response, actions);
  }

  alert(response, callback, optionsSuccess, optionsError) {
    alertHelper(response, callback, optionsSuccess, optionsError);
  }

  relayUrl(action, method, params) {
    return getRelayUrl(action, method, params);
  }
}

export default ClinkService;
export { defaultOptions, fetchOptions, getConfig, ValidationSchemes };
