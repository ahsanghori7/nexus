import { handleUnauthorized } from 'v2/helpers/session';

class Relay {
  constructor(action, method, defaultParams) {
    this.action = action;
    this.method = method;
    this.defaultParams = defaultParams;
  }

  /**
   * @param object params
   * @returns {string}
   */
  getUrl(params) {
    const base = `${BASE_URLS.CLINK_APP_HOST}/relay?action={%a}&method={%m}`;
    let url = base.replace('{%a}', this.action).replace('{%m}', this.method);

    const urlParams = params || {};
    if (this.defaultParams) {
      Object.keys(this.defaultParams).forEach((k) => {
        if (!Object.prototype.hasOwnProperty.call(urlParams, k)) {
          urlParams[k] = this.defaultParams[k];
        }
      });
    }

    for (const [key, value] of Object.entries(urlParams)) {
      url += `&${key}=${value}`;
    }
    return url;
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
   * @param params
   * @returns {Promise<any>}
   */
  getJson(params) {
    return this.get(params).then((response) => response.json());
  }

  /**
   * @param object params
   * @returns {Promise<Response>}
   */
  get(params) {
    return this.call(this.getUrl(params), 'GET');
  }

  post(data, params) {
    return this.call(this.getUrl(params), 'POST', JSON.stringify(data), {
      'Content-Type': 'application/json',
    });
  }

  /**
   * @param data
   * @param params
   * @returns {Promise<Response>}
   */
  postForm(data, params) {
    const formData = new FormData();
    for (const k in data) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        formData.append(k, data[k]);
      }
    }
    return this.call(this.getUrl(params), 'POST', formData);
  }

  /**
   * @param data
   * @param params
   * @returns {Promise<Response>}
   */
  patch(data, params) {
    return this.call(this.getUrl(params), 'PATCH', JSON.stringify(data), {
      'Content-Type': 'application/json',
    });
  }

  /**
   * @param data
   * @param params
   * @returns {Promise<Response>}
   */
  put(data, params) {
    return this.call(this.getUrl(params), 'PUT', JSON.stringify(data), {
      'Content-Type': 'application/json',
    });
  }

  /**
   * @param action
   * @param method
   * @param params
   * @returns {Promise<Response>}
   */
  deleter(params) {
    return this.call(this.getUrl(params), 'DELETE');
  }

  error(data) {
    const errorRelay = new Relay('util', 'error');
    return errorRelay.post(
      Object.assign(data, { ref: `${this.action}_${this.method}` })
    );
  }
}

export default Relay;
