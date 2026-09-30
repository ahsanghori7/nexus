// Mock for v2/helpers/url
export const goTo = jest.fn();
export const goToNewTab = jest.fn();
export const getProjectLogo = jest.fn((id = '') => `project-logo-${id}`);
export const prosperViewProject = jest.fn((id = '') => `/projects/${id}`);
export const getUrlWithoutParamers = jest.fn((url) => {
  if (!url) return '';
  return url.split('?')[0];
});
export const getQueryStringVars = jest.fn(() => ({
  model: 'projects',
  search: 'test search'
}));

// Mock for wistiaConfigUrl used in resources pages
export const wistiaConfigUrl = jest.fn((id, path = '') => {
  return `https://fast.wistia.com/embed/medias/${id}${path}.jsonp`;
});

// Mock for checkIfImageExists used in Interest component
export const checkIfImageExists = jest.fn((url, callback) => {
  // By default, assume images exist
  if (callback) callback(true);
});
