import i18next from 'v2/helpers/i18n';
import WISTIA from 'v2/constants/wistia';

/**
 * @param name string
 * @returns string
 */
const getBaseUrl = (name) => {
  const key = name.toUpperCase();
  if (Object.prototype.hasOwnProperty.call(BASE_URLS, key)) {
    return BASE_URLS[key];
  }
  throw Error(`Invalid base url key ${key}`);
};

/**
 * @param base string
 * @param pages array
 * @param targetBlank boolean
 * @returns object
 */
const createBreadcrumbs = (
  base,
  pages = [],
  targetBlank = false,
  reactLink = true,
) => {
  return {
    items: pages.map((page) => ({
      id: `${base}${page.path || ''}${page.keyTitle || ''}`,
      url: `${base}${page.path ? `/${page.path}` : ''}`,
      text: i18next.t(page.keyTitle) || '',
      reactLink,
    })),
    targetBlank,
  };
};

/**
 * @param app
 * @param prefix
 * @returns {string}
 */
const getUrl = (app, prefix = '') => {
  let url = getBaseUrl(app);

  if (prefix) {
    // Trim trailing slashes from the base URL
    const trimmedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const trimmedPrefix = prefix.startsWith('/') ? prefix.slice(1) : prefix;

    url = `${trimmedUrl}/${trimmedPrefix}`;
  }

  return url;
};

const getUrlWithoutParamers = () => {
  const [url] = window.location.href.split('?');
  return url;
};

const resetUrl = () => {
  window.history.pushState({}, document.title, window.location.pathname);
};

/**
 * @param url
 */
const setUrl = (url = '') => {
  window.history.pushState({}, document.title, decodeURIComponent(url));
};

const goTo = (url = '') => {
  window.location.href = url;
};

const goToNewTab = (url = '') => {
  window.open(url, '_blank');
};

/**
 * @param action
 * @param method
 * @param params
 * @returns {string}
 */
const getRelayUrl = (action, method, params) => {
  let args = '';
  if (params) {
    args = Object.keys(params)
      .map((queryKey) => `&${queryKey}=${params[queryKey] || ''}`)
      .join('');
  }
  return `${BASE_URLS.CLINK_APP_HOST}/relay?action=${action}&method=${method}${args}`;
};

/**
 * @param params object
 * @returns {string}
 */
const setQueryStringVars = (params) => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  Object.keys(params).forEach((param) =>
    urlSearchParams.set(param, params[param]),
  );
  return urlSearchParams.toString();
};

/**
 * @returns {object}
 */
const getQueryStringVars = () => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  return Object.fromEntries(urlSearchParams.entries());
};

const goToSearch = (base, model, params) =>
  goTo(
    `${base}/search?${setQueryStringVars(
      model
        ? {
            model,
            ...params,
          }
        : { ...params },
    )}`,
  );

const getProjectLogo = (id) => {
  const currentDate = new Date();
  return `${
    BASE_URLS.S3_URL
  }/${ENV}/project/logo/${id}.jpg?current=${currentDate.getTime()}`;
};

function checkIfImageExists(url, callback) {
  const img = new Image();
  img.src = url;

  if (img.complete) {
    callback(true);
  } else {
    img.onload = () => {
      callback(true);
    };

    img.onerror = () => {
      callback(false);
    };
  }
}

function prosperViewProject(id) {
  return `${BASE_URLS.PROSPER}/projects/${id}`;
}

function wistiaConfigUrl(
  id,
  ext = (WISTIA && WISTIA.CONFIG_MEDIA_EXT) || '.jsonp',
  config = (WISTIA && WISTIA.CONFIG_MEDIA_URL) ||
    'https://fast.wistia.com/embed/medias/',
) {
  return `${config}${id}${ext}`;
}

function validUrl(s) {
  if (!s.includes('://')) {
    return 'https://' + s;
  }
  return s;
}

const getSlug = (l = '') =>
  l
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter((e) => e)
    .join('-');

/**
 * @param string path
 * @param object params
 * @returns {*}
 */
const applyParams = (path, params) => {
  let url = path;
  if (params) {
    url += `?${Object.keys(params)
      .map((k) => {
        return `${k}=${params[k]}`;
      })
      .join('&')}`;
  }
  return url;
};

/**
 * @param string slug
 * @param string prefix
 * @param object params
 * @returns {string}
 */
const getProjectUrl = (slug, prefix, params = {}) => {
  return getUrl(
    'clink_app_host',
    applyParams(`/main-contractor/project/${slug}/${prefix}`, params),
  );
};

const getDocCreatorUrl = (docId, type, entityId) => {
  return getUrl(
    'clink_app_host',
    `document-creator/template/${docId}/${type}/${entityId}`,
  );
};

export {
  createBreadcrumbs,
  getBaseUrl,
  getUrl,
  getUrlWithoutParamers,
  setUrl,
  goTo,
  goToSearch,
  getRelayUrl,
  setQueryStringVars,
  getQueryStringVars,
  goToNewTab,
  resetUrl,
  getProjectLogo,
  checkIfImageExists,
  prosperViewProject,
  wistiaConfigUrl,
  validUrl,
  getSlug,
  getProjectUrl,
  getDocCreatorUrl,
};
