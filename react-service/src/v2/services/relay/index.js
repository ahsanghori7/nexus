import isEmpty from 'lodash/isEmpty';
import { handleUnauthorized } from 'v2/helpers/session';

class Relay {
  /**
   * @param version: string
   * @param resource: string
   * @param host: string
   */
  constructor(resource, version = RELAY.VERSION, host = RELAY.HOST) {
    this.version = version;
    this.resource = resource;
    this.host = host;
  }

  buildServiceUrl() {
    const url = (this.host || '').endsWith('/')
      ? (this.host || '').slice(0, -1)
      : this.host || '';
    const version = (this.version || '').endsWith('/')
      ? (this.version || '').slice(0, -1)
      : this.version || '';
    const resource = (this.resource || '').endsWith('/')
      ? (this.resource || '').slice(0, -1)
      : this.resource || '';

    return `${url}${version ? '/' : ''}${version}/${resource}`;
  }

  /**
   * @param method
   * @param params
   * @returns {string}
   */
  getUrl(method = false, params = false) {
    const base = this.buildServiceUrl();
    const urlMethod = (method && `/${method}`) || '';
    const urlParams =
      (params && !isEmpty(params) && `?${new URLSearchParams(params)}`) || '';
    return `${base}${urlMethod}${urlParams}`;
  }

  /**
   *
   * @param url
   * @param type
   * @param data
   * @param headers
   * @returns {Promise<Response>}
   */
  call(url, type, data, headers) {
    const options = {
      method: type.toUpperCase(),
    };
    if (headers) {
      options.headers = headers;
    }
    if (data) {
      options.body = data;
    }

    return fetch(url, options).then((response) => {
      if (response.status === 401) {
        handleUnauthorized();
        return new Promise(() => {});
      }
      return response;
    });
  }

  /**
   * @param method
   * @param params
   * @returns {Promise<any>}
   */
  getJson(method, params) {
    return this.get(params).then((response) => response.json());
  }

  /**
   * @param method
   * @param params
   * @returns {Promise<Response>}
   */
  get(method, params) {
    return this.call(this.getUrl(method, params), 'GET');
  }

  /**
   * @param data
   * @param method
   * @param params
   * @returns {Promise<Response>}
   */
  post(data, method, params, headers = {}) {
    return this.call(
      this.getUrl(method, params),
      'POST',
      JSON.stringify(data),
      { 'Content-Type': 'application/json', ...headers }
    );
  }

  /**
   * @param data
   * @param method
   * @param params
   * @param headers
   * @returns {Promise<Response>}
   */
  postForm(data, method, params, headers = {}) {
    const formData = new FormData();
    for (const k in data) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        let value = data[k] || '';

        // Trim email
        if (k === 'email') {
          value = value.trim();
        }

        // Check for files
        if (
          typeof value === 'object' &&
          Object.prototype.hasOwnProperty.call(value, 0) &&
          typeof value[0].name === 'string'
        ) {
          const fileSetKeys = Object.keys(value);
          if (fileSetKeys.length > 1) {
            for (let index = 0; index < fileSetKeys.length; index++) {
              formData.append(`${k}[]`, value[index]);
            }
          } else {
            value = value[0];
            formData.append(k, value);
          }
        } else {
          formData.append(k, value);
        }
      }
    }
    return this.call(this.getUrl(method, params), 'POST', formData, headers);
  }

  /**
   * @param data
   * @param method
   * @param params
   * @param headers
   * @returns {Promise<Response>}
   */
  patch(data, method, params, headers = {}) {
    return this.call(
      this.getUrl(method, params),
      'PATCH',
      JSON.stringify(data),
      { 'Content-Type': 'application/json', ...headers }
    );
  }

  /**
   * @param data
   * @param method
   * @param params
   * @param headers
   * @returns {Promise<Response>}
   */
  patchForm(data, method, params, headers = {}) {
    const formData = new FormData();
    for (const k in data) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        let value = data[k] || '';
        // Check for files
        if (
          typeof value === 'object' &&
          Object.prototype.hasOwnProperty.call(value, 0) &&
          typeof value[0].name === 'string'
        ) {
          const fileSetKeys = Object.keys(value);
          if (fileSetKeys.length > 1) {
            for (let index = 0; index < fileSetKeys.length; index++) {
              formData.append(`${k}[]`, value[index]);
            }
          } else {
            // eslint-disable-next-line prefer-destructuring
            value = value[0];
            formData.append(k, value);
          }
        } else {
          formData.append(k, value);
        }
      }
    }
    return this.call(this.getUrl(method, params), 'PATCH', formData, headers);
  }

  /**
   * @param data
   * @param method
   * @param params
   * @param headers
   * @returns {Promise<Response>}
   */
  put(data, method, params, headers = {}) {
    return this.call(this.getUrl(method, params), 'PUT', JSON.stringify(data), {
      'Content-Type': 'application/json',
      ...headers,
    });
  }

  /**
   * @param method
   * @param params
   * @param data
   * @param headers
   * @returns {Promise<Response>}
   */
  deleter(method, params, data, headers = {}) {
    return this.call(
      this.getUrl(method, params),
      'DELETE',
      JSON.stringify(data),
      {
        'Content-Type': 'application/json',
        ...headers,
      }
    );
  }

  // TODO
  // error(data) {
  //   const errorRelay = new Relay("util", "error")
  //   return errorRelay.post(Object.assign(data, {"ref" : `${this.action}_${this.method}`}));
  // }
}

export default Relay;
