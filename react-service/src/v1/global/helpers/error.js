const getErrorMessage = (suffix, prefix = 'An error occurred') => {
  return `${prefix} ${suffix}`;
};

const getFetchError = (source) => {
  return getErrorMessage(`fetching ${source}`);
};

export { getErrorMessage, getFetchError };
