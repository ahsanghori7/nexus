import ClinkService from 'v1/global/services/clink';

class ProjectService extends ClinkService {
  static TENDER_DRAFT_STATE = 1;

  static TENDER_PUBLISH_STATE = 2;

  async projectAction(
    params,
    showAlert,
    callback,
    body = {},
    optionsSuccess = {},
    options = null
  ) {
    const { method, ...rest } = params;
    let queryString = `?action=project&method=${method}`;
    for (const [key, value] of Object.entries(rest)) {
      queryString = `${queryString}&${key}=${value}`;
    }
    this.submitUrl = `${BASE_URLS.CLINK_APP_HOST}/relay${queryString}`;
    return this.asyncCall(body, options).then((result) => {
      if (showAlert) {
        this.alert(result, callback, optionsSuccess);
      }
      return result;
    });
  }

  async getOne(data = {}) {
    const params = {
      ...data,
      method: 'getOne',
    };
    this.method = 'GET';
    return this.projectAction(params);
  }
}

export default ProjectService;
