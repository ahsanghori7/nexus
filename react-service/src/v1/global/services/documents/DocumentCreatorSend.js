import { handleUnauthorized } from 'v2/helpers/session';

const DocController = (body, callback, catchCallback) => {
  const url = `${BASE_URLS.CLINK_APP_HOST}/document-creator/send`;
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  })
    .then(async (response) => {
      if (response.status === 401) {
        handleUnauthorized();
        return new Promise(() => {});
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = Object.assign(
          new Error(data.message || `Request failed with status ${response.status}`),
          {
          status: response.status,
          ...data,
          },
        );
        throw error;
      }

      return data;
    })
    .then(callback)
    .catch(catchCallback);
};

export default DocController;
