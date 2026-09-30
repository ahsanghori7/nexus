import GlobalService from './clink';
import { handleUnauthorized } from 'v2/helpers/session';

const fileConfig = {
  submitUrl: '',
  method: 'POST',
};

class File extends GlobalService {
  constructor(config = fileConfig) {
    const newConf = {
      ...fileConfig,
      ...config,
    };
    super(newConf);
  }

  async submitFile(body, callback, getId = null) {
    const submitUrl = getId ? `${this.submitUrl}${getId}` : this.submitUrl;

    const formData = new FormData();
    /* eslint guard-for-in: "off" */
    for (const property in body) {
      formData.append(property, body[property]);
    }
    // TODO: Check if integration with asyncCall from global service
    // is possible
    return fetch(submitUrl, {
      method: this.method,
      body: formData,
    }).then((responseLogo) => {
      if (responseLogo.status === 401) {
        handleUnauthorized();
        return new Promise(() => {});
      }
      const json = responseLogo.json();
      if (!json?.error) {
        /* eslint no-unused-expressions: "off" */
        callback && callback(json);
      }
      // TODO: Handle undefined response
      return json;
    });
  }
}

export default File;
