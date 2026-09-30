import Cookies from 'js-cookie';
import { handleUnauthorized } from 'v2/helpers/session';

// TODO: To remove this function and use the new one
const httpHelper = async ({
  url,
  base = API.RELAY_URL,
  method = 'GET', // IMPORTANT: method need to be set with capital letters
  headers = {},
  body = null,
  isFormData = false,
}) => {
  try {
    const token = Cookies.get(API.TOKEN_NAME);
    // TODO: Check the slash in the url to avoid issues

    const response = await fetch(`${base}${url}`, {
      method,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
        ...headers,
      },
      body: body && !isFormData ? JSON.stringify(body) : body,
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized();
        return new Promise(() => {});
      }
      return response.statusText;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return error;
  }
};

const httpHelperV2 = async ({
  url,
  base = API.RELAY_URL,
  method = 'GET', // IMPORTANT: method needs to be capitalized
  headers = {},
  body = null,
  isFormData = false,
  responseType = 'json', // 'json', 'blob', 'text'
}) => {
  try {
    const token = Cookies.get(API.TOKEN_NAME);

    const response = await fetch(`${base}${url}`, {
      method,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
        ...headers,
      },
      body: body && !isFormData ? JSON.stringify(body) : body,
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized();
        return new Promise(() => {});
      }

      let errorDetails;
      try {
        errorDetails = await response.json();
      } catch (e) {
        errorDetails = { message: await response.text() };
      }

      const error = new Error(
        errorDetails?.error?.message ||
        errorDetails?.message ||
        errorDetails?.data?.message ||
        response.statusText,
      );
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = errorDetails;
      throw error;
    }

    // ✅ Handle different response types safely
    switch (responseType) {
      case 'blob':
        return await response.blob();
      case 'text':
        return await response.text();
      case 'json':
      default:
        try {
          return await response.json();
        } catch (e) {
          throw new Error('Failed to parse response');
        }
    }
  } catch (error) {
    if (error.status && error.response) {
      throw error;
    }
    throw error;
  }
};


export default httpHelper;
export { httpHelperV2 };
